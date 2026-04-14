import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  createDsaSubmission,
  createMlSubmission,
  getMlProgress,
  getSubmissionById,
} from "../controllers/submissionController.js";

const router = express.Router();

router.post("/dsa", protectRoute, createDsaSubmission);
router.post("/ml", protectRoute, createMlSubmission);
router.get("/progress/ml", protectRoute, getMlProgress);
router.get("/:id", protectRoute, getSubmissionById);

export default router;
