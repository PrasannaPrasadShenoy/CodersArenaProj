import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { loadMlProblem } from "./mlProblemLoader.js";

const DEFAULT_TIMEOUT_MS = 20000;
const MAX_OUTPUT_BYTES = 1024 * 1024; // 1MB

let cachedPythonCommand = null;
function getPythonCommand() {
  if (cachedPythonCommand) return cachedPythonCommand;

  const python3Check = spawnSync("python3", ["--version"], { encoding: "utf8", windowsHide: true });
  if (python3Check.status === 0) {
    cachedPythonCommand = "python3";
    return cachedPythonCommand;
  }

  const pythonCheck = spawnSync("python", ["--version"], { encoding: "utf8", windowsHide: true });
  cachedPythonCommand = pythonCheck.status === 0 ? "python" : "python3";
  return cachedPythonCommand;
}

function cleanupRunDir(runDir) {
  try {
    if (!runDir || !fs.existsSync(runDir)) return;
    const names = fs.readdirSync(runDir);
    for (const name of names) {
      fs.unlinkSync(path.join(runDir, name));
    }
    fs.rmdirSync(runDir);
  } catch (_) {}
}

function runnerSource() {
  return `
import json
import sys
import time
import traceback

try:
    import torch
except Exception as exc:
    print(json.dumps({
      "ok": False,
      "error": "PyTorch is required for ML judging. Install torch in the backend runtime. Details: " + str(exc)
    }))
    sys.exit(0)

def _normalize(value):
    if isinstance(value, torch.Tensor):
        try:
            return value.detach().cpu()
        except Exception:
            return value
    return value

def _compare(actual, expected, test):
    if test.get("equal"):
        return actual == expected

    allclose = test.get("allclose")
    if allclose:
        rtol = allclose.get("rtol", 1e-5)
        atol = allclose.get("atol", 1e-6)
        if isinstance(actual, torch.Tensor) and isinstance(expected, torch.Tensor):
            if actual.shape != expected.shape:
                return False
            return bool(torch.allclose(actual, expected, rtol=rtol, atol=atol))
        if isinstance(actual, (float, int)) and isinstance(expected, (float, int)):
            return abs(float(actual) - float(expected)) <= max(atol, rtol * abs(float(expected)))
    return actual == expected

def _render(value):
    if isinstance(value, torch.Tensor):
        return repr(value.detach().cpu())
    return repr(value)

def _snippet_result_repr(namespace):
    for key in ("out", "actual", "result"):
        if key in namespace:
            return _render(_normalize(namespace.get(key)))
    return ""

def _snippet_expected_repr(namespace):
    if "expected" in namespace:
        return _render(_normalize(namespace.get("expected")))
    return ""

def run(code_path, tests_path):
    with open(code_path, "r", encoding="utf-8") as f:
        user_code = f.read()
    with open(tests_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    public_tests = payload.get("publicTests", [])
    hidden_tests = payload.get("hiddenTests", [])
    function_name = payload.get("functionName") or ""

    namespace = {"torch": torch, "nn": torch.nn, "__name__": "__main__"}
    exec(user_code, namespace, namespace)

    results = []
    passed_count = 0
    total_count = 0
    overall_start = time.time()

    for visibility, tests in [("public", public_tests), ("hidden", hidden_tests)]:
        for test in tests:
            total_count += 1
            started = time.time()
            name = test.get("name", "unnamed_test")
            try:
                if "code" in test:
                    test_code = str(test.get("code") or "")
                    if "{fn}" in test_code:
                        if not function_name:
                            raise ValueError("Missing functionName in problem metadata for {fn} tests")
                        test_code = test_code.replace("{fn}", function_name)
                    exec(test_code, namespace, namespace)
                    passed_count += 1
                    should_reveal = visibility == "public"
                    results.append({
                        "name": name,
                        "visibility": visibility,
                        "passed": True,
                        "actual": _snippet_result_repr(namespace) if should_reveal else "",
                        "expected": _snippet_expected_repr(namespace) if should_reveal else "",
                        "message": "",
                        "runtimeMs": int((time.time() - started) * 1000),
                    })
                else:
                    call_expr = test["call"]
                    expected_expr = test["expected"]
                    actual = eval(call_expr, namespace, namespace)
                    expected = eval(expected_expr, namespace, namespace)
                    actual_n = _normalize(actual)
                    expected_n = _normalize(expected)
                    passed = _compare(actual_n, expected_n, test)
                    if passed:
                        passed_count += 1
                    should_reveal = visibility == "public"
                    results.append({
                        "name": name,
                        "visibility": visibility,
                        "passed": bool(passed),
                        "actual": _render(actual_n) if should_reveal else "",
                        "expected": _render(expected_n) if should_reveal else "",
                        "message": "" if passed else ("Output mismatch" if should_reveal else "Hidden test failed"),
                        "runtimeMs": int((time.time() - started) * 1000),
                    })
            except Exception as exc:
                should_reveal = visibility == "public"
                results.append({
                    "name": name,
                    "visibility": visibility,
                    "passed": False,
                    "actual": _snippet_result_repr(namespace) if should_reveal else "",
                    "expected": _snippet_expected_repr(namespace) if should_reveal else "",
                    "message": str(exc) if should_reveal else "Hidden test failed",
                    "runtimeMs": int((time.time() - started) * 1000),
                })

    summary = "Passed %d/%d tests" % (passed_count, total_count)
    status = "passed" if passed_count == total_count else "failed"
    elapsed_ms = int((time.time() - overall_start) * 1000)
    print(json.dumps({
      "ok": True,
      "status": status,
      "score": float(passed_count) / float(total_count) if total_count else 0.0,
      "summary": summary,
      "runtimeMs": elapsed_ms,
      "testResults": results,
    }))

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"ok": False, "error": "Usage: runner.py <code.py> <tests.json>"}))
        sys.exit(0)
    try:
        run(sys.argv[1], sys.argv[2])
    except Exception:
        print(json.dumps({
          "ok": False,
          "error": traceback.format_exc()
        }))
`.trimStart();
}

