import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Scheduler } from "./scheduler";

// Save and restore env
const originalSecret = process.env.SCHEDULER_SECRET;
const originalHost = process.env.SCHEDULER_HOST;

function mockScheduler(monitorIds: string[] = []): Scheduler {
  return {
    getMonitorIds: () => monitorIds,
    getState: (id: string) => {
      if (!monitorIds.includes(id)) return undefined;
      return {
        lastRun: new Date("2025-01-01"),
        lastResult: { status: "up", responseTime: 100, message: null },
        isRunning: false,
        consecutiveFailures: 0,
      };
    },
    trigger: async (id: string) => monitorIds.includes(id),
  } as unknown as Scheduler;
}

describe("scheduler server auth", () => {
  describe("when SCHEDULER_SECRET is set", () => {
    beforeAll(() => {
      process.env.SCHEDULER_SECRET = "test-scheduler-secret";
    });

    afterAll(() => {
      if (originalSecret) process.env.SCHEDULER_SECRET = originalSecret;
      else delete process.env.SCHEDULER_SECRET;
    });

    async function createApp() {
      // Dynamic import to pick up env changes
      // Clear module cache so env is re-read
      delete require.cache[require.resolve("./server")];
      const { createServer } = await import("./server");
      const scheduler = mockScheduler(["mon-1"]);
      return createServer(scheduler, 0);
    }

    test("health endpoint is accessible without auth", async () => {
      const server = await createApp();
      const res = await server.fetch(new Request("http://localhost/health"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("ok");
    });

    test("GET /monitors returns 401 without auth header", async () => {
      const server = await createApp();
      const res = await server.fetch(new Request("http://localhost/monitors"));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    test("GET /monitors returns 401 with wrong secret", async () => {
      const server = await createApp();
      const res = await server.fetch(
        new Request("http://localhost/monitors", {
          headers: { Authorization: "Bearer wrong-secret" },
        }),
      );
      expect(res.status).toBe(401);
    });

    test("GET /monitors returns 200 with correct secret", async () => {
      const server = await createApp();
      const res = await server.fetch(
        new Request("http://localhost/monitors", {
          headers: { Authorization: "Bearer test-scheduler-secret" },
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.monitors).toBeArray();
    });

    test("GET /monitors/:id returns 401 without auth", async () => {
      const server = await createApp();
      const res = await server.fetch(
        new Request("http://localhost/monitors/mon-1"),
      );
      expect(res.status).toBe(401);
    });

    test("POST /monitors/:id/trigger returns 401 without auth", async () => {
      const server = await createApp();
      const res = await server.fetch(
        new Request("http://localhost/monitors/mon-1/trigger", {
          method: "POST",
        }),
      );
      expect(res.status).toBe(401);
    });

    test("POST /monitors/trigger returns 401 without auth", async () => {
      const server = await createApp();
      const res = await server.fetch(
        new Request("http://localhost/monitors/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monitorIds: ["mon-1"] }),
        }),
      );
      expect(res.status).toBe(401);
    });

    test("POST /monitors/:id/trigger succeeds with correct secret", async () => {
      const server = await createApp();
      const res = await server.fetch(
        new Request("http://localhost/monitors/mon-1/trigger", {
          method: "POST",
          headers: { Authorization: "Bearer test-scheduler-secret" },
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.triggered).toBe(true);
    });
  });

  describe("when SCHEDULER_SECRET is not set", () => {
    beforeAll(() => {
      delete process.env.SCHEDULER_SECRET;
    });

    afterAll(() => {
      if (originalSecret) process.env.SCHEDULER_SECRET = originalSecret;
    });

    async function createApp() {
      delete require.cache[require.resolve("./server")];
      const { createServer } = await import("./server");
      return createServer(mockScheduler(["mon-1"]), 0);
    }

    test("GET /monitors is accessible without auth when no secret configured", async () => {
      const server = await createApp();
      const res = await server.fetch(new Request("http://localhost/monitors"));
      expect(res.status).toBe(200);
    });
  });

  describe("hostname binding", () => {
    afterAll(() => {
      if (originalHost) process.env.SCHEDULER_HOST = originalHost;
      else delete process.env.SCHEDULER_HOST;
    });

    test("defaults to 127.0.0.1", async () => {
      delete process.env.SCHEDULER_HOST;
      delete require.cache[require.resolve("./server")];
      const { createServer } = await import("./server");
      const server = createServer(mockScheduler(), 3001);
      expect(server.hostname).toBe("127.0.0.1");
    });

    test("respects SCHEDULER_HOST env var", async () => {
      process.env.SCHEDULER_HOST = "0.0.0.0";
      delete require.cache[require.resolve("./server")];
      const { createServer } = await import("./server");
      const server = createServer(mockScheduler(), 3001);
      expect(server.hostname).toBe("0.0.0.0");
    });
  });
});
