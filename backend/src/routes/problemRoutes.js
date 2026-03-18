import express from "express";
import { listProblems, getProblemById } from "../controllers/problemController.js";

const router = express.Router();

router.get("/", listProblems);
router.get("/:id", getProblemById);

export default router;
