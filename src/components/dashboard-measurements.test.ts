import { describe, expect, test } from "bun:test";
import type { CheckResult, MonitorStatus } from "@/lib/types";
import { dashboardMeasurements } from "./dashboard-measurements";

function check(status: MonitorStatus, responseTimeMs = 120): CheckResult {
  return {
    id: status,
    monitorId: "service",
    status,
    responseTimeMs,
    statusCode: null,
    errorMessage: null,
    checkedAt: "2026-11-02T12:00:00Z",
  };
}

describe("dashboard measurements", () => {
  test("empty monitors, empty ranges and pending checks do not fabricate measurements", () => {
    for (const checks of [[], [[]], [[check("pending", 0)]]]) {
      expect(dashboardMeasurements(checks)).toEqual({
        uptime: null,
        responseTime: null,
        checkCount: 0,
      });
    }
  });
  test("preserves equal monitor availability weighting and partial degraded credit", () => {
    expect(
      dashboardMeasurements([
        [check("up", 100), check("degraded", 300)],
        [check("down")],
        [],
      ]),
    ).toEqual({ uptime: 37.5, responseTime: 200, checkCount: 3 });
  });
  test("failed checks show measured zero availability and unknown response latency", () => {
    expect(dashboardMeasurements([[check("down", 0)]])).toEqual({
      uptime: 0,
      responseTime: null,
      checkCount: 1,
    });
  });
  test("a measured zero response time remains valid", () => {
    expect(dashboardMeasurements([[check("up", 0)]])).toEqual({
      uptime: 100,
      responseTime: 0,
      checkCount: 1,
    });
  });
});
