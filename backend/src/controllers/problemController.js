import { loadProblem, getAllProblems } from "../services/problemLoader.js";
import { loadMlProblem, getAllMlProblems } from "../services/mlProblemLoader.js";
import { ENV } from "../lib/env.js";

function normalizeTrack(track) {
  if (!track) return "";
  const value = String(track).trim().toLowerCase();
  return value === "ml" || value === "dsa" ? value : "";
}

function mergeLegacyMaps(dsaMap, mlMap) {
  return { ...dsaMap, ...mlMap };
}

function mergeListArrays(dsaList, mlList) {
  return [...dsaList, ...mlList];
}

/**
 * GET /api/problems — list all problems (metadata only).
 * Query: ?legacy=1 returns object keyed by id for legacy frontend.
 */
export function listProblems(req, res) {
  try {
    const legacy = req.query.legacy === "1" || req.query.legacy === "true";
    const track = normalizeTrack(req.query.track);

    let list;
    const mlEnabled = ENV.ENABLE_ML_TRACK === "1";
    if (track === "dsa") {
      list = getAllProblems({ legacy });
    } else if (track === "ml") {
      if (!mlEnabled) {
        list = legacy ? {} : [];
        return res.status(200).json(legacy ? list : { problems: list });
      }
      list = getAllMlProblems({ legacy });
    } else {
      const dsa = getAllProblems({ legacy });
      const ml = mlEnabled ? getAllMlProblems({ legacy }) : legacy ? {} : [];
      list = legacy ? mergeLegacyMaps(dsa, ml) : mergeListArrays(dsa, ml);
    }

    if (legacy) {
      return res.status(200).json(list);
    }
    return res.status(200).json({ problems: list });
  } catch (error) {
    console.error("listProblems error:", error.message);
    return res.status(500).json({ error: "Failed to load problems" });
  }
}

/**
 * GET /api/problems/:id — get full problem by id.
 * Returns legacy shape by default so frontend does not break.
 */
export function getProblemById(req, res) {
  try {
    const { id } = req.params;
    const legacy = req.query.legacy !== "0" && req.query.legacy !== "false";
    const preferredTrack = normalizeTrack(req.query.track);
    let problem = null;

    const mlEnabled = ENV.ENABLE_ML_TRACK === "1";
    if (preferredTrack === "ml") {
      if (!mlEnabled) {
        return res.status(404).json({ error: "ML track is disabled" });
      }
      problem = loadMlProblem(id, { legacy });
    } else if (preferredTrack === "dsa") {
      problem = loadProblem(id, { legacy });
    } else {
      try {
        problem = loadProblem(id, { legacy });
      } catch (_) {
        if (!mlEnabled) throw new Error("Problem not found");
        problem = loadMlProblem(id, { legacy });
      }
    }

    return res.status(200).json(problem);
  } catch (error) {
    if (error.message.includes("not found") || error.message.includes("Missing required")) {
      return res.status(404).json({ error: error.message });
    }
    console.error("getProblemById error:", error.message);
    return res.status(500).json({ error: "Failed to load problem" });
  }
}
