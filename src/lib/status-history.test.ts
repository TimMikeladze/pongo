import { describe, expect, test } from "bun:test";
import type { StatusBucket } from "./data";
import { groupStatusHistory } from "./status-history";

describe("status history", () => {
  test("limits long histories while retaining every recorded check", () => {
    const buckets: StatusBucket[] = Array.from({ length: 336 }, (_, index) => ({
      timestamp: index * 60_000,
      label: String(index),
      status: "up",
      uptime: 100,
      checks: 2,
    }));
    const history = groupStatusHistory(buckets);
    expect(history.length).toBeLessThanOrEqual(90);
    expect(history.reduce((sum, bucket) => sum + bucket.checks, 0)).toBe(672);
    expect(history[0].timestamp).toBe(0);
    expect(history.at(-1)?.endTimestamp).toBe(335 * 60_000);
  });
  test("a group retains the worst recorded status and check-weighted availability", () => {
    const history = groupStatusHistory(
      [
        { timestamp: 1, label: "first", status: "up", uptime: 100, checks: 2 },
        { timestamp: 2, label: "second", status: "down", uptime: 0, checks: 1 },
        {
          timestamp: 3,
          label: "third",
          status: "pending",
          uptime: 100,
          checks: 0,
        },
      ],
      1,
    );
    expect(history).toHaveLength(1);
    expect(history[0].status).toBe("down");
    expect(history[0].uptime).toBeCloseTo(66.6667);
    expect(history[0].checks).toBe(3);
    expect(history[0].missingPeriods).toBe(1);
  });
  test("unmeasured groups stay unknown", () => {
    expect(groupStatusHistory([])).toEqual([]);
    const history = groupStatusHistory([
      {
        timestamp: 1,
        label: "first",
        status: "pending",
        uptime: 100,
        checks: 0,
      },
    ]);
    expect(history[0].status).toBe("pending");
    expect(history[0].checks).toBe(0);
  });
});
