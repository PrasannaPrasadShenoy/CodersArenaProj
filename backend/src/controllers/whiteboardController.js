import Session from "../models/Session.js";
import Whiteboard from "../models/Whiteboard.js";

async function isUserInSession(session, userId) {
  const uid = userId?.toString();
  return (
    session?.host?.toString() === uid ||
    session?.participant?.toString() === uid ||
    session?.participant2?.toString() === uid
  );
}

async function getAccessContext(roomId, user) {
  const linkedSession = await Session.findOne({ whiteboardRoomId: roomId }).select(
    "_id host participant participant2"
  );
  const whiteboard = await Whiteboard.findOne({ roomId });

  if (linkedSession) {
    const allowed = await isUserInSession(linkedSession, user?._id);
    return { linkedSession, whiteboard, allowed };
  }

  // Personal room: owner-only when a record exists.
  if (whiteboard?.ownerClerkId && whiteboard.ownerClerkId !== user?.clerkId) {
    return { linkedSession: null, whiteboard, allowed: false };
  }

  return { linkedSession: null, whiteboard, allowed: true };
}

export async function getWhiteboardSnapshot(req, res) {
  try {
    const { roomId } = req.params;
    if (!roomId) return res.status(400).json({ message: "roomId is required" });

    const { whiteboard, allowed } = await getAccessContext(roomId, req.user);
    if (!allowed) return res.status(403).json({ message: "Forbidden" });

    return res.status(200).json({
      roomId,
      document: whiteboard?.document || null,
      updatedAt: whiteboard?.updatedAt || null,
    });
  } catch (error) {
    console.error("Error in getWhiteboardSnapshot:", error);
    const message = process.env.NODE_ENV === "development" ? error?.message : "Internal Server Error";
    return res.status(500).json({ message });
  }
}

export async function saveWhiteboardSnapshot(req, res) {
  try {
    const { roomId } = req.params;
    const { document } = req.body || {};
    if (!roomId) return res.status(400).json({ message: "roomId is required" });
    if (!document || typeof document !== "object") {
      return res.status(400).json({ message: "document snapshot is required" });
    }

    const { linkedSession, whiteboard, allowed } = await getAccessContext(roomId, req.user);
    if (!allowed) return res.status(403).json({ message: "Forbidden" });

    const ownerClerkId = linkedSession ? "" : whiteboard?.ownerClerkId || req.user.clerkId;
    const saved = await Whiteboard.findOneAndUpdate(
      { roomId },
      {
        $set: {
          ownerClerkId,
          document,
          updatedByClerkId: req.user.clerkId,
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      roomId: saved.roomId,
      updatedAt: saved.updatedAt,
    });
  } catch (error) {
    console.error("Error in saveWhiteboardSnapshot:", error);
    const message = process.env.NODE_ENV === "development" ? error?.message : "Internal Server Error";
    return res.status(500).json({ message });
  }
}

