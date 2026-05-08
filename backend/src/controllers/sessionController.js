import { chatClient, streamClient, upsertStreamUser } from "../lib/stream.js";
import Session from "../models/Session.js";

export async function createSession(req, res) {
  try {
    const {
      problem,
      problemId = "",
      problemTrack = "dsa",
      difficulty,
      sessionType = "coding",
      topic = "",
    } = req.validated || req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;
    // Ensure the user exists in Stream Chat. This prevents join/addMembers failures
    // when the Mongo user exists but the Stream user wasn't created yet.
    await upsertStreamUser({
      id: clerkId,
      name: req.user.name || "User",
      image: req.user.profileImage || "",
    });

    if (sessionType === "coding") {
      if (!problem || !difficulty || !problemTrack) {
        return res.status(400).json({ error: "Problem, track, and difficulty are required" });
      }
      if (!["dsa", "ml"].includes(problemTrack)) {
        return res.status(400).json({ error: "Invalid problem track" });
      }
    }

    if (sessionType === "discussion") {
      if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
        return res.status(400).json({ error: "Topic is required for discussion sessions" });
      }
    }

    // generate a unique call id for stream video
    const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // create session in db
    const session = await Session.create({
      sessionType,
      topic: typeof topic === "string" ? topic.trim() : "",
      problem,
      problemId,
      problemTrack,
      difficulty,
      host: userId,
      callId,
    });

    // Always derive a unique whiteboard room id from the session id.
    // This guarantees every new session gets a separate board instance.
    session.whiteboardRoomId = `neurohire-whiteboard-${session._id.toString()}`;
    await session.save();

    // create stream video call
    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom:
          sessionType === "coding"
            ? {
                problem,
                problemId,
                problemTrack,
                difficulty,
                sessionId: session._id.toString(),
              }
            : { topic: session.topic, sessionId: session._id.toString() },
      },
    });

    // chat messaging
    const channel = chatClient.channel("messaging", callId, {
      name:
        sessionType === "coding" ? `${problem} Session` : `Discussion: ${session.topic}`,
      created_by_id: clerkId,
      members: [clerkId],
    });

    await channel.create();

    res.status(201).json({ session });
  } catch (error) {
    console.error("Error in createSession controller:", error);
    const msg =
      process.env.NODE_ENV === "development"
        ? (error.message || String(error))
        : "Internal Server Error";
    res.status(500).json({ error: msg });
  }
}

export async function getActiveSessions(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { status: "active" };
    const [sessions, total] = await Promise.all([
      Session.find(filter)
        .populate("host", "name profileImage email clerkId")
        .populate("participant", "name profileImage email clerkId")
        .populate("participant2", "name profileImage email clerkId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Session.countDocuments(filter),
    ]);

    res.status(200).json({ sessions, pagination: { page, limit, total } });
  } catch (error) {
    console.error("Error in getActiveSessions controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {
      status: "completed",
      $or: [{ host: userId }, { participant: userId }, { participant2: userId }],
    };

    const [sessions, total] = await Promise.all([
      Session.find(filter)
        .populate("host", "name profileImage email clerkId")
        .populate("participant", "name profileImage email clerkId")
        .populate("participant2", "name profileImage email clerkId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Session.countDocuments(filter),
    ]);

    res.status(200).json({ sessions, pagination: { page, limit, total } });
  } catch (error) {
    console.error("Error in getMyRecentSessions controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId")
      .populate("participant2", "name email profileImage clerkId");

    if (!session) return res.status(404).json({ error: "Session not found" });

    res.status(200).json({ session });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ error: "Session not found" });
    }
    console.error("Error in getSessionById controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    let session;
    try {
      session = await Session.findById(id);
    } catch (e) {
      if (e.name === "CastError") return res.status(404).json({ error: "Session not found" });
      throw e;
    }
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (session.status !== "active") {
      return res.status(400).json({ error: "Cannot join a completed session" });
    }

    if (session.host.toString() === userId.toString()) {
      return res.status(400).json({ error: "Host cannot join their own session as participant" });
    }

    const participants = [session.participant, session.participant2].filter(Boolean);
    console.log("joinSession:", {
      sessionId: id,
      sessionType: session.sessionType,
      existingParticipants: participants.map((p) => p?.toString()),
      userId: userId?.toString(),
      clerkId,
    });
    const isAlreadyIn =
      (session.participant && session.participant.toString() === userId.toString()) ||
      (session.participant2 && session.participant2.toString() === userId.toString());
    if (isAlreadyIn) return res.status(200).json({ session });

    const maxAdditionalParticipants = session.sessionType === "discussion" ? 2 : 1;
    // Host + up to (maxAdditionalParticipants) participants
    if (participants.length >= maxAdditionalParticipants) {
      console.log("joinSession rejected (full):", {
        sessionId: id,
        sessionType: session.sessionType,
        maxAdditionalParticipants,
        existingCount: participants.length,
      });
      return res.status(409).json({ error: "Session is full" });
    }

    if (!session.participant) {
      session.participant = userId;
    } else {
      session.participant2 = userId;
    }
    await session.save();

    const channel = chatClient.channel("messaging", session.callId);
    await upsertStreamUser({
      id: clerkId,
      name: req.user.name || "User",
      image: req.user.profileImage || "",
    });
    console.log("joinSession addMembers:", { sessionId: id, sessionType: session.sessionType, clerkId });
    await channel.addMembers([clerkId]);

    res.status(200).json({ session });
  } catch (error) {
    console.error("Error in joinSession controller:", error);
    const msg =
      process.env.NODE_ENV === "development"
        ? error?.message || String(error)
        : "Internal Server Error";
    res.status(500).json({ error: msg });
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    let session;
    try {
      session = await Session.findById(id);
    } catch (e) {
      if (e.name === "CastError") return res.status(404).json({ error: "Session not found" });
      throw e;
    }
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only the host can end the session" });
    }

    if (session.status === "completed") {
      return res.status(400).json({ error: "Session is already completed" });
    }

    // delete stream video call
    const call = streamClient.video.call("default", session.callId);
    await call.delete({ hard: true });

    // delete stream chat channel
    const channel = chatClient.channel("messaging", session.callId);
    await channel.delete();

    session.status = "completed";
    await session.save();

    res.status(200).json({ session, message: "Session ended successfully" });
  } catch (error) {
    console.error("Error in endSession controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
