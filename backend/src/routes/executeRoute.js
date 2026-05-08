import express from "express";
import { z } from "zod";
import { executeCode } from "../controllers/executeController.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { executeRateLimit } from "../middleware/executeRateLimit.js";
import { validate } from "../middleware/validate.js";

const executeSchema = z.object({
  language: z.enum(["javascript", "python", "java"]),
  code: z.string().min(1, "code is required"),
  problemId: z.string().optional(),
  mode: z.enum(["dsa_public"]).optional(),
});

const router = express.Router();

router.post("/", protectRoute, executeRateLimit, validate(executeSchema), executeCode);

export default router;
