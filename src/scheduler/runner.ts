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
 * Execute a monitor handler with timeout using Promise.race
 */
async function executeWithTimeout(
  monitor: ScheduledMonitor,
): Promise<MonitorResult> {
  const timeoutPromise = new Promise<MonitorResult>((resolve) => {
    setTimeout(() => {
      resolve({
        status: "down",
        responseTime: monitor.timeoutMs,
        message: `Timeout after ${monitor.timeoutMs}ms`,
      });
    }, monitor.timeoutMs);
  });

  try {
    const result = await Promise.race([
      monitor.config.handler(),
      timeoutPromise,
    ]);
    return result;
  } catch (error) {
    return {
      status: "down",
      responseTime: 0,
      message: error instanceof Error ? error.message : "Unknown error",
    };
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
