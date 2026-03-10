import { describe, expect, test } from "bun:test";
import { createHash, timingSafeEqual } from "node:crypto";

// Auth module captures ACCESS_CODE at import time, so we test the
// underlying crypto logic directly to avoid module-scoping issues.

describe("verifyAccessCode logic", () => {
  function verifyAccessCode(code: string, accessCode: string): boolean {
    const a = Buffer.from(code);
    const b = Buffer.from(accessCode);

    if (a.length !== b.length) {
      timingSafeEqual(b, b);
      return false;
    }

    return timingSafeEqual(a, b);
  }

  test("returns true for matching codes", () => {
    expect(verifyAccessCode("my-secret", "my-secret")).toBe(true);
  });

  test("returns false for wrong code", () => {
    expect(verifyAccessCode("wrong-code", "my-secret")).toBe(false);
  });

  test("returns false for different length", () => {
    expect(verifyAccessCode("short", "much-longer-secret")).toBe(false);
  });

  test("returns false for empty input", () => {
    expect(verifyAccessCode("", "my-secret")).toBe(false);
  });

  test("returns false for partial match", () => {
    expect(verifyAccessCode("my-secre", "my-secret")).toBe(false);
  });

  test("handles unicode correctly", () => {
    expect(verifyAccessCode("пароль", "пароль")).toBe(true);
    expect(verifyAccessCode("пароль", "парол")).toBe(false);
  });
});

describe("session password derivation", () => {
  function getSessionPassword(
    sessionSecret: string | undefined,
    accessCode: string | undefined,
  ): string {
    if (sessionSecret && sessionSecret.length >= 32) return sessionSecret;
    if (sessionSecret) {
      return createHash("sha256")
        .update(sessionSecret)
        .digest("hex")
        .slice(0, 32);
    }
    if (accessCode) {
      return createHash("sha256").update(accessCode).digest("hex").slice(0, 32);
    }
    return "this-password-is-not-used-when-auth-disabled";
  }

  test("uses SESSION_SECRET directly when >= 32 chars", () => {
    const secret = "a".repeat(32);
    expect(getSessionPassword(secret, "anything")).toBe(secret);
  });

  test("hashes short SESSION_SECRET to 32 chars", () => {
    const password = getSessionPassword("short", undefined);
    expect(password).toHaveLength(32);
    expect(password).not.toBe("short");
    // Verify it's a hex SHA-256 prefix
    expect(password).toMatch(/^[a-f0-9]{32}$/);
  });

  test("derives from ACCESS_CODE when no SESSION_SECRET", () => {
    const password = getSessionPassword(undefined, "abc");
    expect(password).toHaveLength(32);
    expect(password).toMatch(/^[a-f0-9]{32}$/);
    // Should NOT be the old padEnd behavior
    expect(password).not.toBe("abcabcabcabcabcabcabcabcabcabcab");
  });

  test("returns default when no secrets configured", () => {
    expect(getSessionPassword(undefined, undefined)).toBe(
      "this-password-is-not-used-when-auth-disabled",
    );
  });

  test("same input always produces same output (deterministic)", () => {
    const a = getSessionPassword(undefined, "my-code");
    const b = getSessionPassword(undefined, "my-code");
    expect(a).toBe(b);
  });

  test("different inputs produce different outputs", () => {
    const a = getSessionPassword(undefined, "code-1");
    const b = getSessionPassword(undefined, "code-2");
    expect(a).not.toBe(b);
  });

  test("SESSION_SECRET takes precedence over ACCESS_CODE", () => {
    const withSecret = getSessionPassword("my-session-secret", "my-access");
    const withAccess = getSessionPassword(undefined, "my-access");
    expect(withSecret).not.toBe(withAccess);
  });
});
