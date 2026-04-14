import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ML_PROBLEMS_DIR = path.resolve(__dirname, "../ml-problems");
const REQUIRED_FILES = ["problem.json", "starter.py", "tests_public.json", "tests_hidden.json"];
/**
 * TorchCode-style curriculum order (see duoan/TorchCode templates).
 * Fundamentals first, then attention — only ids with folders on disk are listed.
 */
const ML_CURRICULUM_ORDER = [
  "relu",
  "softmax",
  "cross_entropy",
  "dropout",
  "embedding",
  "gelu",
  "weight_init",
  "gradient_clipping",
  "gradient_accumulation",
  "linear_regression",
  "linear",
  "layernorm",
  "batchnorm",
  "rmsnorm",
  "mlp",
  "conv2d",
  "cross_attention",
  "attention",
  "mha",
  "causal_attention",
  "gqa",
  "sliding_window",
  "linear_attention",
  "kv_cache",
  "rope",
  "flash_attention",
];

let cache = null;
let cacheTime = 0;
const CACHE_TTL_MS = process.env.NODE_ENV === "production" ? 60000 : 0;

function getProblemDirs() {
  if (!fs.existsSync(ML_PROBLEMS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(ML_PROBLEMS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function getMlTrackProblemIds() {
  const existing = new Set(getProblemDirs());
  return ML_CURRICULUM_ORDER.filter((id) => existing.has(id));
}

function mlCurriculumIndex(id) {
  const i = ML_CURRICULUM_ORDER.indexOf(id);
  return i === -1 ? 9999 : i;
}

function validateProblemDir(problemId) {
  const dir = path.join(ML_PROBLEMS_DIR, problemId);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return { valid: false, error: `ML problem folder not found: ${problemId}` };
  }

  const missing = REQUIRED_FILES.filter((name) => !fs.existsSync(path.join(dir, name)));
  if (missing.length > 0) {
    return { valid: false, error: `Missing ML required files: ${missing.join(", ")}` };
  }

  return { valid: true };
}

function normalizeMlMetadata(metadata, fallbackId) {
  return {
    id: metadata.id || fallbackId,
    title: metadata.title,
    difficulty: metadata.difficulty || "Medium",
    category: metadata.category || "Machine Learning",
    track: "ml",
    functionName: metadata.functionName || metadata.function_name || "",
    hint: metadata.hint || "",
    description: metadata.description || { text: metadata.prompt || "", notes: [] },
    examples: metadata.examples || [],
    constraints: metadata.constraints || [],
  };
}

function loadRawProblemFromDisk(problemId) {
  if (CACHE_TTL_MS > 0 && cache?.[problemId] && Date.now() - cacheTime < CACHE_TTL_MS) {
    return cache[problemId];
  }

  const validation = validateProblemDir(problemId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const dir = path.join(ML_PROBLEMS_DIR, problemId);
  const metadata = JSON.parse(fs.readFileSync(path.join(dir, "problem.json"), "utf8"));
  const starterPython = fs.readFileSync(path.join(dir, "starter.py"), "utf8");
  const publicTests = JSON.parse(fs.readFileSync(path.join(dir, "tests_public.json"), "utf8"));
  const hiddenTests = JSON.parse(fs.readFileSync(path.join(dir, "tests_hidden.json"), "utf8"));

  const result = {
    metadata: normalizeMlMetadata(metadata, problemId),
    starterCode: {
      python: starterPython,
    },
    publicTests,
    hiddenTests,
  };

  if (CACHE_TTL_MS > 0) {
    if (!cache) cache = {};
    cache[problemId] = result;
  }

  return result;
}

export function loadMlProblem(problemId, options = {}) {
  const raw = loadRawProblemFromDisk(problemId);
  if (options.legacy) {
    return toLegacyShape(raw);
  }
  return raw;
}

export function getAllMlProblems(options = {}) {
  if (CACHE_TTL_MS > 0 && cache && Date.now() - cacheTime < CACHE_TTL_MS && cache._list) {
    return options.legacy ? cache._listLegacy : cache._list;
  }

  const ids = getMlTrackProblemIds();
  const list = [];
  const listLegacy = {};

  for (const id of ids) {
    try {
      const { metadata } = loadRawProblemFromDisk(id);
      const item = {
        id: metadata.id,
        title: metadata.title,
        difficulty: metadata.difficulty,
        category: metadata.category,
        track: "ml",
        curriculumIndex: mlCurriculumIndex(metadata.id),
      };
      list.push(item);
      if (options.legacy) {
        listLegacy[metadata.id] = {
          ...item,
          description: metadata.description,
          examples: metadata.examples,
          constraints: metadata.constraints,
          hint: metadata.hint,
          functionName: metadata.functionName,
        };
      }
    } catch (error) {
      console.warn(`[mlProblemLoader] Skipping problem ${id}:`, error.message);
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

function toLegacyShape(raw) {
  const { metadata, starterCode } = raw;
  return {
    id: metadata.id,
    title: metadata.title,
    difficulty: metadata.difficulty,
    category: metadata.category,
    track: "ml",
    curriculumIndex: mlCurriculumIndex(metadata.id),
    description: metadata.description,
    examples: metadata.examples,
    constraints: metadata.constraints,
    starterCode,
    expectedOutput: {},
    hint: metadata.hint,
    functionName: metadata.functionName,
  };
}

export function invalidateMlProblemCache() {
  cache = null;
  cacheTime = 0;
}
