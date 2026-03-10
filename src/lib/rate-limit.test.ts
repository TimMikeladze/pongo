import { describe, expect, test } from "bun:test";
import { createRateLimiter, isRateLimited } from "./rate-limit";

describe("rate limiter", () => {
  test("allows requests under the limit", () => {
    const limiter = createRateLimiter(3, 60_000);

    expect(isRateLimited(limiter, "1.2.3.4")).toBe(false); // attempt 1
    expect(isRateLimited(limiter, "1.2.3.4")).toBe(false); // attempt 2
    expect(isRateLimited(limiter, "1.2.3.4")).toBe(false); // attempt 3
  });

  test("blocks after exceeding the limit", () => {
    const limiter = createRateLimiter(3, 60_000);

    expect(isRateLimited(limiter, "1.2.3.4")).toBe(false); // 1
    expect(isRateLimited(limiter, "1.2.3.4")).toBe(false); // 2
    expect(isRateLimited(limiter, "1.2.3.4")).toBe(false); // 3
    expect(isRateLimited(limiter, "1.2.3.4")).toBe(true); // 4 - blocked
    expect(isRateLimited(limiter, "1.2.3.4")).toBe(true); // 5 - still blocked
  });

  test("tracks IPs independently", () => {
    const limiter = createRateLimiter(2, 60_000);

    expect(isRateLimited(limiter, "1.1.1.1")).toBe(false);
    expect(isRateLimited(limiter, "1.1.1.1")).toBe(false);
    expect(isRateLimited(limiter, "1.1.1.1")).toBe(true); // blocked

    // Different IP is still allowed
    expect(isRateLimited(limiter, "2.2.2.2")).toBe(false);
    expect(isRateLimited(limiter, "2.2.2.2")).toBe(false);
    expect(isRateLimited(limiter, "2.2.2.2")).toBe(true); // now blocked too
  });

  test("resets after window expires", () => {
    const limiter = createRateLimiter(2, 100); // 100ms window

    expect(isRateLimited(limiter, "1.2.3.4")).toBe(false);
    expect(isRateLimited(limiter, "1.2.3.4")).toBe(false);
    expect(isRateLimited(limiter, "1.2.3.4")).toBe(true); // blocked

    // Manually expire the window
    const record = limiter.attempts.get("1.2.3.4")!;
    record.resetAt = Date.now() - 1;

    expect(isRateLimited(limiter, "1.2.3.4")).toBe(false); // reset
  });

  test("limit of 1 blocks on second attempt", () => {
    const limiter = createRateLimiter(1, 60_000);

    expect(isRateLimited(limiter, "x")).toBe(false);
    expect(isRateLimited(limiter, "x")).toBe(true);
  });
});
