import { describe, expect, test } from "bun:test";
import {
  dualTimeLabelFormatter,
  formatBucketDualTime,
  formatDualTime,
} from "./format-time";

const FIXED_DATE = new Date("2025-06-15T14:30:00Z");

describe("formatDualTime", () => {
  test("returns both UTC and local strings", () => {
    const { utc, local } = formatDualTime(FIXED_DATE);
    expect(utc).toBe("Jun 15, 2:30 PM");
    expect(typeof local).toBe("string");
    expect(local.length).toBeGreaterThan(0);
  });

  test("accepts numeric timestamp", () => {
    const { utc } = formatDualTime(FIXED_DATE.getTime());
    expect(utc).toBe("Jun 15, 2:30 PM");
  });

  test("accepts ISO string", () => {
    const { utc } = formatDualTime(FIXED_DATE.toISOString());
    expect(utc).toBe("Jun 15, 2:30 PM");
  });

  test("respects custom format string", () => {
    const { utc } = formatDualTime(FIXED_DATE, "yyyy-MM-dd");
    expect(utc).toBe("2025-06-15");
  });
});

describe("formatBucketDualTime", () => {
  test("uses time-only format for short intervals", () => {
    const { utc } = formatBucketDualTime(FIXED_DATE.getTime(), "15m");
    expect(utc).toBe("2:30 PM");
  });

  test("uses date+time format for long intervals", () => {
    const { utc } = formatBucketDualTime(FIXED_DATE.getTime(), "24h");
    expect(utc).toBe("Jun 15, 2:30 PM");
  });

  test("treats 5m, 15m, 30m, 1h as short", () => {
    for (const interval of ["5m", "15m", "30m", "1h"]) {
      const { utc } = formatBucketDualTime(FIXED_DATE.getTime(), interval);
      expect(utc).not.toContain("Jun");
    }
  });
});

describe("dualTimeLabelFormatter", () => {
  test("formats _ts from payload", () => {
    const result = dualTimeLabelFormatter("ignored", [
      { payload: { _ts: FIXED_DATE.getTime() } },
    ]);
    expect(result).toContain("UTC Jun 15, 2:30 PM");
    expect(result).toContain("Local");
  });

  test("falls back to label when payload has no _ts", () => {
    expect(dualTimeLabelFormatter("fallback", [{ payload: {} }])).toBe(
      "fallback",
    );
    expect(dualTimeLabelFormatter("fallback", [])).toBe("fallback");
  });

  test("coerces non-string label when falling back", () => {
    expect(dualTimeLabelFormatter(42, [])).toBe("42");
  });
});
