# Scheduler Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone CLI scheduler that runs monitors on cron/interval schedules with concurrency control, retries, and an HTTP API for ad-hoc triggers.

**Architecture:** Standalone Bun process loads monitors from `data/monitors`, schedules them using croner, executes with p-limit concurrency control, retries failures with exponential backoff, logs results to database, and exposes HTTP API for manual triggers.

**Tech Stack:** Bun, croner (cron scheduling), p-limit (concurrency), Hono (HTTP API), drizzle-orm (database)

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install croner, p-limit, and hono**

```bash
bun add croner p-limit hono
```

**Step 2: Verify installation**

```bash
bun pm ls | grep -E "croner|p-limit|hono"
```

Expected: All three packages listed

**Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "feat(scheduler): add croner, p-limit, hono dependencies"
```

---

## Task 2: Update MonitorConfig to Support Cron

**Files:**
- Modify: `src/lib/config-types.ts`

**Step 1: Add optional cron field to MonitorConfig**

In `src/lib/config-types.ts`, update the `MonitorConfig` interface:

```typescript
/**
 * Monitor configuration file schema
 * Filename becomes the monitor ID
 */
export interface MonitorConfig {
  name: string;
  interval?: string; // human-readable: "30s", "5m", "1h" - optional if cron is set
  cron?: string; // cron expression: "*/5 * * * *" - optional if interval is set
  timeout?: string; // human-readable, defaults to "30s"
  active?: boolean; // defaults to true

  /**
   * Handler function that runs the monitor check
   * Returns status, response time, and optional message
   */
  handler: () => Promise<MonitorResult>;
}
```

**Step 2: Commit**

```bash
git add src/lib/config-types.ts
git commit -m "feat(scheduler): add cron field to MonitorConfig"
```

---

## Task 3: Create Scheduler Types

**Files:**
- Create: `src/scheduler/types.ts`

**Step 1: Create scheduler types file**

```typescript
// src/scheduler/types.ts
import type { MonitorConfig, MonitorResult } from "@/lib/config-types";

/**
 * Scheduler configuration from environment
 */
export interface SchedulerConfig {
  /** Max concurrent monitor executions (default: 10) */
  maxConcurrency: number;
  /** Max retries on failure (default: 3) */
  maxRetries: number;
  /** Base delay between retries in ms (default: 5000) */
  retryBaseDelayMs: number;
  /** HTTP API port (default: 3001) */
  port: number;
}

/**
 * Internal monitor representation with resolved config
 */
export interface ScheduledMonitor {
  id: string;
  config: MonitorConfig;
  /** Resolved timeout in milliseconds */
  timeoutMs: number;
}

/**
 * Result of a single monitor execution (after all retries)
 */
export interface ExecutionResult {
  monitorId: string;
  result: MonitorResult;
  attempts: number;
  executedAt: Date;
}

/**
 * Scheduler state for a monitor
 */
export interface MonitorState {
  lastRun: Date | null;
  lastResult: MonitorResult | null;
  isRunning: boolean;
  consecutiveFailures: number;
}
```

**Step 2: Commit**

```bash
git add src/scheduler/types.ts
git commit -m "feat(scheduler): add scheduler types"
```

---

## Task 4: Create Monitor Runner with Retry Logic

**Files:**
- Create: `src/scheduler/runner.ts`

**Step 1: Create runner with retry and timeout logic**

```typescript
// src/scheduler/runner.ts
import type { MonitorResult } from "@/lib/config-types";
import type { ScheduledMonitor, SchedulerConfig, ExecutionResult } from "./types";

/**
 * Sleep for given milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a monitor handler with timeout
 */
async function executeWithTimeout(
  monitor: ScheduledMonitor,
): Promise<MonitorResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), monitor.timeoutMs);

  try {
    const result = await monitor.config.handler();
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (controller.signal.aborted) {
      return {
        status: "down",
        responseTime: monitor.timeoutMs,
        message: `Timeout after ${monitor.timeoutMs}ms`,
      };
    }
    throw error;
  }
}

/**
 * Run a monitor with retries and exponential backoff
 */
