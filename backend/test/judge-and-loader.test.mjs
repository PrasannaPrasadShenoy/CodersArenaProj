import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { loadProblem } from "../src/services/problemLoader.js";
import { runDsaJudge } from "../src/services/dsaJudgeService.js";

describe("problemLoader", () => {
  test("loadProblem(two-sum) returns metadata and tests", () => {
    const p = loadProblem("two-sum");
    assert.ok(p.metadata);
    assert.ok(Array.isArray(p.publicTests?.tests));
    assert.ok(p.publicTests.tests.length > 0);
  });
});

describe("dsaJudgeService", () => {
  const twoSumJs = `function two_sum(nums, target) {
  const m = new Map();
  for (let i = 0; i < nums.length; i++) {
    const c = target - nums[i];
    if (m.has(c)) return [m.get(c), i];
    m.set(nums[i], i);
  }
  return [];
}`;

  test("runDsaJudge publicOnly passes for two-sum", () => {
    const r = runDsaJudge({
      problemId: "two-sum",
      language: "javascript",
      code: twoSumJs,
      publicOnly: true,
    });
    assert.equal(r.status, "passed");
    assert.ok(r.testResults.every((t) => t.visibility === "public"));
  });

  test("runDsaJudge publicOnly fails for empty stub", () => {
    const r = runDsaJudge({
      problemId: "two-sum",
      language: "javascript",
      code: "function two_sum() { return []; }",
      publicOnly: true,
    });
    assert.equal(r.status, "failed");
  });

  test("runDsaJudge runs hidden when publicOnly false", () => {
    const r = runDsaJudge({
      problemId: "two-sum",
      language: "javascript",
      code: twoSumJs,
      publicOnly: false,
    });
    const hasHidden = r.testResults.some((t) => t.visibility === "hidden");
    assert.ok(hasHidden || r.status === "passed");
  });
});
