// Code execution via backend (uses axios + Clerk token; requires signed-in user)

import axiosInstance from "./axios";

const SUPPORTED_LANGUAGES = ["javascript", "python", "java"];

/**
 * @param {string} language
 * @param {string} code
 * @param {{ problemId?: string; mode?: "dsa_public" }} [options]
 */
export async function executeCode(language, code, options = {}) {
  try {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return {
        success: false,
        error: `Unsupported language: ${language}`,
      };
    }

    if (!import.meta.env.VITE_API_URL) {
      return { success: false, error: "VITE_API_URL is not set. Check your .env file." };
    }

    const body = { language, code };
    if (options.problemId && options.mode === "dsa_public") {
      body.problemId = options.problemId;
      body.mode = "dsa_public";
    }

    const response = await axiosInstance.post("/execute", body);
    const data = response.data || {};

    if (data.mode === "dsa_public") {
      return {
        success: !!data.success,
        mode: "dsa_public",
        summary: data.summary,
        testResults: data.testResults || [],
        runtimeMs: data.runtimeMs,
        error: data.error || "",
      };
    }

    if (data.legacyFallback) {
      return {
        success: !!data.success,
        output: data.output,
        error: data.error,
        legacyFallback: true,
      };
    }

    return {
      success: !!data.success,
      output: data.output,
      error: data.error,
    };
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data || {};
    const message = data.error || data.message || error.message || "Network error";
    if (status === 401) {
      return { success: false, error: "Sign in required to run code." };
    }
    if (status === 429) {
      return { success: false, error: message || "Too many runs. Try again shortly." };
    }
    return {
      success: false,
      error: message.includes("Network") ? "Cannot reach backend. Is the server running?" : message,
    };
  }
}
