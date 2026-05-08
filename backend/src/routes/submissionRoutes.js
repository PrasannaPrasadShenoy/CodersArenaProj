import express from "express";
import { z } from "zod";
import { protectRoute } from "../middleware/protectRoute.js";
import { validate } from "../middleware/validate.js";
import {
  createDsaSubmission,
  createMlSubmission,
  getMlProgress,
  getSubmissionById,
} from "../controllers/submissionController.js";

const dsaSubmissionSchema = z.object({
  problemId: z.string().min(1, "problemId is required"),
  language: z.enum(["javascript", "python", "java"]),
  code: z.string().min(3, "code is required").max(50000, "code exceeds maximum size (50KB)"),
});

const mlSubmissionSchema = z.object({
  problemId: z.string().min(1, "problemId is required"),
  language: z.literal("python").optional().default("python"),
  code: z.string().min(3, "code is required").max(50000, "code exceeds maximum size (50KB)"),
});

const router = express.Router();

router.post("/dsa", protectRoute, validate(dsaSubmissionSchema), createDsaSubmission);
router.post("/ml", protectRoute, validate(mlSubmissionSchema), createMlSubmission);
router.get("/progress/ml", protectRoute, getMlProgress);
router.get("/:id", protectRoute, getSubmissionById);

export default router;
