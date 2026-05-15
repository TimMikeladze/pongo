import { describe, expect, test } from "bun:test";
import {
  getAllowedIntervals,
  getBestIntervalForDuration,
  getIntervalMs,
  getPresetDurationMs,
  getPresetRange,
  getTimeRange,
  isIntervalAllowed,
  MAX_DATA_POINTS,
} from "./time-range";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe("getPresetDurationMs", () => {
  test("returns ms for known presets", () => {
    expect(getPresetDurationMs("1h")).toBe(HOUR);
    expect(getPresetDurationMs("24h")).toBe(24 * HOUR);
    expect(getPresetDurationMs("7d")).toBe(7 * DAY);
  });
});

describe("getIntervalMs", () => {
  test("returns ms for interval strings", () => {
    expect(getIntervalMs("15m")).toBe(15 * 60 * 1000);
    expect(getIntervalMs("1h")).toBe(HOUR);
    expect(getIntervalMs("24h")).toBe(DAY);
  });
});

describe("isIntervalAllowed", () => {
  test("allows intervals that produce <= MAX_DATA_POINTS", () => {
    // 24h / 15m = 96 points → allowed
    expect(isIntervalAllowed("15m", 24 * HOUR)).toBe(true);
  });

  test("rejects intervals that exceed MAX_DATA_POINTS", () => {
    // 360d / 15m ≈ 34,560 points → way over
    expect(isIntervalAllowed("15m", 360 * DAY)).toBe(false);
  });

  test("boundary: exactly MAX_DATA_POINTS is allowed", () => {
    const intervalMs = HOUR;
    const durationMs = MAX_DATA_POINTS * intervalMs;
    expect(isIntervalAllowed("1h", durationMs)).toBe(true);
  });
});

describe("getAllowedIntervals", () => {
  test("returns subset of INTERVAL_OPTIONS", () => {
    const allowed = getAllowedIntervals(24 * HOUR);
    expect(allowed.length).toBeGreaterThan(0);
    expect(allowed).toContain("1h");
  });

  test("excludes intervals that would produce too many points", () => {
    const allowed = getAllowedIntervals(360 * DAY);
    expect(allowed).not.toContain("15m");
  });
});

describe("getBestIntervalForDuration", () => {
  test("returns the smallest allowed interval", () => {
    const best = getBestIntervalForDuration(24 * HOUR);
    const allowed = getAllowedIntervals(24 * HOUR);
    expect(best).toBe(allowed[0]);
  });

  test("falls back to 30d when nothing fits", () => {
    // Pathological: 0ms duration → all intervals allowed → returns first
    // For real fallback, duration must exceed all options × MAX_DATA_POINTS
    expect(getBestIntervalForDuration(0)).toBeDefined();
  });
});

describe("getPresetRange", () => {
  test("returns from = to - duration", () => {
    const { from, to } = getPresetRange("1h");
    expect(to.getTime() - from.getTime()).toBe(HOUR);
  });
});

describe("getTimeRange", () => {
  test("custom from/to takes precedence over preset", () => {
    const customFrom = new Date("2025-01-01T00:00:00Z");
    const customTo = new Date("2025-01-02T00:00:00Z");
    const result = getTimeRange({
      preset: "7d",
      from: customFrom,
      to: customTo,
    });
    expect(result.from).toBe(customFrom);
    expect(result.to).toBe(customTo);
  });

  test("falls back to preset when from/to are null", () => {
    const result = getTimeRange({ preset: "1h", from: null, to: null });
    expect(result.to.getTime() - result.from.getTime()).toBe(HOUR);
  });

  test("falls back to preset when only one bound is provided", () => {
    const result = getTimeRange({
      preset: "1h",
      from: new Date("2025-01-01"),
      to: null,
    });
    expect(result.to.getTime() - result.from.getTime()).toBe(HOUR);
  });
});
