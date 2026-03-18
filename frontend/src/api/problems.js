/**
 * Problems API — fetches from backend /api/problems with fallback to static PROBLEMS.
 * Keeps the same data shape the frontend expects (legacy).
 */

import axiosInstance from "../lib/axios";
import { PROBLEMS as STATIC_PROBLEMS } from "../data/problems";

const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * Fetch list of problems (metadata only) in legacy shape: { [id]: { id, title, difficulty, category, description, examples, constraints } }
 * Merges with static PROBLEMS so unmigrated problems still appear.
 */
export async function getProblemsList() {
  try {
    if (API_URL) {
      const res = await axiosInstance.get("/problems?legacy=1");
      const apiList = res.data && typeof res.data === "object" ? res.data : {};
      const merged = { ...STATIC_PROBLEMS };
      for (const [id, meta] of Object.entries(apiList)) {
        merged[id] = { ...(STATIC_PROBLEMS[id] || {}), ...meta };
      }
      return merged;
    }
  } catch (_) {}
  return { ...STATIC_PROBLEMS };
}

/**
 * Fetch full problem by id (legacy shape including starterCode and expectedOutput).
 * Falls back to static PROBLEMS[id] on 404 or API error.
 */
export async function getProblemById(id) {
  try {
    if (API_URL && id) {
      const res = await axiosInstance.get(`/problems/${encodeURIComponent(id)}`);
      if (res.data && res.data.id) return res.data;
    }
  } catch (_) {}
  return STATIC_PROBLEMS[id] || null;
}
