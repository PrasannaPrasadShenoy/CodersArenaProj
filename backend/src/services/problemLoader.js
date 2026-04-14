/**
 * Problem Loader — Dynamically loads problems from the problems directory.
 * Each problem lives in its own folder with: problem.json, starter.js, starter.py, starter.java, public_tests.json, hidden_tests.json.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROBLEMS_DIR = path.resolve(__dirname, "../problems");
const PLACEHOLDER_ENRICHMENTS_PATH = path.resolve(__dirname, "../lib/dsaPlaceholderEnrichments.json");
const REQUIRED_FILES = [
  "problem.json",
  "starter.js",
  "starter.py",
  "starter.java",
  "public_tests.json",
  "hidden_tests.json",
];

let cache = null;
let cacheTime = 0;
const CACHE_TTL_MS = process.env.NODE_ENV === "production" ? 60000 : 0; // 1 min in prod, no cache in dev

let placeholderEnrichmentsCache = null;
function getPlaceholderEnrichments() {
  if (placeholderEnrichmentsCache !== null) return placeholderEnrichmentsCache;
  try {
    placeholderEnrichmentsCache = JSON.parse(fs.readFileSync(PLACEHOLDER_ENRICHMENTS_PATH, "utf8"));
  } catch {
    placeholderEnrichmentsCache = {};
  }
  return placeholderEnrichmentsCache;
}

export function parseArgsInputString(input) {
  const m = String(input).match(/args\s*=\s*([\s\S]+)/);
  if (!m) return null;
  try {
    return new Function(`return (${m[1]});`)();
  } catch {
    return null;
  }
}

/** Detects useless imports: only args = [[]] with expected null (per test). */
function isPlaceholderNullEmptyTests(publicTests) {
  const tests = publicTests?.tests;
  if (!Array.isArray(tests) || tests.length === 0) return false;
  return tests.every((t) => {
    const arr = parseArgsInputString(t.input);
    if (!Array.isArray(arr) || arr.length !== 1 || !Array.isArray(arr[0]) || arr[0].length !== 0) {
      return false;
    }
    const js = t.expectedOutput?.javascript;
    return js === "null";
  });
}

export function pyArgLiteral(value) {
  const json = JSON.stringify(value);
  return json.replace(/\bnull\b/g, "None").replace(/\btrue\b/g, "True").replace(/\bfalse\b/g, "False");
}

export function javaSampleExpr(value) {
  if (value === null) return "null";
  if (typeof value === "number") {
    return Number.isInteger(value) ? `Integer.valueOf(${value})` : `Double.valueOf(${value})`;
  }
  if (typeof value === "boolean") return `Boolean.valueOf(${value})`;
  if (typeof value === "string") {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "new Object[]{}";
    const allNum = value.every((x) => typeof x === "number");
    if (allNum) return `new int[]{${value.join(",")}}`;
    const allNumOrNull = value.every((x) => x === null || typeof x === "number");
    if (allNumOrNull) {
      return `new Integer[]{${value.map((x) => (x === null ? "null" : String(x))).join(",")}}`;
    }
    const allStr = value.every((x) => typeof x === "string");
    if (allStr) return `new String[]{${value.map((s) => javaSampleExpr(s)).join(",")}}`;
    const allRowsNum = value.every((x) => Array.isArray(x) && x.every((y) => typeof y === "number"));
    if (allRowsNum) {
      return `new int[][]{${value.map((row) => `new int[]{${row.join(",")}}`).join(",")}}`;
    }
    const allRowsStr = value.every((x) => Array.isArray(x) && x.every((y) => typeof y === "string"));
    if (allRowsStr) {
      return `new String[][]{${value
        .map((row) => `new String[]{${row.map((c) => javaSampleExpr(c)).join(",")}}`)
        .join(",")}}`;
    }
    return `new Object[]{${value.map((x) => javaSampleExpr(x)).join(", ")}}`;
  }
  return "null";
}

