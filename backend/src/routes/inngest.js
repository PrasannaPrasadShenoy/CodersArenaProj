import express from "express";
import { serve } from "inngest/express";
import { inngest, functions } from "../lib/inngest.js";

const router = express.Router();

router.use(
  "/",
  serve({
    client: inngest,
    functions,
  })
);

export default router;