export async function runMonitor(
  monitor: ScheduledMonitor,
  config: SchedulerConfig,
): Promise<ExecutionResult> {
  const executedAt = new Date();
  let lastResult: MonitorResult | null = null;
  let attempts = 0;

  for (let i = 0; i <= config.maxRetries; i++) {
    attempts = i + 1;

    try {
      lastResult = await executeWithTimeout(monitor);

      // If successful (up or degraded), return immediately
      if (lastResult.status === "up" || lastResult.status === "degraded") {
        return { monitorId: monitor.id, result: lastResult, attempts, executedAt };
      }

      // If down and we have retries left, wait and retry
      if (i < config.maxRetries) {
        const delay = config.retryBaseDelayMs * Math.pow(2, i); // 5s, 10s, 20s
        console.log(
          `[${monitor.id}] Check failed (attempt ${attempts}/${config.maxRetries + 1}), retrying in ${delay}ms...`,
        );
        await sleep(delay);
      }
    } catch (error) {
      lastResult = {
        status: "down",
        responseTime: 0,
        message: error instanceof Error ? error.message : "Unknown error",
      };

      if (i < config.maxRetries) {
        const delay = config.retryBaseDelayMs * Math.pow(2, i);
        console.log(
          `[${monitor.id}] Check error (attempt ${attempts}/${config.maxRetries + 1}), retrying in ${delay}ms...`,
        );
        await sleep(delay);
      }
    }
  }

  // All retries exhausted, return last result
  return {
    monitorId: monitor.id,
    result: lastResult!,
    attempts,
    executedAt,
  };
}
```

**Step 2: Commit**

```bash
git add src/scheduler/runner.ts
git commit -m "feat(scheduler): add monitor runner with retry logic"
```

---

## Task 5: Create Database Logger

**Files:**
- Create: `src/scheduler/logger.ts`

**Step 1: Create logger that writes to database and console**

```typescript
// src/scheduler/logger.ts
import { getDbAsync, getSchema } from "@/db";
import type { ExecutionResult } from "./types";

/**
 * Format timestamp for console output
 */
function formatTime(date: Date): string {
  return date.toISOString().replace("T", " ").substring(0, 19);
}

/**
 * Log execution result to console
 */
export function logToConsole(result: ExecutionResult): void {
  const { monitorId, result: r, attempts, executedAt } = result;
  const status = r.status.toUpperCase().padEnd(8);
  const time = `${r.responseTime}ms`.padStart(8);
  const retriesInfo = attempts > 1 ? ` (${attempts} attempts)` : "";
  const message = r.message ? ` - ${r.message}` : "";

  console.log(
    `[${formatTime(executedAt)}] ${monitorId.padEnd(20)} ${status} ${time}${retriesInfo}${message}`,
  );
}

/**
 * Log execution result to database
 */
export async function logToDatabase(result: ExecutionResult): Promise<void> {
  const db = await getDbAsync();
  const schema = getSchema();

  await db.insert(schema.checkResults).values({
    monitorId: result.monitorId,
    status: result.result.status,
    responseTimeMs: result.result.responseTime,
    statusCode: result.result.statusCode ?? null,
    message: result.result.message ?? null,
    checkedAt: result.executedAt,
  });
}

/**
 * Log execution result to both console and database
 */
export async function logResult(result: ExecutionResult): Promise<void> {
  logToConsole(result);
  await logToDatabase(result);
}
```

**Step 2: Commit**

```bash
git add src/scheduler/logger.ts
git commit -m "feat(scheduler): add execution logger"
```

---

## Task 6: Create Core Scheduler

**Files:**
- Create: `src/scheduler/scheduler.ts`

**Step 1: Create scheduler that manages cron jobs**

```typescript
// src/scheduler/scheduler.ts
import { Cron } from "croner";
import pLimit from "p-limit";
import { monitors as monitorConfigs } from "@data/monitors";
import { parseDuration } from "@/lib/config-types";
import type { ScheduledMonitor, SchedulerConfig, MonitorState } from "./types";
import { runMonitor } from "./runner";
import { logResult } from "./logger";

/**
 * Convert interval string to croner-compatible schedule
 * For intervals, we use croner's interval option with a per-second cron
 */
function intervalToSeconds(interval: string): number {
  return parseDuration(interval) / 1000;
}

export class Scheduler {
  private config: SchedulerConfig;
  private monitors: Map<string, ScheduledMonitor> = new Map();
  private jobs: Map<string, Cron> = new Map();
  private states: Map<string, MonitorState> = new Map();
  private limit: ReturnType<typeof pLimit>;