function injectSampleCalls(rawStarterCode, publicTests) {
  const tests = Array.isArray(publicTests?.tests) ? publicTests.tests : [];
  if (tests.length === 0) return rawStarterCode;

  const fnJs = rawStarterCode.javascript.match(/function\s+(\w+)\s*\(/)?.[1] || "solve";
  const fnPy = rawStarterCode.python.match(/def\s+(\w+)\s*\(/)?.[1] || "solve";
  const fnJava = rawStarterCode.java.match(/static\s+\w+\s+(\w+)\s*\(/)?.[1] || "solve";

  const jsLines = [];
  const pyLines = [];
  const javaLines = [];
  for (const t of tests.slice(0, 6)) {
    const parsed = parseArgsInputString(t.input);
    if (!Array.isArray(parsed)) continue;
    const jsArgStr = parsed.map((a) => JSON.stringify(a)).join(", ");
    const pyArgStr = parsed.map((a) => pyArgLiteral(a)).join(", ");
    const javaArgStr = parsed.map(javaSampleExpr).join(", ");
    const op0 = parsed[0]?.[0];
    const wrapJson =
      typeof op0 === "string" && (op0 === "Twitter" || op0 === "KthLargest");
    if (wrapJson) {
      jsLines.push(`console.log(JSON.stringify(${fnJs}(${jsArgStr})));`);
      pyLines.push(
        `print(__import__("json").dumps(${fnPy}(${pyArgStr}), separators=(',', ':')))`
      );
    } else {
      jsLines.push(`console.log(${fnJs}(${jsArgStr}));`);
      pyLines.push(`print(${fnPy}(${pyArgStr}))`);
    }
    javaLines.push(`System.out.println(${fnJava}(${javaArgStr}));`);
  }

  const markerJs = "// Sample calls";
  const markerPy = "# Sample calls";
  const replaceTail = (src, marker, lines) => {
    const idx = src.indexOf(marker);
    const head = idx >= 0 ? src.slice(0, idx).trimEnd() : src.trimEnd();
    if (!lines.length) return src;
    return `${head}\n\n${marker}\n${lines.join("\n")}\n`;
  };

  let javaOut = rawStarterCode.java;
  if (javaLines.length) {
    const block = javaLines.join("\n    ");
    if (javaOut.includes("// Add local tests here.")) {
      javaOut = javaOut.replace("// Add local tests here.", block);
    } else if (javaOut.includes("public static void main(String[] args) {")) {
      javaOut = javaOut.replace(
        /public static void main\(String\[] args\) \{\s*\}/,
        `public static void main(String[] args) {\n    ${block}\n  }`
      );
    }
  }

  return {
    javascript: replaceTail(rawStarterCode.javascript, markerJs, jsLines),
    python: replaceTail(rawStarterCode.python, markerPy, pyLines),
    java: javaOut,
  };
}

function inferArgumentCount(publicTests) {
  const tests = Array.isArray(publicTests?.tests) ? publicTests.tests : [];
  let maxArgs = 0;

  for (const test of tests) {
    if (!test || typeof test.input !== "string") continue;
    const match = test.input.match(/args\s*=\s*([\s\S]+)/);
    if (!match) continue;

    try {
      const parsed = new Function(`return (${match[1]});`)();
      if (Array.isArray(parsed)) {
        maxArgs = Math.max(maxArgs, parsed.length);
      }
    } catch (_) {
      // Ignore malformed imported cases and keep fallback arity.
    }
  }

  return maxArgs > 0 ? maxArgs : 1;
}

function getRepresentativeArgs(publicTests) {
  const tests = Array.isArray(publicTests?.tests) ? publicTests.tests : [];
  for (const test of tests) {
    if (!test || typeof test.input !== "string") continue;
    const match = test.input.match(/args\s*=\s*([\s\S]+)/);
    if (!match) continue;
    try {
      const parsed = new Function(`return (${match[1]});`)();
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (_) {}
  }
  return [];
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isNestedArray(value) {
  return Array.isArray(value) && value.some((v) => Array.isArray(v));
}

function inferParamNames(problemId, args, argCount) {
  const id = String(problemId || "").toLowerCase();

  if (id === "two-sum" && argCount >= 2) return ["nums", "target"];
  if (id === "gas-station" && argCount >= 2) return ["gas", "cost"];
  if (id === "insert-interval" && argCount >= 2) return ["intervals", "newInterval"];
  if (id.includes("meeting-rooms") || id.includes("interval")) return ["intervals"].slice(0, argCount);
  if (id === "unique-paths" && argCount >= 2) return ["m", "n"];
  if (id.includes("target-sum") && argCount >= 2) return ["nums", "target"];
  if (id.includes("kth") && argCount >= 2) return ["nums", "k"];
  if (id.includes("matrix")) return ["matrix"].slice(0, argCount);
  if (id.includes("grid")) return ["grid"].slice(0, argCount);
  if (id.includes("string") || id.includes("palindrome") || id.includes("word")) {
    if (argCount === 1) return ["s"];
    if (argCount >= 2) return ["s", "t"].slice(0, argCount);
  }

  const names = [];
  for (let i = 0; i < argCount; i += 1) {
    const value = args[i];
    let name;
    if (Array.isArray(value)) {
      if (i === 0) {
        if (isNestedArray(value)) name = "matrix";
        else if (isStringArray(value)) name = "words";
        else name = "nums";
      } else if (i === 1) {
        name = "arr";
      } else {
        name = `arr${i + 1}`;
      }
    } else if (typeof value === "string") {
      name = i === 0 ? "s" : i === 1 ? "t" : `str${i + 1}`;
    } else if (typeof value === "number") {
      if (i === 0) name = "n";
      else if (i === 1) name = id.includes("k") ? "k" : "target";
      else name = `num${i + 1}`;
    } else if (typeof value === "boolean") {
      name = `flag${i + 1}`;
    } else {
      name = `arg${i + 1}`;
    }
    names.push(name);
  }

  const seen = new Map();
  return names.map((name) => {
    const count = seen.get(name) || 0;
    seen.set(name, count + 1);
    return count === 0 ? name : `${name}${count + 1}`;
  });
}

function createArgList(paramNames, language) {
  if (language === "java") {
    return paramNames.map((name) => `Object ${name}`).join(", ");
  }
  return paramNames.join(", ");
}

function normalizeJsStarter(code, argList) {
  return code.replace(
    /function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*\.\.\.args\s*\)/,
    (_m, fnName) => `function ${fnName}(${argList})`
  );
}

function normalizePyStarter(code, argList) {
  return code.replace(
    /def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*\*args\s*\):/,
    (_m, fnName) => `def ${fnName}(${argList}):`
  );
}

function normalizeJavaStarter(code, argList) {
  return code.replace(
    /(public\s+static\s+[A-Za-z0-9_<>\[\]]+\s+[A-Za-z_][A-Za-z0-9_]*)\s*\(\s*Object\.\.\.\s+args\s*\)/,
    `$1(${argList})`
  );
}

function normalizeStarterCode(starterCode, publicTests, problemId) {
  const argCount = inferArgumentCount(publicTests);
  const representativeArgs = getRepresentativeArgs(publicTests);
  const paramNames = inferParamNames(problemId, representativeArgs, argCount);
  const jsArgs = createArgList(paramNames, "javascript");
  const pyArgs = createArgList(paramNames, "python");
  const javaArgs = createArgList(paramNames, "java");

  return {
    javascript: normalizeJsStarter(starterCode.javascript, jsArgs),
    python: normalizePyStarter(starterCode.python, pyArgs),
    java: normalizeJavaStarter(starterCode.java, javaArgs),
  };
}

function normalizeDescription(description, title) {
  const shouldDropDescriptionNote = (note) => {
    if (typeof note !== "string") return false;
    const normalized = note.trim().toLowerCase();
    return (
      normalized.startsWith("source: https://neetcode.io/problems/") ||
      normalized === "imported automatically from third-party problem datasets."
    );
  };

  if (description && typeof description === "object") {
    const text =
      typeof description.text === "string" && description.text.trim().length > 0
        ? description.text.trim()
        : `Solve ${title}.`;
    const notes = Array.isArray(description.notes)
      ? description.notes.filter(
          (note) =>
            typeof note === "string" &&
            note.trim().length > 0 &&
            !shouldDropDescriptionNote(note)
        )
      : [];
    return { text, notes };
  }

  if (typeof description === "string" && description.trim().length > 0) {
    return { text: description.trim(), notes: [] };
  }

  return { text: `Solve ${title}.`, notes: [] };
}

function normalizeExamples(examples, publicTests) {
  if (Array.isArray(examples) && examples.length > 0) {
    return examples
      .filter((example) => example && typeof example === "object")
      .map((example) => ({
        input: typeof example.input === "string" ? example.input : String(example.input ?? ""),
        output: typeof example.output === "string" ? example.output : String(example.output ?? ""),
        ...(example.explanation ? { explanation: String(example.explanation) } : {}),
      }))
      .filter((example) => example.input || example.output);
  }

  const tests = Array.isArray(publicTests?.tests) ? publicTests.tests : [];
  return tests.slice(0, 3).map((test, idx) => ({
    input: typeof test.input === "string" ? test.input : `Case ${idx + 1}`,
    output: String(test?.expectedOutput?.javascript ?? test?.expectedOutput?.python ?? ""),
  }));
}

function normalizeConstraints(constraints) {
  if (!Array.isArray(constraints)) {
    return ["Handle all valid inputs efficiently."];
  }
  const cleaned = constraints
    .map((constraint) => (typeof constraint === "string" ? constraint.trim() : ""))
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned : ["Handle all valid inputs efficiently."];
}

function normalizeMetadata(metadata, publicTests, fallbackId) {
  const normalizedId = metadata.id || fallbackId;
  const normalizedTitle = metadata.title || normalizedId;
  return {
    ...metadata,
    id: normalizedId,
    title: normalizedTitle,
    difficulty: metadata.difficulty || "Medium",
    category: metadata.category || "DSA",
    track: metadata.track || "dsa",
    description: normalizeDescription(metadata.description, normalizedTitle),
    examples: normalizeExamples(metadata.examples, publicTests),
    constraints: normalizeConstraints(metadata.constraints),
  };
}

function getProblemDirs() {
  if (!fs.existsSync(PROBLEMS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(PROBLEMS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function validateProblemFolder(problemId) {
  const dir = path.join(PROBLEMS_DIR, problemId);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return { valid: false, error: `Problem folder not found: ${problemId}` };
  }
  const missing = REQUIRED_FILES.filter((f) => !fs.existsSync(path.join(dir, f)));
  if (missing.length > 0) {
    return { valid: false, error: `Missing required files: ${missing.join(", ")}` };
  }
  return { valid: true };
}

function loadProblemFromDisk(problemId) {
  if (CACHE_TTL_MS > 0 && cache && cache[problemId] && Date.now() - cacheTime < CACHE_TTL_MS) {
    return cache[problemId];
  }

  const validation = validateProblemFolder(problemId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const dir = path.join(PROBLEMS_DIR, problemId);

  const metadata = JSON.parse(fs.readFileSync(path.join(dir, "problem.json"), "utf8"));
  const rawStarterCode = {
    javascript: fs.readFileSync(path.join(dir, "starter.js"), "utf8"),
    python: fs.readFileSync(path.join(dir, "starter.py"), "utf8"),
    java: fs.readFileSync(path.join(dir, "starter.java"), "utf8"),
  };
  let publicTests = JSON.parse(fs.readFileSync(path.join(dir, "public_tests.json"), "utf8"));
  const hiddenTests = JSON.parse(fs.readFileSync(path.join(dir, "hidden_tests.json"), "utf8"));

  const pid = metadata.id || problemId;
  const enrichments = getPlaceholderEnrichments();
  const publicTestsOnDisk = publicTests;
  if (enrichments[pid] && isPlaceholderNullEmptyTests(publicTestsOnDisk)) {
    const pack = enrichments[pid];
    publicTests = pack.publicTests;
    metadata.description = { text: pack.description, notes: pack.descriptionNotes || [] };
    metadata.constraints = pack.constraints;
  }

  const starterWithSamples = injectSampleCalls(rawStarterCode, publicTests);
  const starterCode = normalizeStarterCode(starterWithSamples, publicTests, pid);

  const normalizedMetadata = normalizeMetadata(metadata, publicTests, problemId);
  const result = {
    metadata: normalizedMetadata,
    starterCode,
    publicTests,
    hiddenTests,
  };

  if (CACHE_TTL_MS > 0) {
    if (!cache) cache = {};
    cache[problemId] = result;
  }

  return result;
}

/**
 * Returns full problem data for a single problem.
 * Shape: { metadata, starterCode, publicTests, hiddenTests }
 * Also supports legacy frontend shape when options.legacy === true.
 */
export function loadProblem(problemId, options = {}) {
  const raw = loadProblemFromDisk(problemId);

  if (options.legacy) {
    return toLegacyShape(raw);
  }

  return raw;
}

/**
 * Returns basic metadata for all problems (for listing).
 */
export function getAllProblems(options = {}) {
  if (CACHE_TTL_MS > 0 && cache && Date.now() - cacheTime < CACHE_TTL_MS && cache._list) {
    return options.legacy ? cache._listLegacy : cache._list;
  }

  const dirs = getProblemDirs();
  const list = [];
  const listLegacy = {};

  for (const id of dirs) {
    try {
      const { metadata } = loadProblemFromDisk(id);
      list.push({
        id: metadata.id,
        title: metadata.title,
        difficulty: metadata.difficulty,
        category: metadata.category,
        track: metadata.track || "dsa",
      });
      if (options.legacy) {
        listLegacy[id] = {
          id: metadata.id,
          title: metadata.title,
          difficulty: metadata.difficulty,
          category: metadata.category,
          track: metadata.track || "dsa",
          description: metadata.description,
          examples: metadata.examples,
          constraints: metadata.constraints,
        };
      }
    } catch (e) {
      console.warn(`[problemLoader] Skipping problem ${id}:`, e.message);
    }
  }

  if (CACHE_TTL_MS > 0) {
    if (!cache) cache = {};
    cache._list = list;
    cache._listLegacy = listLegacy;
    cacheTime = Date.now();
  }

  return options.legacy ? listLegacy : list;
}

/**
 * Converts loaded problem to the shape expected by the current frontend (PROBLEMS[id]).
 */
function toLegacyShape(raw) {
  const { metadata, starterCode, publicTests } = raw;
  return {
    id: metadata.id,
    title: metadata.title,
    difficulty: metadata.difficulty,
    category: metadata.category,
    track: metadata.track || "dsa",
    description: metadata.description,
    examples: metadata.examples,
    constraints: metadata.constraints,
    starterCode,
    expectedOutput: publicTests.combinedExpectedOutput || publicTests.expectedOutput || {},
  };
}

/**
 * Invalidates the in-memory cache (e.g. after adding a new problem).
 */
export function invalidateCache() {
  cache = null;
}

/**
 * Returns list of problem IDs that have valid folders (for validation/indexing).
 */
export function getProblemIds() {
  return getProblemDirs();
}
