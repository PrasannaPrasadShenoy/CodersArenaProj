/**
 * Shared process-spawn execution for JS / Python / Java (used by /api/execute and DSA judge).
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export const EXECUTE_TIMEOUT_MS = 10000;
export const MAX_OUTPUT_BYTES = 500 * 1024;

const NODE_CMD = process.execPath;

export function runJavaScript(code) {
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, `run_${Date.now()}.js`);
  try {
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(NODE_CMD, [filePath], {
      timeout: EXECUTE_TIMEOUT_MS,
      maxBuffer: MAX_OUTPUT_BYTES,
      encoding: "utf8",
      windowsHide: true,
      shell: false,
    });
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_) {}
    const stdout = (result.stdout || "").trim();
    const stderr = (result.stderr || "").trim();
    if (result.status !== 0 || stderr) {
      return { success: false, output: stdout, error: stderr || `Exit code: ${result.status}` };
    }
    return { success: true, output: stdout || "No output" };
  } catch (err) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_) {}
    return { success: false, error: err.message || "Execution failed" };
  }
}

let _pythonCmd = null;
function getPythonCommand() {
  if (_pythonCmd) return _pythonCmd;
  const r = spawnSync("python3", ["--version"], { encoding: "utf8", windowsHide: true });
  if (r.status === 0) {
    _pythonCmd = "python3";
    return _pythonCmd;
  }
  const r2 = spawnSync("python", ["--version"], { encoding: "utf8", windowsHide: true });
  _pythonCmd = r2.status === 0 ? "python" : "python3";
  return _pythonCmd;
}

export function runPython(code) {
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, `run_${Date.now()}.py`);
  try {
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(getPythonCommand(), [filePath], {
      timeout: EXECUTE_TIMEOUT_MS,
      maxBuffer: MAX_OUTPUT_BYTES,
      encoding: "utf8",
      windowsHide: true,
    });
    if (!fs.existsSync(filePath)) return { success: false, error: "Temp file missing" };
    fs.unlinkSync(filePath);
    const stdout = (result.stdout || "").trim();
    const stderr = (result.stderr || "").trim();
    if (result.status !== 0 || stderr) {
      return { success: false, output: stdout, error: stderr || `Exit code: ${result.status}` };
    }
    return { success: true, output: stdout || "No output" };
  } catch (err) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_) {}
    return { success: false, error: err.message || "Execution failed" };
  }
}

function cleanupRunDir(dir) {
  try {
    if (!dir || !fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) fs.unlinkSync(path.join(dir, f));
    fs.rmdirSync(dir);
  } catch (_) {}
}

/** Resolve real JDK binaries — avoids macOS `/usr/bin/javac` stub when Node has a stripped PATH (IDE terminals). */
let _javaCmdCache = null;
function tryJavaPair(binDir) {
  const jc = path.join(binDir, "javac");
  const j = path.join(binDir, "java");
  if (fs.existsSync(jc) && fs.existsSync(j)) return { javac: jc, java: j };
  return null;
}
function getJavaCommands() {
  if (_javaCmdCache) return _javaCmdCache;

  const envHome = process.env.JAVA_HOME;
  if (envHome) {
    const p = tryJavaPair(path.join(envHome, "bin"));
    if (p) {
      _javaCmdCache = p;
      return p;
    }
  }

  if (process.platform === "darwin") {
    const brewRoots = [
      "/opt/homebrew/opt/openjdk@21/bin",
      "/opt/homebrew/opt/openjdk@17/bin",
      "/opt/homebrew/opt/openjdk/bin",
      "/usr/local/opt/openjdk@21/bin",
      "/usr/local/opt/openjdk@17/bin",
      "/usr/local/opt/openjdk/bin",
    ];
    for (const binDir of brewRoots) {
      const p = tryJavaPair(binDir);
      if (p) {
        _javaCmdCache = p;
        return p;
      }
    }

    try {
      const vmRoot = "/Library/Java/JavaVirtualMachines";
      if (fs.existsSync(vmRoot)) {
        const jdkDirs = fs
          .readdirSync(vmRoot)
          .filter((d) => d.endsWith(".jdk") || d.endsWith(".jre"))
          .sort()
          .reverse();
        for (const d of jdkDirs) {
          const p = tryJavaPair(path.join(vmRoot, d, "Contents/Home/bin"));
          if (p) {
            _javaCmdCache = p;
            return p;
          }
        }
      }
    } catch (_) {}
  }

  _javaCmdCache = { javac: "javac", java: "java" };
  return _javaCmdCache;
}

export function runJava(code) {
  const { javac: javacCmd, java: javaCmd } = getJavaCommands();
  const tmpDir = os.tmpdir();
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const runDir = path.join(tmpDir, runId);
  fs.mkdirSync(runDir, { recursive: true });
  const javaPath = path.join(runDir, "Solution.java");
  try {
    fs.writeFileSync(javaPath, code, "utf8");
    const compile = spawnSync(javacCmd, ["Solution.java"], {
      timeout: 10000,
      maxBuffer: MAX_OUTPUT_BYTES,
      encoding: "utf8",
      cwd: runDir,
      windowsHide: true,
      shell: false,
    });
    if (compile.status !== 0) {
      cleanupRunDir(runDir);
      return {
        success: false,
        error: (compile.stderr || "").trim() || "Compilation failed",
      };
    }
    const runResult = spawnSync(javaCmd, ["Solution"], {
      timeout: EXECUTE_TIMEOUT_MS,
      maxBuffer: MAX_OUTPUT_BYTES,
      encoding: "utf8",
      cwd: runDir,
      windowsHide: true,
      shell: false,
    });
    cleanupRunDir(runDir);
    const stdout = (runResult.stdout || "").trim();
    const stderr = (runResult.stderr || "").trim();
    if (runResult.status !== 0 || stderr) {
      return { success: false, output: stdout, error: stderr || `Exit code: ${runResult.status}` };
    }
    return { success: true, output: stdout || "No output" };
  } catch (err) {
    cleanupRunDir(runDir);
    return { success: false, error: err.message || "Execution failed" };
  }
}

export function runUserProgram(language, code) {
  if (language === "javascript") return runJavaScript(code);
  if (language === "python") return runPython(code);
  if (language === "java") return runJava(code);
  return { success: false, error: "Unsupported language" };
}
