import { describe, expect, test } from "bun:test";
import { sanitizeSqlValue } from "./sanitize";

describe("sanitizeSqlValue", () => {
  test("allows simple alphanumeric IDs", () => {
    expect(sanitizeSqlValue("my-monitor")).toBe("my-monitor");
    expect(sanitizeSqlValue("monitor123")).toBe("monitor123");
    expect(sanitizeSqlValue("api.health")).toBe("api.health");
    expect(sanitizeSqlValue("my_monitor")).toBe("my_monitor");
  });

  test("allows complex valid IDs", () => {
    expect(sanitizeSqlValue("prod-api-us-east-1")).toBe("prod-api-us-east-1");
    expect(sanitizeSqlValue("v2.api.health-check")).toBe("v2.api.health-check");
    expect(sanitizeSqlValue("Monitor_123.test")).toBe("Monitor_123.test");
  });

  test("rejects single quotes (SQL injection)", () => {
    expect(() => sanitizeSqlValue("'; DROP TABLE --")).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue("test'")).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue("'")).toThrow("Unsafe SQL");
  });

  test("rejects SQL injection payloads", () => {
    expect(() => sanitizeSqlValue("1' OR '1'='1")).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue("1; DROP TABLE users")).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue("1 UNION SELECT * FROM")).toThrow(
      "Unsafe SQL",
    );
    expect(() => sanitizeSqlValue("test/**/OR/**/1=1")).toThrow("Unsafe SQL");
  });

  test("rejects special characters", () => {
    expect(() => sanitizeSqlValue("test;")).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue("test(")).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue("test)")).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue("test=")).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue("test>")).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue("test<")).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue('test"')).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue("test`")).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue("test\\")).toThrow("Unsafe SQL");
  });

  test("rejects whitespace", () => {
    expect(() => sanitizeSqlValue("test monitor")).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue("test\tmonitor")).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue("test\nmonitor")).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue(" ")).toThrow("Unsafe SQL");
  });

  test("rejects empty string", () => {
    expect(() => sanitizeSqlValue("")).toThrow("Unsafe SQL");
  });

  test("rejects path traversal", () => {
    expect(() => sanitizeSqlValue("../../etc/passwd")).toThrow("Unsafe SQL");
    expect(() => sanitizeSqlValue("../admin")).toThrow("Unsafe SQL");
  });
});
