import Submission from "../models/Submission.js";

const STATS_CACHE = new Map();
const CACHE_TTL_MS = 60_000;

function getCachedStats(key) {
  const entry = STATS_CACHE.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.data;
  return null;
}

function setCachedStats(key, data) {
  STATS_CACHE.set(key, { data, ts: Date.now() });
}

export async function getProblemStats(req, res) {
  try {
    const { id } = req.params;
    const track = req.query.track || "dsa";
    const cacheKey = `${track}:${id}`;

    const cached = getCachedStats(cacheKey);
    if (cached) return res.status(200).json(cached);

    const [stats] = await Submission.aggregate([
      { $match: { problemId: id, track, status: { $in: ["passed", "failed"] } } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          passedCount: { $sum: { $cond: [{ $eq: ["$status", "passed"] }, 1, 0] } },
          uniqueUsers: { $addToSet: "$user" },
          uniqueSolvers: {
            $addToSet: { $cond: [{ $eq: ["$status", "passed"] }, "$user", "$$REMOVE"] },
          },
          avgRuntimeMs: { $avg: { $cond: [{ $gt: ["$runtimeMs", 0] }, "$runtimeMs", null] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalSubmissions: 1,
          passedCount: 1,
          totalAttemptedUsers: { $size: "$uniqueUsers" },
          totalSolvedUsers: { $size: "$uniqueSolvers" },
          avgRuntimeMs: { $round: ["$avgRuntimeMs", 0] },
        },
      },
    ]);

    const result = stats || {
      totalSubmissions: 0,
      passedCount: 0,
      totalAttemptedUsers: 0,
      totalSolvedUsers: 0,
      avgRuntimeMs: null,
    };

    result.solveRate =
      result.totalAttemptedUsers > 0
        ? Math.round((result.totalSolvedUsers / result.totalAttemptedUsers) * 100)
        : null;

    setCachedStats(cacheKey, result);
    return res.status(200).json(result);
  } catch (error) {
    console.error("getProblemStats error:", error.message);
    return res.status(500).json({ error: "Failed to load problem stats" });
  }
}

export async function getBatchProblemStats(req, res) {
  try {
    const track = req.query.track || "dsa";
    const cacheKey = `batch:${track}`;

    const cached = getCachedStats(cacheKey);
    if (cached) return res.status(200).json(cached);

    const stats = await Submission.aggregate([
      { $match: { track, status: { $in: ["passed", "failed"] } } },
      {
        $group: {
          _id: "$problemId",
          totalSubmissions: { $sum: 1 },
          passedCount: { $sum: { $cond: [{ $eq: ["$status", "passed"] }, 1, 0] } },
          uniqueUsers: { $addToSet: "$user" },
          uniqueSolvers: {
            $addToSet: { $cond: [{ $eq: ["$status", "passed"] }, "$user", "$$REMOVE"] },
          },
          avgRuntimeMs: { $avg: { $cond: [{ $gt: ["$runtimeMs", 0] }, "$runtimeMs", null] } },
        },
      },
      {
        $project: {
          problemId: "$_id",
          _id: 0,
          totalSubmissions: 1,
          passedCount: 1,
          totalAttemptedUsers: { $size: "$uniqueUsers" },
          totalSolvedUsers: { $size: "$uniqueSolvers" },
          avgRuntimeMs: { $round: ["$avgRuntimeMs", 0] },
        },
      },
    ]);

    const byProblem = {};
    for (const s of stats) {
      s.solveRate =
        s.totalAttemptedUsers > 0
          ? Math.round((s.totalSolvedUsers / s.totalAttemptedUsers) * 100)
          : null;
      byProblem[s.problemId] = s;
    }

    setCachedStats(cacheKey, byProblem);
    return res.status(200).json(byProblem);
  } catch (error) {
    console.error("getBatchProblemStats error:", error.message);
    return res.status(500).json({ error: "Failed to load problem stats" });
  }
}
