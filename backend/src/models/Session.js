import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    sessionType: {
      type: String,
      enum: ["coding", "discussion"],
      default: "coding",
    },
    // Used for discussion sessions
    topic: {
      type: String,
      default: "",
    },
    problem: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: undefined,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // For coding sessions we keep `participant` (host vs one participant).
    // For discussion sessions we allow up to 3 total members (host + 2 participants),
    // stored as `participant` and `participant2`.
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    participant2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    // stream video call ID
    callId: {
      type: String,
      default: "",
    },
    // tldraw/excalidraw room id used for collaborative whiteboard
    whiteboardRoomId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
