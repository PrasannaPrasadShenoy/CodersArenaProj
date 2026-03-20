import Whiteboard from "../models/Whiteboard.js";

export function initWhiteboardSocket(io) {
  io.on("connection", (socket) => {
    socket.on("whiteboard:join", ({ roomId }) => {
      if (!roomId || typeof roomId !== "string") return;
      socket.join(roomId);
    });

    socket.on("whiteboard:leave", ({ roomId }) => {
      if (!roomId || typeof roomId !== "string") return;
      socket.leave(roomId);
    });

    socket.on("whiteboard:update", async ({ roomId, document, updatedByClerkId }) => {
      if (!roomId || typeof roomId !== "string") return;
      if (!document || typeof document !== "object") return;

      // Broadcast to everyone else in the same board room.
      socket.to(roomId).emit("whiteboard:update", {
        roomId,
        document,
        updatedByClerkId: updatedByClerkId || "",
        ts: Date.now(),
      });

      // Best-effort persistence for realtime updates.
      try {
        await Whiteboard.findOneAndUpdate(
          { roomId },
          {
            $set: {
              document,
              updatedByClerkId: updatedByClerkId || "",
              ownerClerkId: "",
            },
          },
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error("whiteboard:update persistence error:", error?.message || error);
      }
    });
  });
}

