import * as Y from "yjs";
import mongoose from "mongoose";
import Session from "../models/Session.js";

const REMOTE_ORIGIN = "relay";

/** @type {Map<string, Y.Doc>} */
const roomDocs = new Map();

function getOrCreateDoc(roomId) {
  let doc = roomDocs.get(roomId);
  if (!doc) {
    doc = new Y.Doc();
    roomDocs.set(roomId, doc);
  }
  return doc;
}

function roomIdFromSession(sessionId) {
  return `session-code:${sessionId}`;
}

async function sessionAllowsCodeRoom(sessionId, clerkId) {
  if (!sessionId || typeof clerkId !== "string") return null;
  if (!mongoose.Types.ObjectId.isValid(sessionId)) return null;
  const session = await Session.findById(sessionId)
    .populate([{ path: "host", select: "clerkId" }, { path: "participant", select: "clerkId" }, { path: "participant2", select: "clerkId" }])
    .lean();

  if (!session || session.sessionType !== "coding" || session.status !== "active") {
    return null;
  }

  const allowed = [session.host?.clerkId, session.participant?.clerkId, session.participant2?.clerkId].filter(
    Boolean
  );
  if (!allowed.includes(clerkId)) return null;
  return session;
}

/**
 * Registers collaborative code room handlers. Requires `initWhiteboardSocket(io)` to run first so
 * sockets are Clerk-authenticated (`socket.clerkId` is set by that middleware).
 */
export function initSessionCodeSocket(io) {
  io.on("connection", (socket) => {
    socket.sessionCodeRooms = new Set();
    socket.on("session-code:join", async ({ sessionId }, ack) => {
      try {
        const ok = await sessionAllowsCodeRoom(sessionId, socket.clerkId);
        if (!ok) {
          ack?.({ ok: false, error: "Forbidden or invalid session" });
          return;
        }

        const roomId = roomIdFromSession(sessionId);
        socket.join(roomId);
        socket.sessionCodeRooms.add(roomId);

        const doc = getOrCreateDoc(roomId);
        const state = Y.encodeStateAsUpdate(doc);
        socket.emit("session-code:sync", { state: Array.from(state) });

        ack?.({ ok: true });
      } catch (e) {
        console.error("session-code:join", e?.message || e);
        ack?.({ ok: false, error: "Server error" });
      }
    });

    socket.on("session-code:leave", ({ sessionId }) => {
      if (!sessionId || typeof sessionId !== "string") return;
      const roomId = roomIdFromSession(sessionId);
      socket.leave(roomId);
      socket.sessionCodeRooms?.delete(roomId);
    });

    socket.on("session-code:seed-if-empty", async ({ sessionId, starter, language }) => {
      try {
        const ok = await sessionAllowsCodeRoom(sessionId, socket.clerkId);
        if (!ok) return;

        const roomId = roomIdFromSession(sessionId);
        if (!socket.sessionCodeRooms?.has(roomId)) return;

        const doc = getOrCreateDoc(roomId);
        const ytext = doc.getText("monaco");
        const meta = doc.getMap("meta");

        const langs = ["javascript", "python", "java"];
        const langOk = typeof language === "string" && langs.includes(language);

        Y.transact(doc, () => {
          if (typeof starter === "string" && starter.length && ytext.length === 0) {
            ytext.insert(0, starter);
          }
          if (langOk && meta.get("language") == null) {
            meta.set("language", language);
          }
        }, "seed");

        const state = Y.encodeStateAsUpdate(doc);
        io.to(roomId).emit("session-code:sync", { state: Array.from(state) });
      } catch (e) {
        console.error("session-code:seed-if-empty", e?.message || e);
      }
    });

    socket.on("session-code:update", async ({ sessionId, update }) => {
      try {
        if (!Array.isArray(update) || !sessionId) return;
        const ok = await sessionAllowsCodeRoom(sessionId, socket.clerkId);
        if (!ok) return;

        const roomId = roomIdFromSession(sessionId);
        if (!socket.sessionCodeRooms?.has(roomId)) return;

        const u = new Uint8Array(update);
        const doc = getOrCreateDoc(roomId);
        Y.applyUpdate(doc, u, REMOTE_ORIGIN);

        socket.to(roomId).emit("session-code:update", { update: Array.from(u) });
      } catch (e) {
        console.error("session-code:update", e?.message || e);
      }
    });

    socket.on("disconnect", () => {
      for (const roomId of socket.sessionCodeRooms || []) {
        socket.leave(roomId);
      }
      socket.sessionCodeRooms?.clear();
    });
  });
}
