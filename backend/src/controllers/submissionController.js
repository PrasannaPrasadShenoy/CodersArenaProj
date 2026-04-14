import Submission from "../models/Submission.js";
import User from "../models/User.js";
import { loadMlProblem } from "../services/mlProblemLoader.js";
import { inngest } from "../lib/inngest.js";
import { ENV } from "../lib/env.js";
import { runMlJudge } from "../services/mlJudgeService.js";
import { computeMlProgressForUser } from "../lib/mlProgress.js";
import { runDsaJudge } from "../services/dsaJudgeService.js";

function toClientSubmission(submission) {
  return {
    id: submission._id.toString(),
    problemId: submission.problemId,
    track: submission.track,
    language: submission.language,
    status: submission.status,
    attemptNo: submission.attemptNo,
    runtimeMs: submission.runtimeMs,
    score: submission.score,
    summary: submission.summary,
    hint: submission.hint,
    testResults: submission.testResults,
    error: submission.error,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

export async function createDsaSubmission(req, res) {
  try {
    const { problemId, language, code } = req.body;
    if (!problemId || typeof problemId !== "string") {
      return res.status(400).json({ message: "problemId is required" });
    }
    const supported = ["javascript", "python", "java"];
    if (!language || !supported.includes(language)) {
      return res.status(400).json({ message: `language must be one of: ${supported.join(", ")}` });
    }
    if (!code || typeof code !== "string" || code.trim().length < 3) {
      return res.status(400).json({ message: "code is required" });
    }
    if (code.length > 50000) {
      return res.status(400).json({ message: "code exceeds maximum size (50KB)" });
    }

    const previousAttempts = await Submission.countDocuments({
      user: req.user._id,
      problemId: problemId.trim(),
      track: "dsa",
    });

    const judged = runDsaJudge({
      problemId: problemId.trim(),
      language,
      code,
    });

    if (judged.status === "error") {
      const code404 = judged.error?.includes("not found") || judged.summary === "Problem not found";
      return res.status(code404 ? 404 : 400).json({
        message: judged.error || judged.summary || "Judge failed",
      });
    }

    const submission = await Submission.create({
      user: req.user._id,
      problemId: problemId.trim(),
      track: "dsa",
      language,
      code,
      status: judged.status,
      attemptNo: previousAttempts + 1,
      runtimeMs: judged.runtimeMs,
      score: judged.status === "passed" ? 100 : 0,
      summary: judged.summary,
      testResults: judged.testResults,
      error: judged.error || "",
      completedAt: new Date(),
    });

    if (judged.status === "passed") {
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { solvedProblemKeys: `dsa:${problemId.trim()}` },
      });
    }

    return res.status(201).json({
      submission: toClientSubmission(submission),
      message: judged.status === "passed" ? "All tests passed" : "Some tests failed",
    });
  } catch (error) {
    console.error("createDsaSubmission error:", error.message);
    return res.status(500).json({ message: "Failed to create submission" });
  }
}

export async function createMlSubmission(req, res) {
  try {
    if (ENV.ENABLE_ML_TRACK !== "1") {
      return res.status(404).json({ message: "ML track is disabled" });
    }
    const { problemId, language = "python", code } = req.body;
    if (!problemId || typeof problemId !== "string") {
      return res.status(400).json({ message: "problemId is required" });
    }
    if (language !== "python") {
      return res.status(400).json({ message: "ML submissions currently support python only" });
    }
    if (!code || typeof code !== "string" || code.trim().length < 3) {
      return res.status(400).json({ message: "code is required" });
    }
    if (code.length > 50000) {
      return res.status(400).json({ message: "code exceeds maximum size (50KB)" });
    }

    const mlProblem = loadMlProblem(problemId, { legacy: true });
    if (!mlProblem || mlProblem.track !== "ml") {
      return res.status(404).json({ message: "ML problem not found" });
    }

    const previousAttempts = await Submission.countDocuments({
      user: req.user._id,
      problemId,
      track: "ml",
    });

    const submission = await Submission.create({
      user: req.user._id,
      problemId,
      track: "ml",
      language: "python",
      code,
      status: "queued",
      attemptNo: previousAttempts + 1,
      hint: mlProblem.hint || "",
      summary: "Queued for judging",
    });

    console.info("[ml] submission queued", {
      submissionId: submission._id.toString(),
      userId: req.user._id.toString(),
      problemId,
      attemptNo: submission.attemptNo,
    });

    try {
      await inngest.send({
        name: "ml/submission.created",
        data: {
          submissionId: submission._id.toString(),
          userId: req.user._id.toString(),
          problemId,
        },
      });
    } catch (queueError) {
      // Fallback for local/dev setups where Inngest event dispatch is not configured.
      console.warn("[ml] queue dispatch failed, running local fallback judge", {
        submissionId: submission._id.toString(),
        error: queueError?.message || String(queueError),
      });

      submission.status = "running";
      submission.startedAt = new Date();
      submission.summary = "Running local ML judge fallback...";
      submission.error = "";
      await submission.save();

      const judged = runMlJudge({
        problemId: submission.problemId,
        code: submission.code,
        timeoutMs: ENV.ML_JUDGE_TIMEOUT_MS,
      });

      submission.status = judged.status;
      submission.score = judged.score ?? 0;
      submission.runtimeMs = judged.runtimeMs ?? 0;
      submission.summary = judged.summary || "";
      submission.testResults = judged.testResults || [];
      submission.error = judged.error || "";
      submission.hint = judged.hint || submission.hint || "";
      submission.completedAt = new Date();
      await submission.save();

      return res.status(201).json({
        submission: toClientSubmission(submission),
        message: "Submission judged locally",
      });
    }

    return res.status(201).json({
      submission: toClientSubmission(submission),
      message: "Submission queued",
    });
  } catch (error) {
    if (error.message?.includes("not found") || error.message?.includes("Missing ML")) {
      return res.status(404).json({ message: "ML problem not found" });
    }
    console.error("createMlSubmission error:", error.message);
    return res.status(500).json({ message: "Failed to create submission" });
  }
}

export async function getSubmissionById(req, res) {
  try {
    const { id } = req.params;
    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }
    if (submission.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return res.status(200).json({ submission: toClientSubmission(submission) });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Submission not found" });
    }
    console.error("getSubmissionById error:", error.message);
    return res.status(500).json({ message: "Failed to fetch submission" });
  }
}

export async function getMlProgress(req, res) {
  try {
    if (ENV.ENABLE_ML_TRACK !== "1") {
      return res.status(404).json({ message: "ML track is disabled" });
    }
    const progress = await computeMlProgressForUser(req.user._id);
    return res.status(200).json({ progress });
  } catch (error) {
    console.error("getMlProgress error:", error.message);
    return res.status(500).json({ message: "Failed to load progress" });
  }
}
