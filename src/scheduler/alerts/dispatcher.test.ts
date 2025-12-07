// src/scheduler/alerts/dispatcher.test.ts
import { describe, test, expect, mock, beforeEach } from "bun:test";
import { dispatchWebhook, type ChannelConfig } from "./dispatcher";
import type { WebhookPayload } from "./types";

describe("dispatchWebhook", () => {
  beforeEach(() => {
    // Reset fetch mock
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(null, { status: 200 }))
    );
  });

  test("sends POST request with JSON payload", async () => {
    const channel: ChannelConfig = {
      type: "webhook",
      url: "https://example.com/webhook",
    };

    const payload: WebhookPayload = {
      event: "alert.fired",
      alert: {
        id: "test-alert",
        name: "Test Alert",
        monitorId: "test-monitor",
        monitorName: "Test Monitor",
      },
      timestamp: new Date().toISOString(),
      snapshot: {
        consecutiveFailures: 3,
        consecutiveSuccesses: 0,
        lastStatus: "down",
        lastResponseTimeMs: null,
        lastMessage: "Connection refused",
      },
      checkResult: {
        id: "check-123",
        status: "down",
        responseTimeMs: 0,
        message: "Connection refused",
        checkedAt: new Date().toISOString(),
      },
    };

    await dispatchWebhook(channel, payload);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (globalThis.fetch as ReturnType<typeof mock>).mock
      .calls[0];
    expect(url).toBe("https://example.com/webhook");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  test("includes custom headers", async () => {
    const channel: ChannelConfig = {
      type: "webhook",
      url: "https://example.com/webhook",
      headers: { "X-Source": "pongo", Authorization: "Bearer token" },
    };

    const payload: WebhookPayload = {
      event: "alert.fired",
      alert: { id: "a", name: "A", monitorId: "m", monitorName: "M" },
      timestamp: new Date().toISOString(),
      snapshot: {
        consecutiveFailures: 1,
        consecutiveSuccesses: 0,
        lastStatus: "down",
        lastResponseTimeMs: null,
        lastMessage: null,
      },
      checkResult: {
        id: "c",
        status: "down",
        responseTimeMs: 0,
        message: null,
        checkedAt: new Date().toISOString(),
      },
    };

    await dispatchWebhook(channel, payload);

    const [, options] = (globalThis.fetch as ReturnType<typeof mock>).mock
      .calls[0];
    expect(options.headers["X-Source"]).toBe("pongo");
    expect(options.headers["Authorization"]).toBe("Bearer token");
  });
});
