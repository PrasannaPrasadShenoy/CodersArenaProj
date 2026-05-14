import {
  loadProblem,
  parseArgsInputString,
  pyArgLiteral,
  javaSampleExpr,
} from "./problemLoader.js";
import { runUserProgram } from "../lib/codeRunner.js";

function normalizeDsaOutput(output) {
  if (output == null) return "";
  let s = String(output).replace(/\r\n/g, "\n").trim();
  // Node's console.log can break large arrays across lines (util.inspect).
  if (s.startsWith("[") && s.endsWith("]") && s.includes("\n")) {
    s = s.replace(/\n/g, " ");
  }
  return s
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

function buildJsInvoke(fnName, parsed) {
  const jsArgStr = parsed.map((a) => JSON.stringify(a)).join(", ");
  // JSON.stringify avoids Node's multi-line util.inspect for large arrays (e.g. sliding-window-maximum).
  return `console.log(JSON.stringify(${fnName}(${jsArgStr})));`;
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
  // Plain println on primitive arrays yields "[I@…"; match expected "[1, 2]" style.
  return `{
    Object __dsa = ${fnName}(${javaArgStr});
    if (__dsa instanceof int[]) {
      System.out.println(java.util.Arrays.toString((int[]) __dsa));
    } else if (__dsa instanceof long[]) {
      System.out.println(java.util.Arrays.toString((long[]) __dsa));
    } else if (__dsa instanceof double[]) {
      System.out.println(java.util.Arrays.toString((double[]) __dsa));
    } else if (__dsa instanceof byte[]) {
      System.out.println(java.util.Arrays.toString((byte[]) __dsa));
    } else if (__dsa instanceof short[]) {
      System.out.println(java.util.Arrays.toString((short[]) __dsa));
    } else if (__dsa instanceof char[]) {
      System.out.println(java.util.Arrays.toString((char[]) __dsa));
    } else if (__dsa instanceof float[]) {
      System.out.println(java.util.Arrays.toString((float[]) __dsa));
    } else if (__dsa instanceof boolean[]) {
      System.out.println(java.util.Arrays.toString((boolean[]) __dsa));
    } else if (__dsa instanceof int[][]) {
      System.out.println(java.util.Arrays.deepToString((int[][]) __dsa));
    } else if (__dsa instanceof Integer[]) {
      System.out.println(java.util.Arrays.toString((Integer[]) __dsa));
    } else {
      System.out.println(__dsa);
    }
  }`;
}

/**
 * Replace the entire `main` method body with a single judge invoke line.
 * Regex-based replacement failed when users added multiple sample prints or used different
 * indentation, so every test run re-executed all samples and stdout looked like one concatenated blob.
 */
function assembleJavaUserCode(javaCode, invokeLine) {
  const mainRe =
    /(^|\n)(\s*)public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*args\s*\)\s*\{/;
  const m = javaCode.match(mainRe);
  if (!m) {
    if (javaCode.includes("// Add local tests here.")) {
      return javaCode.replace("// Add local tests here.", invokeLine);
    }
    return javaCode;
  }

  const braceOpen = m.index + m[0].length - 1;
  const methodIndent = m[2];
  const bodyIndent = `${methodIndent}  `;

  let depth = 0;
  for (let i = braceOpen; i < javaCode.length; i++) {
    const ch = javaCode[i];
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      let closed = false;
      for (; j < javaCode.length; j++) {
        const cj = javaCode[j];
        if (cj === "\\") {
          j++;
          continue;
        }
        if (cj === quote) {
          i = j;
          closed = true;
          break;
        }
      }
      if (!closed) {
        i = javaCode.length - 1;
      }
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return (
          javaCode.slice(0, braceOpen + 1) +
          `\n${bodyIndent}${invokeLine}\n${methodIndent}` +
          javaCode.slice(i)
        );
      }
    }
  }

  if (javaCode.includes("// Add local tests here.")) {
    return javaCode.replace("// Add local tests here.", invokeLine);
  }
  return javaCode;
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
    if (language === "javascript") invokeLine = buildJsInvoke(fnName, parsed);
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
