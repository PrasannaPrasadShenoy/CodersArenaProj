import User from "../models/User.js";
import Session from "../models/Session.js";
import { loadProblem } from "../services/problemLoader.js";
import { computeMlProgressForUser } from "../lib/mlProgress.js";
import { ENV } from "../lib/env.js";

export async function getMyProgress(req, res) {
  try {
    const user = await User.findById(req.user._id).select("solvedProblemKeys dsaPublicClearedIds");
    const keys = user?.solvedProblemKeys || [];
    const dsaSolvedIds = keys
      .filter((k) => typeof k === "string" && k.startsWith("dsa:"))
      .map((k) => k.slice(4));

    const publicCleared = Array.isArray(user?.dsaPublicClearedIds) ? user.dsaPublicClearedIds : [];

    let ml = null;
    if (ENV.ENABLE_ML_TRACK === "1") {
      ml = await computeMlProgressForUser(req.user._id);
    }

    const totalSessions = await Session.countDocuments({
      $or: [{ host: req.user._id }, { participant: req.user._id }, { participant2: req.user._id }],
    });

    const problemsSolvedTotal = dsaSolvedIds.length + (ml?.solved ?? 0);

    return res.status(200).json({
      dsa: {
        solvedIds: dsaSolvedIds,
        solvedCount: dsaSolvedIds.length,
        publicClearedIds: publicCleared,
        publicClearedCount: publicCleared.length,
      },
      ml,
      totalSessions,
      problemsSolvedTotal,
    });
  } catch (error) {
    console.error("getMyProgress error:", error.message);
    return res.status(500).json({ error: "Failed to load progress" });
  }
}

export async function recordDsaSolved(req, res) {
  try {
    const { problemId } = req.body;
    if (!problemId || typeof problemId !== "string") {
      return res.status(400).json({ error: "problemId is required" });
    }
    const id = problemId.trim();
    if (!id) {
      return res.status(400).json({ error: "problemId is required" });
    }

    try {
      loadProblem(id);
    } catch {
      return res.status(404).json({ error: "DSA problem not found" });
    }

    const key = `dsa:${id}`;
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { solvedProblemKeys: key } });

    return res.status(200).json({ ok: true, problemId: id });
  } catch (error) {
    console.error("recordDsaSolved error:", error.message);
    return res.status(500).json({ error: "Failed to record solve" });
  }
}

export async function recordDsaPublicCleared(req, res) {
  try {
    const { problemId } = req.body;
    if (!problemId || typeof problemId !== "string") {
      return res.status(400).json({ error: "problemId is required" });
    }
    const id = problemId.trim();
    if (!id) {
      return res.status(400).json({ error: "problemId is required" });
    }

    try {
      loadProblem(id);
    } catch {
      return res.status(404).json({ error: "DSA problem not found" });
    }

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { dsaPublicClearedIds: id } });

    return res.status(200).json({ ok: true, problemId: id });
  } catch (error) {
    console.error("recordDsaPublicCleared error:", error.message);
    return res.status(500).json({ error: "Failed to record progress" });
  }
}
