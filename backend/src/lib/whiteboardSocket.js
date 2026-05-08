import { verifyToken } from "@clerk/express";
import Whiteboard from "../models/Whiteboard.js";

export function initWhiteboardSocket(io) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      socket.clerkId = payload.sub;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("whiteboard:join", ({ roomId }) => {
      if (!roomId || typeof roomId !== "string") return;
      socket.join(roomId);
    });

    socket.on("whiteboard:leave", ({ roomId }) => {
      if (!roomId || typeof roomId !== "string") return;
      socket.leave(roomId);
    });

    socket.on("whiteboard:update", async ({ roomId, document }) => {
      if (!roomId || typeof roomId !== "string") return;
      if (!document || typeof document !== "object") return;

      socket.to(roomId).emit("whiteboard:update", {
        roomId,
        document,
        updatedByClerkId: socket.clerkId,
        ts: Date.now(),
      });

      try {
        await Whiteboard.findOneAndUpdate(
          { roomId },
          {
            $set: {
              document,
              updatedByClerkId: socket.clerkId,
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
