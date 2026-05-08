import { ENV } from "../lib/env.js";

const buckets = new Map();

let pruneTimer = null;

function startPruneTimer() {
  if (pruneTimer) return;
  pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, b] of buckets) {
      if (now >= b.resetAt) buckets.delete(key);
    }
    if (buckets.size === 0) {
      clearInterval(pruneTimer);
      pruneTimer = null;
    }
  }, 60_000);
  pruneTimer.unref();
}

export function clearExecuteRateLimitBuckets() {
  buckets.clear();
}

export function executeRateLimit(req, res, next) {
  const userId = req.user?._id?.toString();
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const windowMs = ENV.EXECUTE_RATE_LIMIT_WINDOW_MS;
  const max = ENV.EXECUTE_RATE_LIMIT_MAX;
  const now = Date.now();

  let b = buckets.get(userId);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(userId, b);
    startPruneTimer();
  }

  b.count += 1;

  res.set("X-RateLimit-Limit", String(max));
  res.set("X-RateLimit-Remaining", String(Math.max(0, max - b.count)));
  res.set("X-RateLimit-Reset", String(Math.ceil(b.resetAt / 1000)));

  if (b.count > max) {
    const retryAfter = Math.ceil((b.resetAt - now) / 1000);
    res.set("Retry-After", String(retryAfter));
    return res.status(429).json({
      error: "Too many code executions. Try again in a minute.",
    });
  }

  next();
}
