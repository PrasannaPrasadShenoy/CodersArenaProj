import mongoose from "mongoose";

const whiteboardSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // For personal (non-session) rooms, only owner can access.
    ownerClerkId: {
      type: String,
      default: "",
    },
    // Persist only document-level snapshot so collaborators share the same content.
    document: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    updatedByClerkId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Whiteboard = mongoose.model("Whiteboard", whiteboardSchema);

export default Whiteboard;

