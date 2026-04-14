import Submission from "../models/Submission.js";

/**
 * Aggregates ML submission stats for a user (used by GET /submissions/progress/ml and /progress/me).
 */
export async function computeMlProgressForUser(userId) {
  const submissions = await Submission.find({ user: userId, track: "ml" })
    .select("problemId status attemptNo createdAt")
    .sort({ createdAt: -1 });

  const attemptedSet = new Set();
  const solvedSet = new Set();
  const latestByProblem = {};

  for (const sub of submissions) {
    attemptedSet.add(sub.problemId);
    if (sub.status === "passed") {
      solvedSet.add(sub.problemId);
    }
    if (!latestByProblem[sub.problemId]) {
      latestByProblem[sub.problemId] = {
        status: sub.status,
        attemptNo: sub.attemptNo,
        createdAt: sub.createdAt,
      };
    }
  }

  return {
    attempted: attemptedSet.size,
    solved: solvedSet.size,
    solveRate: attemptedSet.size ? Number((solvedSet.size / attemptedSet.size).toFixed(2)) : 0,
    latestByProblem,
  };
}
