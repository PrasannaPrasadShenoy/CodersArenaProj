import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  getWhiteboardSnapshot,
  saveWhiteboardSnapshot,
} from "../controllers/whiteboardController.js";

const router = express.Router();

router.get("/:roomId", protectRoute, getWhiteboardSnapshot);
router.put("/:roomId", protectRoute, saveWhiteboardSnapshot);

export default router;

