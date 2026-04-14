import express from "express";
import { executeCode } from "../controllers/executeController.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { executeRateLimit } from "../middleware/executeRateLimit.js";

const router = express.Router();

router.post("/", protectRoute, executeRateLimit, executeCode);

export default router;
