// src/scheduler/alerts/dispatcher.test.ts
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { type ChannelConfig, dispatchWebhook } from "./dispatcher";
import type { WebhookPayload } from "./types";

type MockFetch = ReturnType<
  typeof mock<(url: string, options: RequestInit) => Promise<Response>>
>;

describe("dispatchWebhook", () => {
  let fetchMock: MockFetch;

  beforeEach(() => {
    // Reset fetch mock
    fetchMock = mock(() =>
      Promise.resolve(new Response(null, { status: 200 })),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
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
        severity: "warning",
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

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.com/webhook");
    expect(options.method).toBe("POST");
    expect((options.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
    expect(JSON.parse(options.body as string)).toEqual(payload);
  });

  test("includes custom headers", async () => {
    const channel: ChannelConfig = {
      type: "webhook",
      url: "https://example.com/webhook",
      headers: { "X-Source": "pongo", Authorization: "Bearer token" },
    };

    const payload: WebhookPayload = {
      event: "alert.fired",
      alert: {
        id: "a",
        name: "A",
        monitorId: "m",
        monitorName: "M",
        severity: "warning",
      },
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

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["X-Source"]).toBe("pongo");
    expect(headers.Authorization).toBe("Bearer token");
  });
});
