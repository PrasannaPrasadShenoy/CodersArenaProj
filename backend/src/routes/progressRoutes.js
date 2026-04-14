import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getMyProgress, recordDsaSolved, recordDsaPublicCleared } from "../controllers/progressController.js";

const router = express.Router();

router.get("/me", protectRoute, getMyProgress);
router.post("/dsa/solved", protectRoute, recordDsaSolved);
router.post("/dsa/public-cleared", protectRoute, recordDsaPublicCleared);

export default router;
