/**
 * Problems API — route definitions for /api/problems.
 * Uses problemLoader for dynamic loading; see services/problemLoader.js.
 */

import express from "express";
import { listProblems, getProblemById } from "../controllers/problemController.js";
import { getBatchProblemStats, getProblemStats } from "../controllers/problemStatsController.js";

const router = express.Router();

router.get("/", listProblems);
router.get("/stats/batch", getBatchProblemStats);
router.get("/:id", getProblemById);
router.get("/:id/stats", getProblemStats);

export default router;
