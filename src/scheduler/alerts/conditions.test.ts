// src/scheduler/alerts/conditions.test.ts
import { describe, expect, test } from "bun:test";
import { evaluateCondition } from "./conditions";
import type { AlertCondition, CheckResultWithId } from "./types";

function makeCheck(
  overrides: Partial<CheckResultWithId> = {},
): CheckResultWithId {
  return {
    id: crypto.randomUUID(),
    monitorId: "test-monitor",
    status: "up",
    responseTimeMs: 100,
    statusCode: 200,
    message: null,
    checkedAt: new Date(),
    ...overrides,
  };
}

describe("evaluateCondition", () => {
  describe("consecutiveFailures", () => {
    test("returns false when no failures", () => {
      const condition: AlertCondition = { consecutiveFailures: 3 };
      const history = [makeCheck(), makeCheck(), makeCheck()];
      expect(evaluateCondition(condition, history[0], history)).toBe(false);
    });

    test("returns true when threshold met", () => {
      const condition: AlertCondition = { consecutiveFailures: 3 };
      const history = [
        makeCheck({ status: "down" }),
        makeCheck({ status: "down" }),
        makeCheck({ status: "down" }),
      ];
      expect(evaluateCondition(condition, history[0], history)).toBe(true);
    });

    test("returns false when threshold not met", () => {
      const condition: AlertCondition = { consecutiveFailures: 3 };
      const history = [
        makeCheck({ status: "down" }),
        makeCheck({ status: "down" }),
        makeCheck({ status: "up" }),
      ];
      expect(evaluateCondition(condition, history[0], history)).toBe(false);
    });
  });

  describe("consecutiveSuccesses", () => {
    test("returns true when threshold met", () => {
      const condition: AlertCondition = { consecutiveSuccesses: 2 };
      const history = [makeCheck(), makeCheck()];
      expect(evaluateCondition(condition, history[0], history)).toBe(true);
    });
  });

  describe("latencyAboveMs", () => {
    test("returns true when latency exceeds threshold", () => {
      const condition: AlertCondition = { latencyAboveMs: 500, forChecks: 2 };
      const history = [
        makeCheck({ responseTimeMs: 600 }),
        makeCheck({ responseTimeMs: 550 }),
      ];
      expect(evaluateCondition(condition, history[0], history)).toBe(true);
    });

    test("returns false when not enough checks exceed threshold", () => {
      const condition: AlertCondition = { latencyAboveMs: 500, forChecks: 2 };
      const history = [
        makeCheck({ responseTimeMs: 600 }),
        makeCheck({ responseTimeMs: 100 }),
      ];
      expect(evaluateCondition(condition, history[0], history)).toBe(false);
    });
  });

  describe("status condition", () => {
    test("returns true when status matches for required checks", () => {
      const condition: AlertCondition = { status: "degraded", forChecks: 2 };
      const history = [
        makeCheck({ status: "degraded" }),
        makeCheck({ status: "degraded" }),
      ];
      expect(evaluateCondition(condition, history[0], history)).toBe(true);
    });
  });

  describe("callback condition", () => {
    test("invokes callback with result and history", () => {
      const condition: AlertCondition = (_result, history) => {
        return history.filter((r) => r.status === "degraded").length >= 3;
      };
      const history = [
        makeCheck({ status: "degraded" }),
        makeCheck({ status: "up" }),
        makeCheck({ status: "degraded" }),
        makeCheck({ status: "up" }),
        makeCheck({ status: "degraded" }),
      ];
      expect(evaluateCondition(condition, history[0], history)).toBe(true);
    });
  });
});
