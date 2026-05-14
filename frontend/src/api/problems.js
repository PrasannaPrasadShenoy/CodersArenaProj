/**
 * Problems API — fetches from backend /api/problems with fallback to static PROBLEMS.
 * Keeps the same data shape the frontend expects (legacy).
 */

import axiosInstance from "../lib/axios";
import { PROBLEMS as STATIC_PROBLEMS } from "../data/problems";

const API_URL = import.meta.env.VITE_API_URL || "";

function withDefaultTrack(problem) {
  return {
    ...problem,
    track: problem?.track || "dsa",
  };
}

function normalizedStaticProblems() {
  const out = {};
  for (const [id, problem] of Object.entries(STATIC_PROBLEMS)) {
    out[id] = withDefaultTrack(problem);
  }
  return out;
}

/**
 * Fetch list of problems (metadata only) in legacy shape: { [id]: { id, title, difficulty, category, description, examples, constraints } }
 * Merges with static PROBLEMS so unmigrated problems still appear.
 */
export async function getProblemsList(track = "") {
  try {
    if (API_URL) {
      const params = new URLSearchParams({ legacy: "1" });
      if (track) params.set("track", track);
      const res = await axiosInstance.get(`/problems?${params.toString()}`);
      const apiList = res.data && typeof res.data === "object" ? res.data : {};
      const merged = normalizedStaticProblems();
      for (const [id, meta] of Object.entries(apiList)) {
        merged[id] = withDefaultTrack({ ...(STATIC_PROBLEMS[id] || {}), ...meta });
      }
      if (track) {
        const filtered = {};
        for (const [id, problem] of Object.entries(merged)) {
          if ((problem.track || "dsa") === track) {
            filtered[id] = problem;
          }
        }
        return filtered;
      }
      return merged;
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error("Failed to fetch problems list:", error.message || error);
    }
  }
  const fallback = normalizedStaticProblems();
  if (!track) return fallback;
  const filtered = {};
  for (const [id, problem] of Object.entries(fallback)) {
    if (problem.track === track) filtered[id] = problem;
  }
  return filtered;
}

/**
 * Fetch full problem by id (legacy shape including starterCode and expectedOutput).
 * Falls back to static PROBLEMS[id] on 404 or API error.
 */
export async function getProblemStats(id, track = "dsa") {
  try {
    if (API_URL && id) {
      const res = await axiosInstance.get(
        `/problems/${encodeURIComponent(id)}/stats?track=${track}`
      );
      return res.data || null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function getBatchProblemStats(track = "dsa") {
  try {
    if (API_URL) {
      const res = await axiosInstance.get(`/problems/stats/batch?track=${track}`);
      return res.data || {};
    }
  } catch {
    return {};
  }
  return {};
}

export async function getProblemById(id) {
  try {
    if (API_URL && id) {
      const res = await axiosInstance.get(`/problems/${encodeURIComponent(id)}`);
      if (res.data && res.data.id) return withDefaultTrack(res.data);
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error("Failed to fetch problem:", error.message || error);
    }
  }
  return STATIC_PROBLEMS[id] ? withDefaultTrack(STATIC_PROBLEMS[id]) : null;
}
