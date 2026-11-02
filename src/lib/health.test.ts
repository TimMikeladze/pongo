import { describe, expect, test } from "bun:test";
import { summarizeHealth } from "./health";

describe("summarizeHealth", () => {
  test("no monitors have no known health", () => {
    expect(summarizeHealth([])).toBe("pending");
  });
  test("missing checks are unknown rather than healthy", () => {
    expect(summarizeHealth([null, undefined, "pending"])).toBe("pending");
  });
  test("all checked monitors must be up to report operational", () => {
    expect(summarizeHealth(["up", "up"])).toBe("up");
    expect(summarizeHealth(["up", null])).toBe("pending");
  });
  test("degradation takes priority over missing checks", () => {
    expect(summarizeHealth(["up", "pending", "degraded"])).toBe("degraded");
  });
  test("outage takes priority over every other state", () => {
    expect(summarizeHealth(["pending", "degraded", "down", "up"])).toBe("down");
  });
});