export function runMlJudge({ problemId, code, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const problem = loadMlProblem(problemId, { legacy: false });
  const runId = `ml_judge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const runDir = path.join(os.tmpdir(), runId);
  fs.mkdirSync(runDir, { recursive: true });

  const codePath = path.join(runDir, "user_code.py");
  const testsPath = path.join(runDir, "tests_payload.json");
  const runnerPath = path.join(runDir, "runner.py");

  const testsPayload = {
    publicTests: problem.publicTests?.tests || [],
    hiddenTests: problem.hiddenTests?.tests || [],
    functionName: problem.metadata?.functionName || "",
  };

  try {
    fs.writeFileSync(codePath, code, "utf8");
    fs.writeFileSync(testsPath, JSON.stringify(testsPayload), "utf8");
    fs.writeFileSync(runnerPath, runnerSource(), "utf8");

    const result = spawnSync(getPythonCommand(), [runnerPath, codePath, testsPath], {
      timeout: timeoutMs,
      maxBuffer: MAX_OUTPUT_BYTES,
      encoding: "utf8",
      windowsHide: true,
      shell: false,
      cwd: runDir,
    });

    if (result.error) {
      return {
        status: "error",
        score: 0,
        runtimeMs: 0,
        summary: result.error.message || "Judge process error",
        testResults: [],
        error: result.error.message || "Judge process error",
      };
    }

    const stdout = (result.stdout || "").trim();
    const stderr = (result.stderr || "").trim();
    if (!stdout) {
      return {
        status: "error",
        score: 0,
        runtimeMs: 0,
        summary: "Judge returned no output",
        testResults: [],
        error: stderr || "Judge returned no output",
      };
    }

    let parsed;
    try {
      parsed = JSON.parse(stdout);
    } catch (_) {
      return {
        status: "error",
        score: 0,
        runtimeMs: 0,
        summary: "Judge output was not valid JSON",
        testResults: [],
        error: stdout || stderr,
      };
    }

    if (!parsed.ok) {
      return {
        status: "error",
        score: 0,
        runtimeMs: 0,
        summary: "Judge failed to execute",
        testResults: [],
        error: parsed.error || stderr || "Judge execution failed",
      };
    }

    return {
      status: parsed.status,
      score: parsed.score,
      runtimeMs: parsed.runtimeMs,
      summary: parsed.summary,
      testResults: parsed.testResults || [],
      error: "",
      hint: problem.metadata.hint || "",
    };
  } finally {
    cleanupRunDir(runDir);
  }
}
