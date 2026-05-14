const DEFAULT_DEV_API = "http://localhost:3000/api";

/**
 * Base URL for REST calls (axios), no trailing slash.
 * Matches README: VITE_API_URL=http://localhost:3000/api
 */
export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  if (raw && String(raw).trim()) {
    return String(raw).replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return DEFAULT_DEV_API;
  }
  return `${window.location.origin.replace(/\/$/, "")}/api`;
}

/**
 * Origin of the Node server that hosts Socket.IO (no /api suffix).
 * Socket.IO attaches to the HTTP server root; /api is only for Express routers.
 */
export function getSocketBaseUrl() {
  const api = getApiBaseUrl();
  if (api.endsWith("/api")) {
    return api.slice(0, -4);
  }
  try {
    return new URL(api).origin;
  } catch {
    return window.location.origin.replace(/\/$/, "");
  }
}
