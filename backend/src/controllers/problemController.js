import { loadProblem, getAllProblems } from "../services/problemLoader.js";

/**
 * GET /api/problems — list all problems (metadata only).
 * Query: ?legacy=1 returns object keyed by id for legacy frontend.
 */
export function listProblems(req, res) {
  try {
    const legacy = req.query.legacy === "1" || req.query.legacy === "true";
    const list = getAllProblems({ legacy });

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
    const problem = loadProblem(id, { legacy });

    return res.status(200).json(problem);
  } catch (error) {
    if (error.message.includes("not found") || error.message.includes("Missing required")) {
      return res.status(404).json({ error: error.message });
    }
    console.error("getProblemById error:", error.message);
    return res.status(500).json({ error: "Failed to load problem" });
  }
}
