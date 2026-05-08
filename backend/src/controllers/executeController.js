import { runUserProgram } from "../lib/codeRunner.js";
import { ENV } from "../lib/env.js";
import { runDsaJudge } from "../services/dsaJudgeService.js";

export async function executeCode(req, res) {
  try {
    const { language, code, problemId, mode } = req.validated;

    if (code.length > ENV.EXECUTE_MAX_CODE_CHARS) {
      return res.status(400).json({
        success: false,
        error: `Code exceeds maximum length (${ENV.EXECUTE_MAX_CODE_CHARS} characters)`,
      });
    }

    if (mode === "dsa_public" && typeof problemId === "string" && problemId.trim()) {
      const judged = runDsaJudge({
        problemId: problemId.trim(),
        language,
        code,
        publicOnly: true,
      });

      if (judged.status === "error") {
        const notFound =
          judged.summary === "Problem not found" ||
          /not found/i.test(judged.error || "") ||
          judged.error === "Problem not found";
        if (notFound) {
          const legacy = runUserProgram(language, code);
          return res.status(200).json({ ...legacy, legacyFallback: true });
        }
        return res.status(400).json({
          success: false,
          error: judged.error || judged.summary || "Run failed",
        });
      }

      return res.status(200).json({
        success: judged.status === "passed",
        mode: "dsa_public",
        summary: judged.summary,
        testResults: judged.testResults,
        runtimeMs: judged.runtimeMs,
        error: judged.status === "passed" ? "" : judged.error || "",
      });
    }

    const result = runUserProgram(language, code);
    return res.status(200).json(result);
  } catch (error) {
    console.error("executeCode error:", error.message);
    const message =
      process.env.NODE_ENV === "development" ? error.message : "Internal server error";
    return res.status(500).json({ success: false, error: message });
  }
}
