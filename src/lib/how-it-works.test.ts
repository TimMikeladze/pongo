import { describe, expect, test } from "bun:test";
import { isHowItWorksEnabled } from "./how-it-works";

describe("How it works visibility", () => {
  test("defaults to development only", () => {
    expect(isHowItWorksEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isHowItWorksEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isHowItWorksEnabled({ NODE_ENV: "test" })).toBe(false);
  });
  test("enables the intended production deployment explicitly", () => {
    expect(
      isHowItWorksEnabled({
        NODE_ENV: "production",
        SHOW_HOW_IT_WORKS: "true",
      }),
    ).toBe(true);
  });
  test("can disable development and fails closed for invalid values", () => {
    expect(
      isHowItWorksEnabled({
        NODE_ENV: "development",
        SHOW_HOW_IT_WORKS: "false",
      }),
    ).toBe(false);
    expect(
      isHowItWorksEnabled({ NODE_ENV: "production", SHOW_HOW_IT_WORKS: "1" }),
    ).toBe(false);
  });
});
