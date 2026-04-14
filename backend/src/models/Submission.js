import mongoose from "mongoose";

const testResultSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    visibility: { type: String, enum: ["public", "hidden"], default: "public" },
    passed: { type: Boolean, default: false },
    message: { type: String, default: "" },
    actual: { type: String, default: "" },
    expected: { type: String, default: "" },
    runtimeMs: { type: Number, default: 0 },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    problemId: { type: String, required: true, index: true },
    track: { type: String, enum: ["dsa", "ml"], default: "ml", index: true },
    language: { type: String, enum: ["javascript", "python", "java"], default: "python" },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "running", "passed", "failed", "error"],
      default: "queued",
      index: true,
    },
    attemptNo: { type: Number, default: 1 },
    queuedAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    runtimeMs: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    summary: { type: String, default: "" },
    hint: { type: String, default: "" },
    testResults: { type: [testResultSchema], default: [] },
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

submissionSchema.index({ user: 1, problemId: 1, createdAt: -1 });

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
