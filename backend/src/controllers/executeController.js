import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const EXECUTE_TIMEOUT_MS = 10000;
const MAX_OUTPUT_BYTES = 500 * 1024; // 500KB

// Use same Node that's running this server (fixes PATH issues on Windows)
const NODE_CMD = process.execPath;

function runJavaScript(code) {
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

function runPython(code) {
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

function runJava(code) {
  const tmpDir = os.tmpdir();
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const runDir = path.join(tmpDir, runId);
  fs.mkdirSync(runDir, { recursive: true });
  const javaPath = path.join(runDir, "Solution.java");
  try {
    fs.writeFileSync(javaPath, code, "utf8");
    const compile = spawnSync("javac", ["Solution.java"], {
      timeout: 10000,
      maxBuffer: MAX_OUTPUT_BYTES,
      encoding: "utf8",
      cwd: runDir,
      windowsHide: true,
    });
    if (compile.status !== 0) {
      cleanupRunDir(runDir);
      return {
        success: false,
        error: (compile.stderr || "").trim() || "Compilation failed",
      };
    }
    const runResult = spawnSync("java", ["Solution"], {
      timeout: EXECUTE_TIMEOUT_MS,
      maxBuffer: MAX_OUTPUT_BYTES,
      encoding: "utf8",
      cwd: runDir,
      windowsHide: true,
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

function cleanupRunDir(dir) {
  try {
    if (!dir || !fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) fs.unlinkSync(path.join(dir, f));
    fs.rmdirSync(dir);
  } catch (_) {}
}

export async function executeCode(req, res) {
  try {
    const { language, code } = req.body;

    if (!language || typeof code !== "string") {
      return res.status(400).json({ success: false, error: "language and code are required" });
    }

    const supported = ["javascript", "python", "java"];
    if (!supported.includes(language)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language: ${language}. Use one of: ${supported.join(", ")}`,
      });
    }

    let result;
    if (language === "javascript") {
      result = runJavaScript(code);
    } else if (language === "python") {
      result = runPython(code);
    } else if (language === "java") {
      result = runJava(code);
    } else {
      return res.status(400).json({ success: false, error: "Unsupported language" });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("executeCode error:", error.message);
    const message =
      process.env.NODE_ENV === "development" ? error.message : "Internal server error";
    return res.status(500).json({ success: false, error: message });
  }
}
