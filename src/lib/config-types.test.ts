import { describe, expect, test } from "bun:test";
import { parseDuration } from "./config-types";

describe("parseDuration", () => {
  test("parses seconds", () => {
    expect(parseDuration("30s")).toBe(30_000);
    expect(parseDuration("1s")).toBe(1_000);
  });

  test("parses minutes", () => {
    expect(parseDuration("5m")).toBe(5 * 60 * 1000);
    expect(parseDuration("1m")).toBe(60_000);
  });

  test("parses hours", () => {
    expect(parseDuration("1h")).toBe(60 * 60 * 1000);
    expect(parseDuration("24h")).toBe(24 * 60 * 60 * 1000);
  });

  test("parses days", () => {
    expect(parseDuration("1d")).toBe(24 * 60 * 60 * 1000);
    expect(parseDuration("30d")).toBe(30 * 24 * 60 * 60 * 1000);
  });

  test("throws on invalid format", () => {
    expect(() => parseDuration("")).toThrow("Invalid duration format");
    expect(() => parseDuration("abc")).toThrow("Invalid duration format");
    expect(() => parseDuration("5")).toThrow("Invalid duration format");
    expect(() => parseDuration("5x")).toThrow("Invalid duration format");
    expect(() => parseDuration("1.5h")).toThrow("Invalid duration format");
    expect(() => parseDuration("-1h")).toThrow("Invalid duration format");
  });

  test("throws on unsupported unit", () => {
    expect(() => parseDuration("1w")).toThrow("Invalid duration format");
    expect(() => parseDuration("1y")).toThrow("Invalid duration format");
  });

  test("accepts zero", () => {
    expect(parseDuration("0s")).toBe(0);
    expect(parseDuration("0d")).toBe(0);
  });
});
