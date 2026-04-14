import { ENV } from "../lib/env.js";

const buckets = new Map();

/** Clears in-memory rate limit state (for tests). */
export function clearExecuteRateLimitBuckets() {
  buckets.clear();
}

function pruneBuckets(now) {
  for (const [key, b] of buckets) {
    if (now >= b.resetAt) buckets.delete(key);
  }
}

/**
 * Per-user sliding window for POST /api/execute (requires protectRoute first).
 */
export function executeRateLimit(req, res, next) {
  const userId = req.user?._id?.toString();
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const windowMs = ENV.EXECUTE_RATE_LIMIT_WINDOW_MS;
  const max = ENV.EXECUTE_RATE_LIMIT_MAX;
  const now = Date.now();

  if (buckets.size > 10000) pruneBuckets(now);

  let b = buckets.get(userId);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(userId, b);
  }

  b.count += 1;
  if (b.count > max) {
    return res.status(429).json({
      success: false,
      error: "Too many code executions. Try again in a minute.",
    });
  }

  next();
}
