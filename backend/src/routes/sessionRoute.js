import express from "express";
import { z } from "zod";
import { protectRoute } from "../middleware/protectRoute.js";
import { validate } from "../middleware/validate.js";
import {
  createSession,
  endSession,
  getActiveSessions,
  getMyRecentSessions,
  getSessionById,
  joinSession,
} from "../controllers/sessionController.js";

const createSessionSchema = z.object({
  problem: z.string().optional(),
  problemId: z.string().optional().default(""),
  problemTrack: z.enum(["dsa", "ml"]).optional().default("dsa"),
  difficulty: z.string().optional(),
  sessionType: z.enum(["coding", "discussion"]).optional().default("coding"),
  topic: z.string().optional().default(""),
});

const router = express.Router();

router.post("/", protectRoute, validate(createSessionSchema), createSession);
router.get("/active", protectRoute, getActiveSessions);
router.get("/my-recent", protectRoute, getMyRecentSessions);

router.get("/:id", protectRoute, getSessionById);
router.post("/:id/join", protectRoute, joinSession);
router.post("/:id/end", protectRoute, endSession);

export default router;
