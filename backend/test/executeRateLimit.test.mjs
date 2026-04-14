import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clearExecuteRateLimitBuckets,
  executeRateLimit,
} from "../src/middleware/executeRateLimit.js";
import { ENV } from "../src/lib/env.js";

test("executeRateLimit returns 429 after EXECUTE_RATE_LIMIT_MAX requests", () => {
  clearExecuteRateLimitBuckets();
  const userId = "507f1f77bcf86cd799439011";
  const reqBase = { user: { _id: { toString: () => userId } } };

  let lastStatus = 200;
  const max = ENV.EXECUTE_RATE_LIMIT_MAX;

  for (let i = 0; i < max + 2; i++) {
    const req = { ...reqBase };
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    let nextCalled = false;
    executeRateLimit(req, res, () => {
      nextCalled = true;
    });
    if (res.statusCode === 429) {
      lastStatus = 429;
      assert.equal(nextCalled, false);
      break;
    }
    assert.equal(nextCalled, true);
  }

  assert.equal(lastStatus, 429);
  clearExecuteRateLimitBuckets();
});