  constructor(config: SchedulerConfig) {
    this.config = config;
    this.limit = pLimit(config.maxConcurrency);
  }

  /**
   * Load monitors from config
   */
  loadMonitors(): void {
    for (const [id, config] of Object.entries(monitorConfigs)) {
      if (config.active === false) {
        console.log(`[scheduler] Skipping inactive monitor: ${id}`);
        continue;
      }

      const timeoutMs = config.timeout ? parseDuration(config.timeout) : 30000;

      this.monitors.set(id, { id, config, timeoutMs });
      this.states.set(id, {
        lastRun: null,
        lastResult: null,
        isRunning: false,
        consecutiveFailures: 0,
      });

      console.log(
        `[scheduler] Loaded monitor: ${id} (${config.cron ?? config.interval})`,
      );
    }
  }

  /**
   * Execute a single monitor (called by cron job or trigger)
   */
  async executeMonitor(monitorId: string): Promise<void> {
    const monitor = this.monitors.get(monitorId);
    if (!monitor) {
      console.error(`[scheduler] Unknown monitor: ${monitorId}`);
      return;
    }

    const state = this.states.get(monitorId)!;
    if (state.isRunning) {
      console.log(`[scheduler] Skipping ${monitorId} - already running`);
      return;
    }

    state.isRunning = true;

    try {
      const result = await this.limit(() => runMonitor(monitor, this.config));
      state.lastRun = result.executedAt;
      state.lastResult = result.result;

      if (result.result.status === "down") {
        state.consecutiveFailures++;
      } else {
        state.consecutiveFailures = 0;
      }

      await logResult(result);
    } catch (error) {
      console.error(`[scheduler] Error executing ${monitorId}:`, error);
    } finally {
      state.isRunning = false;
    }
  }

  /**
   * Start all scheduled jobs
   */
  start(): void {
    console.log(`[scheduler] Starting scheduler with ${this.monitors.size} monitors...`);
    console.log(`[scheduler] Max concurrency: ${this.config.maxConcurrency}`);
    console.log(`[scheduler] Max retries: ${this.config.maxRetries}`);

    for (const [id, monitor] of this.monitors) {
      const { config } = monitor;

      if (config.cron) {
        // Cron-based scheduling
        const job = new Cron(config.cron, { protect: true }, () => {
          this.executeMonitor(id);
        });
        this.jobs.set(id, job);
        console.log(`[scheduler] Scheduled ${id} with cron: ${config.cron}`);
      } else if (config.interval) {
        // Interval-based scheduling using croner's interval option
        const seconds = intervalToSeconds(config.interval);
        const job = new Cron("* * * * * *", { interval: seconds, protect: true }, () => {
          this.executeMonitor(id);
        });
        this.jobs.set(id, job);
        console.log(`[scheduler] Scheduled ${id} with interval: ${config.interval} (${seconds}s)`);
      } else {
        console.warn(`[scheduler] Monitor ${id} has no cron or interval, skipping`);
      }
    }

    console.log("[scheduler] All monitors scheduled");
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    console.log("[scheduler] Stopping scheduler...");
    for (const [id, job] of this.jobs) {
      job.stop();
      console.log(`[scheduler] Stopped ${id}`);
    }
    this.jobs.clear();
    console.log("[scheduler] Scheduler stopped");
  }

  /**
   * Trigger a monitor ad-hoc
   */
  async trigger(monitorId: string): Promise<boolean> {
    if (!this.monitors.has(monitorId)) {
      return false;
    }
    await this.executeMonitor(monitorId);
    return true;
  }

  /**
   * Get list of monitor IDs
   */
  getMonitorIds(): string[] {
    return Array.from(this.monitors.keys());
  }

