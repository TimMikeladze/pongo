import { describe, expect, test } from "bun:test";

// Test the cron auth logic in isolation (the actual route handler has
// too many dependencies to import directly in tests)

describe("cron auth logic", () => {
  function checkCronAuth(
    headers: Record<string, string>,
    env: { VERCEL?: string; CRON_SECRET?: string },
  ): { allowed: boolean; status?: number; error?: string } {
    const authHeader = headers.authorization;
    const isVercelCron = env.VERCEL && headers["x-vercel-cron"];

    if (!isVercelCron) {
      if (!env.CRON_SECRET) {
        return { allowed: false, status: 500, error: "Cron secret not set" };
      }
      if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
        return { allowed: false, status: 401, error: "Unauthorized" };
      }
    }

    return { allowed: true };
  }

  test("allows Vercel cron on Vercel platform", () => {
    const result = checkCronAuth({ "x-vercel-cron": "true" }, { VERCEL: "1" });
    expect(result.allowed).toBe(true);
  });

  test("rejects spoofed x-vercel-cron when NOT on Vercel", () => {
    const result = checkCronAuth(
      { "x-vercel-cron": "true" },
      { CRON_SECRET: "secret" },
    );
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(401);
  });

  test("allows valid CRON_SECRET bearer token", () => {
    const result = checkCronAuth(
      { authorization: "Bearer my-secret" },
      { CRON_SECRET: "my-secret" },
    );
    expect(result.allowed).toBe(true);
  });

  test("rejects wrong CRON_SECRET", () => {
    const result = checkCronAuth(
      { authorization: "Bearer wrong" },
      { CRON_SECRET: "my-secret" },
    );
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(401);
  });

  test("rejects when no CRON_SECRET is configured and not on Vercel", () => {
    const result = checkCronAuth({}, {});
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(500);
  });

  test("rejects missing auth header when CRON_SECRET is set", () => {
    const result = checkCronAuth({}, { CRON_SECRET: "secret" });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(401);
  });

  test("on Vercel with valid secret, both paths allow access", () => {
    // Vercel cron header path
    const r1 = checkCronAuth(
      { "x-vercel-cron": "true" },
      { VERCEL: "1", CRON_SECRET: "secret" },
    );
    expect(r1.allowed).toBe(true);

    // Bearer token path
    const r2 = checkCronAuth(
      { authorization: "Bearer secret" },
      { VERCEL: "1", CRON_SECRET: "secret" },
    );
    expect(r2.allowed).toBe(true);
  });
});
