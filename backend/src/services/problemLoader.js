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
  const starterCode = {
    javascript: fs.readFileSync(path.join(dir, "starter.js"), "utf8"),
    python: fs.readFileSync(path.join(dir, "starter.py"), "utf8"),
    java: fs.readFileSync(path.join(dir, "starter.java"), "utf8"),
  };
  const publicTests = JSON.parse(fs.readFileSync(path.join(dir, "public_tests.json"), "utf8"));
  const hiddenTests = JSON.parse(fs.readFileSync(path.join(dir, "hidden_tests.json"), "utf8"));

  const result = {
    metadata: { ...metadata, id: metadata.id || problemId },
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
      });
      if (options.legacy) {
        listLegacy[id] = {
          id: metadata.id,
          title: metadata.title,
          difficulty: metadata.difficulty,
          category: metadata.category,
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