  /**
   * Get monitor state
   */
  getState(monitorId: string): MonitorState | undefined {
    return this.states.get(monitorId);
  }
}
```

**Step 2: Commit**

```bash
git add src/scheduler/scheduler.ts
git commit -m "feat(scheduler): add core scheduler with cron/interval support"
```

---

## Task 7: Create HTTP API Server

**Files:**
- Create: `src/scheduler/server.ts`

**Step 1: Create Hono HTTP server for ad-hoc triggers**

```typescript
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

  console.log(`[server] Starting HTTP API on port ${port}...`);

  return {
    fetch: app.fetch,
    port,
  };
}
```

**Step 2: Commit**

```bash
git add src/scheduler/server.ts
git commit -m "feat(scheduler): add HTTP API server for triggers"
```

---

## Task 8: Create CLI Entry Point

**Files:**
- Create: `src/scheduler/index.ts`

**Step 1: Create main entry point**

```typescript
// src/scheduler/index.ts
import { Scheduler } from "./scheduler";
import { createServer } from "./server";
import type { SchedulerConfig } from "./types";

/**
 * Load config from environment
 */
function loadConfig(): SchedulerConfig {
  return {
    maxConcurrency: parseInt(process.env.SCHEDULER_MAX_CONCURRENCY ?? "10", 10),
    maxRetries: parseInt(process.env.SCHEDULER_MAX_RETRIES ?? "3", 10),
    retryBaseDelayMs: parseInt(process.env.SCHEDULER_RETRY_DELAY_MS ?? "5000", 10),
    port: parseInt(process.env.SCHEDULER_PORT ?? "3001", 10),
  };
}

async function main() {
  console.log("=".repeat(60));
  console.log("Pongo Scheduler");
  console.log("=".repeat(60));

  const config = loadConfig();
  const scheduler = new Scheduler(config);

  // Load and start monitors
  scheduler.loadMonitors();
  scheduler.start();

  // Start HTTP API
  const server = createServer(scheduler, config.port);
  Bun.serve(server);
  console.log(`[server] HTTP API listening on http://localhost:${config.port}`);

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n[scheduler] Received SIGINT, shutting down...");
    scheduler.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n[scheduler] Received SIGTERM, shutting down...");
    scheduler.stop();
    process.exit(0);
  });

  console.log("[scheduler] Ready. Press Ctrl+C to stop.");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

**Step 2: Commit**

```bash
git add src/scheduler/index.ts
git commit -m "feat(scheduler): add CLI entry point"
```

---

## Task 9: Add Package Script

**Files:**
- Modify: `package.json`

**Step 1: Add scheduler script to package.json**

Add to scripts section:

```json
"scheduler": "bun run src/scheduler/index.ts"
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "feat(scheduler): add scheduler npm script"
```

---

## Task 10: Test the Scheduler

**Step 1: Run the scheduler**

```bash
bun run scheduler
```

Expected output:
```
============================================================
Pongo Scheduler
============================================================
[scheduler] Loaded monitor: production-api (1m)
[scheduler] Loaded monitor: auth-service (...)
[scheduler] Loaded monitor: marketing-website (...)
[scheduler] Starting scheduler with 3 monitors...
[scheduler] Max concurrency: 10
[scheduler] Max retries: 3
[scheduler] Scheduled production-api with interval: 1m (60s)
...
[server] Starting HTTP API on port 3001...
[server] HTTP API listening on http://localhost:3001
[scheduler] Ready. Press Ctrl+C to stop.
```

**Step 2: Test the HTTP API (in another terminal)**

```bash
# List monitors
curl http://localhost:3001/monitors

# Trigger a monitor
curl -X POST http://localhost:3001/monitors/production-api/trigger

# Check monitor state
curl http://localhost:3001/monitors/production-api
```

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(scheduler): complete scheduler implementation"
```

---

## Summary

The scheduler provides:

1. **Cron/Interval scheduling** - Monitors can use `interval: "30s"` or `cron: "*/5 * * * *"`
2. **Concurrency control** - p-limit caps concurrent executions (default: 10)
3. **Per-monitor lock** - Croner's `protect: true` prevents overlapping runs
4. **Retry with backoff** - 3 retries with exponential delays (5s, 10s, 20s)
5. **Logging** - Console output + database persistence
6. **HTTP API** - Trigger monitors ad-hoc via `POST /monitors/:id/trigger`

**Environment variables:**
- `SCHEDULER_MAX_CONCURRENCY` - Max concurrent checks (default: 10)
- `SCHEDULER_MAX_RETRIES` - Retry attempts (default: 3)
- `SCHEDULER_RETRY_DELAY_MS` - Base retry delay (default: 5000)
- `SCHEDULER_PORT` - HTTP API port (default: 3001)
