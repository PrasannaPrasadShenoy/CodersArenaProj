import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import User from "../models/User.js";
import Submission from "../models/Submission.js";
import { deleteStreamUser, upsertStreamUser } from "./stream.js";
import { runMlJudge } from "../services/mlJudgeService.js";
import { ENV } from "./env.js";

export const inngest = new Inngest({ id: "neurohire" });

const syncUser = inngest.createFunction(
  { id: "sync-user" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    await connectDB();

    const { id, email_addresses, first_name, last_name, image_url } = event.data;

    const newUser = {
      clerkId: id,
      email: email_addresses[0]?.email_address,
      name: `${first_name || ""} ${last_name || ""}`,
      profileImage: image_url,
    };

    await User.create(newUser);

    await upsertStreamUser({
      id: newUser.clerkId.toString(),
      name: newUser.name,
      image: newUser.profileImage,
    });
  }
);

const deleteUserFromDB = inngest.createFunction(
  { id: "delete-user-from-db" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    await connectDB();

    const { id } = event.data;
    await User.deleteOne({ clerkId: id });

    await deleteStreamUser(id.toString());
  }
);

const judgeMlSubmission = inngest.createFunction(
  { id: "judge-ml-submission" },
  { event: "ml/submission.created" },
  async ({ event }) => {
    if (ENV.ENABLE_ML_TRACK !== "1") return;
    await connectDB();
    const submissionId = event.data?.submissionId;
    if (!submissionId) {
      throw new Error("submissionId is required");
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new Error(`Submission not found: ${submissionId}`);
    }
    if (submission.track !== "ml") {
      return;
    }

    submission.status = "running";
    submission.startedAt = new Date();
    submission.summary = "Running ML judge...";
    submission.error = "";
    await submission.save();
    console.info("[ml] judge started", {
      submissionId,
      problemId: submission.problemId,
      userId: submission.user.toString(),
    });

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
    console.info("[ml] judge completed", {
      submissionId,
      status: submission.status,
      score: submission.score,
      runtimeMs: submission.runtimeMs,
    });
  }
);

export const functions = [syncUser, deleteUserFromDB, judgeMlSubmission];
