import { chatClient, streamClient, upsertStreamUser } from "../lib/stream.js";
import Session from "../models/Session.js";

export async function createSession(req, res) {
  try {
    const {
      problem,
      difficulty,
      sessionType = "coding",
      topic = "",
    } = req.body;
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
      if (!problem || !difficulty) {
        return res.status(400).json({ message: "Problem and difficulty are required" });
      }
    }

    if (sessionType === "discussion") {
      if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
        return res.status(400).json({ message: "Topic is required for discussion sessions" });
      }
    }

    // generate a unique call id for stream video
    const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // create session in db
    const session = await Session.create({
      sessionType,
      topic: typeof topic === "string" ? topic.trim() : "",
      problem,
      difficulty,
      host: userId,
      callId,
    });

    // Always derive a unique whiteboard room id from the session id.
    // This guarantees every new session gets a separate board instance.
    session.whiteboardRoomId = `talent-iq-whiteboard-${session._id.toString()}`;
    await session.save();

    // create stream video call
    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom:
          sessionType === "coding"
            ? { problem, difficulty, sessionId: session._id.toString() }
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
    const message =
      process.env.NODE_ENV === "development"
        ? (error.message || String(error))
        : "Internal Server Error";
    res.status(500).json({ message });
  }
}

export async function getActiveSessions(_, res) {
  try {
    const sessions = await Session.find({ status: "active" })
      .populate("host", "name profileImage email clerkId")
      .populate("participant", "name profileImage email clerkId")
      .populate("participant2", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getActiveSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;

    // get sessions where user is either host or participant
    const sessions = await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participant: userId }, { participant2: userId }],
    })
      .populate("host", "name profileImage email clerkId")
      .populate("participant", "name profileImage email clerkId")
      .populate("participant2", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getMyRecentSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId")
      .populate("participant2", "name email profileImage clerkId");

    if (!session) return res.status(404).json({ message: "Session not found" });

    res.status(200).json({ session });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Session not found" });
    }
    console.log("Error in getSessionById controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
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
      if (e.name === "CastError") return res.status(404).json({ message: "Session not found" });
      throw e;
    }
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status !== "active") {
      return res.status(400).json({ message: "Cannot join a completed session" });
    }

    if (session.host.toString() === userId.toString()) {
      return res.status(400).json({ message: "Host cannot join their own session as participant" });
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
      return res.status(409).json({ message: "Session is full" });
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
    const message =
      process.env.NODE_ENV === "development"
        ? error?.message || String(error)
        : "Internal Server Error";
    res.status(500).json({ message });
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
      if (e.name === "CastError") return res.status(404).json({ message: "Session not found" });
      throw e;
    }
    if (!session) return res.status(404).json({ message: "Session not found" });

    // check if user is the host
    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the host can end the session" });
    }

    // check if session is already completed
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session is already completed" });
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
    console.log("Error in endSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
