import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { adminGuard } from "../middleware/adminGuard.js";
import {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  getAdminSubmissions,
  checkAdminRole,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/check", protectRoute, checkAdminRole);

router.use(protectRoute, adminGuard);

router.get("/stats", getAdminStats);
router.get("/users", getAdminUsers);
router.patch("/users/:id/role", updateUserRole);
router.get("/submissions", getAdminSubmissions);

export default router;
