// src/scheduler/server.ts
import { Hono } from "hono";
import type { Scheduler } from "./scheduler";

export function createServer(scheduler: Scheduler, port: number) {
  const app = new Hono();

  // Health check
  app.get("/health", (c) => {
    return c.json({ status: "ok" });
  });

  // List all monitors
  app.get("/monitors", (c) => {
    const monitors = scheduler.getMonitorIds().map((id) => {
      const state = scheduler.getState(id);
      return {
        id,
        lastRun: state?.lastRun?.toISOString() ?? null,
        lastStatus: state?.lastResult?.status ?? null,
        isRunning: state?.isRunning ?? false,
        consecutiveFailures: state?.consecutiveFailures ?? 0,
      };
    });
    return c.json({ monitors });
  });

  // Get single monitor state
  app.get("/monitors/:id", (c) => {
    const id = c.req.param("id");
    const state = scheduler.getState(id);

    if (!state) {
      return c.json({ error: "Monitor not found" }, 404);
    }

    return c.json({
      id,
      lastRun: state.lastRun?.toISOString() ?? null,
      lastStatus: state.lastResult?.status ?? null,
      lastResponseTime: state.lastResult?.responseTime ?? null,
      lastMessage: state.lastResult?.message ?? null,
      isRunning: state.isRunning,
      consecutiveFailures: state.consecutiveFailures,
    });
  });

  // Trigger a monitor
  app.post("/monitors/:id/trigger", async (c) => {
    const id = c.req.param("id");
    const found = await scheduler.trigger(id);

    if (!found) {
      return c.json({ error: "Monitor not found" }, 404);
    }

    const state = scheduler.getState(id);
    return c.json({
      triggered: true,
      id,
      status: state?.lastResult?.status ?? null,
      responseTime: state?.lastResult?.responseTime ?? null,
    });
  });

  // Trigger multiple monitors (for dashboard bulk trigger)
  app.post("/monitors/trigger", async (c) => {
    const body = await c.req.json<{ monitorIds: string[] }>();
    const { monitorIds } = body;

    if (!monitorIds || !Array.isArray(monitorIds)) {
      return c.json({ error: "monitorIds array required" }, 400);
    }

    // Trigger all monitors in parallel
    const results = await Promise.all(
      monitorIds.map(async (id) => {
        const found = await scheduler.trigger(id);
        if (!found) {
          return { id, error: "Monitor not found" };
        }
        const state = scheduler.getState(id);
        return {
          id,
          status: state?.lastResult?.status ?? null,
          responseTime: state?.lastResult?.responseTime ?? null,
        };
      }),
    );

    return c.json({ triggered: true, results });
  });

  console.log(`[server] Starting HTTP API on port ${port}...`);

  return {
    fetch: app.fetch,
    port,
  };
}
