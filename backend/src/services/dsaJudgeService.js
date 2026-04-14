import {
  loadProblem,
  parseArgsInputString,
  pyArgLiteral,
  javaSampleExpr,
} from "./problemLoader.js";
import { runUserProgram } from "../lib/codeRunner.js";

function normalizeDsaOutput(output) {
  if (output == null) return "";
  return String(output)
    .trim()
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/\[\s+/g, "[")
        .replace(/\s+\]/g, "]")
        .replace(/\s*,\s*/g, ",")
    )
    .filter((line) => line.length > 0)
    .join("\n");
}

function outputsMatch(actual, expected) {
  return normalizeDsaOutput(actual) === normalizeDsaOutput(expected);
}

function extractFnName(code, language) {
  if (language === "javascript") {
    return code.match(/function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/)?.[1] || "solve";
  }
  if (language === "python") {
    return code.match(/def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/)?.[1] || "solve";
  }
  if (language === "java") {
    return (
      code.match(/static\s+[A-Za-z0-9_<>\[\]]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/)?.[1] || "solve"
    );
  }
  return "solve";
}

function stripJsSamples(code) {
  const i = code.indexOf("// Sample calls");
  if (i === -1) return code.trim();
  return code.slice(0, i).trim();
}

function stripPySamples(code) {
  const i = code.indexOf("# Sample calls");
  if (i === -1) return code.trim();
  return code.slice(0, i).trim();
}

function buildJsInvoke(fnName, parsed, problemId) {
  const jsArgStr = parsed.map((a) => JSON.stringify(a)).join(", ");
  const op0 = parsed[0]?.[0];
  const wrapJson =
    typeof op0 === "string" && (op0 === "Twitter" || op0 === "KthLargest");
  if (wrapJson) {
    return `console.log(JSON.stringify(${fnName}(${jsArgStr})));`;
  }
  return `console.log(${fnName}(${jsArgStr}));`;
}

function buildPyInvoke(fnName, parsed) {
  const pyArgStr = parsed.map((a) => pyArgLiteral(a)).join(", ");
  const op0 = parsed[0]?.[0];
  const wrapJson =
    typeof op0 === "string" && (op0 === "Twitter" || op0 === "KthLargest");
  if (wrapJson) {
    return `print(__import__("json").dumps(${fnName}(${pyArgStr}), separators=(',', ':')))`;
  }
  return `print(${fnName}(${pyArgStr}))`;
}

function buildJavaInvoke(fnName, parsed) {
  const javaArgStr = parsed.map(javaSampleExpr).join(", ");
  return `System.out.println(${fnName}(${javaArgStr}));`;
}

function assembleJavaUserCode(javaCode, invokeLine) {
  const line = invokeLine;
  let out = javaCode.replace(
    /public static void main\(String\[] args\) \{[\s\S]*?\n  \}/m,
    `public static void main(String[] args) {\n    ${line}\n  }`
  );
  if (out === javaCode && javaCode.includes("// Add local tests here.")) {
    out = javaCode.replace("// Add local tests here.", line);
  }
  return out;
}

function assembleProgram(language, code, invokeLine) {
  if (language === "javascript") {
    return `${stripJsSamples(code)}\n\n${invokeLine}`;
  }
  if (language === "python") {
    return `${stripPySamples(code)}\n\n${invokeLine}`;
  }
  if (language === "java") {
    return assembleJavaUserCode(code, invokeLine);
  }
  return code;
}

/**
 * Runs public + hidden tests for a DSA problem on disk.
 * @param {{ problemId: string, language: string, code: string, publicOnly?: boolean }} opts
 * @returns {{ status: string, summary: string, testResults: Array, runtimeMs: number, error: string }}
 */
export function runDsaJudge({ problemId, language, code, publicOnly = false }) {
  const supported = ["javascript", "python", "java"];
  if (!supported.includes(language)) {
    return {
      status: "error",
      summary: "Unsupported language",
      testResults: [],
      runtimeMs: 0,
      error: `Use one of: ${supported.join(", ")}`,
    };
  }

  let raw;
  try {
    raw = loadProblem(problemId);
  } catch (e) {
    return {
      status: "error",
      summary: "Problem not found",
      testResults: [],
      runtimeMs: 0,
      error: e.message || "Problem not found",
    };
  }

  if ((raw.metadata?.track || "dsa") !== "dsa") {
    return {
      status: "error",
      summary: "Not a DSA problem",
      testResults: [],
      runtimeMs: 0,
      error: "This endpoint is for DSA track problems only",
    };
  }

  const publicList = raw.publicTests?.tests || [];
  const hiddenList = raw.hiddenTests?.tests || [];
  const fnName = extractFnName(code, language);

  let tests = [
    ...publicList.map((t, i) => ({
      ...t,
      visibility: "public",
      name: `Public ${i + 1}`,
    })),
    ...hiddenList.map((t, i) => ({
      ...t,
      visibility: "hidden",
      name: `Hidden ${i + 1}`,
    })),
  ];

  if (publicOnly) {
    tests = tests.filter((t) => t.visibility === "public");
  }

  if (tests.length === 0) {
    return {
      status: "error",
      summary: "No tests configured",
      testResults: [],
      runtimeMs: 0,
      error: "Problem has no tests",
    };
  }

  const testResults = [];
  let totalMs = 0;
  let failed = false;
  let firstError = "";

  for (const t of tests) {
    const expected = t.expectedOutput?.[language];
    if (expected == null) {
      failed = true;
      testResults.push({
        name: t.name,
        visibility: t.visibility,
        passed: false,
        message: "No expected output for this language",
        actual: "",
        expected: "",
        runtimeMs: 0,
      });
      continue;
    }

    const parsed = parseArgsInputString(t.input);
    if (!Array.isArray(parsed)) {
      failed = true;
      testResults.push({
        name: t.name,
        visibility: t.visibility,
        passed: false,
        message: "Invalid test input format",
        actual: "",
        expected: String(expected),
        runtimeMs: 0,
      });
      continue;
    }

    let invokeLine;
    if (language === "javascript") invokeLine = buildJsInvoke(fnName, parsed, problemId);
    else if (language === "python") invokeLine = buildPyInvoke(fnName, parsed);
    else invokeLine = buildJavaInvoke(fnName, parsed);

    const program = assembleProgram(language, code, invokeLine);
    const t0 = Date.now();
    const run = runUserProgram(language, program);
    const dt = Date.now() - t0;
    totalMs += dt;

    if (!run.success) {
      failed = true;
      if (!firstError) firstError = run.error || "Execution failed";
      testResults.push({
        name: t.name,
        visibility: t.visibility,
        passed: false,
        message: run.error || "Runtime error",
        actual: run.output || "",
        expected: String(expected),
        runtimeMs: dt,
      });
      continue;
    }

    const pass = outputsMatch(run.output, expected);
    if (!pass) failed = true;
    testResults.push({
      name: t.name,
      visibility: t.visibility,
      passed: pass,
      message: pass ? "OK" : "Output mismatch",
      actual: run.output || "",
      expected: String(expected),
      runtimeMs: dt,
    });
  }

  const passedCount = testResults.filter((r) => r.passed).length;
  const status = failed ? "failed" : "passed";
  const summary = failed
    ? `Failed ${testResults.length - passedCount} of ${testResults.length} tests`
    : `All ${passedCount} tests passed`;

  return {
    status,
    summary,
    testResults,
    runtimeMs: totalMs,
    error: failed ? firstError || "Some tests failed" : "",
  };
}
