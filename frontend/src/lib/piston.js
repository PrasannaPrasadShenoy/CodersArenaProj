// Code execution via backend (no external Piston API required)

const SUPPORTED_LANGUAGES = ["javascript", "python", "java"];
const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * @param {string} language - programming language (javascript, python, java)
 * @param {string} code - source code to execute
 * @returns {Promise<{success:boolean, output?:string, error?: string}>}
 */
export async function executeCode(language, code) {
  try {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return {
        success: false,
        error: `Unsupported language: ${language}`,
      };
    }

    if (!API_URL) {
      return { success: false, error: "VITE_API_URL is not set. Check your .env file." };
    }

    const url = `${API_URL.replace(/\/$/, "")}/execute`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed (${response.status})`,
      };
    }

    return {
      success: !!data.success,
      output: data.output,
      error: data.error,
    };
  } catch (error) {
    const message = error.message || "Network error";
    return {
      success: false,
      error: message.includes("fetch") ? "Cannot reach backend. Is the server running on the correct port?" : `Failed to execute code: ${message}`,
    };
  }
}
