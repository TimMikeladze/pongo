// src/scheduler/index.ts
import { Scheduler } from "./scheduler";
import { createServer } from "./server";
import type { SchedulerConfig } from "./types";

/**
 * Region where this scheduler is running
 */
export const REGION = process.env.PONGO_REGION || process.env.FLY_REGION || "default";

/**
 * Load config from environment
 */
function loadConfig(): SchedulerConfig {
  return {
    maxConcurrency: parseInt(process.env.SCHEDULER_MAX_CONCURRENCY ?? "10", 10),
    maxRetries: parseInt(process.env.SCHEDULER_MAX_RETRIES ?? "3", 10),
    retryBaseDelayMs: parseInt(
      process.env.SCHEDULER_RETRY_DELAY_MS ?? "5000",
      10,
    ),
    port: parseInt(process.env.SCHEDULER_PORT ?? "3001", 10),
  };
}

async function main() {
  console.log("=".repeat(60));
  console.log("Pongo Scheduler");
  console.log(`Region: ${REGION}`);
  console.log("=".repeat(60));

  const config = loadConfig();
  const scheduler = new Scheduler(config);

  // Load and start monitors
  await scheduler.loadMonitors();
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
