"use server";

import { monitors as monitorConfigs } from "@data/monitors";
import { parseDuration, type MonitorConfig } from "@/lib/config-types";
import { runMonitor } from "@/scheduler/runner";
import { logResult } from "@/scheduler/logger";
import type { SchedulerConfig } from "@/scheduler/types";
import { revalidatePath } from "next/cache";

const config: SchedulerConfig = {
  maxConcurrency: 1,
  maxRetries: parseInt(process.env.SCHEDULER_MAX_RETRIES ?? "3", 10),
  retryBaseDelayMs: parseInt(process.env.SCHEDULER_RETRY_DELAY_MS ?? "5000", 10),
  port: 0,
};

export async function triggerMonitor(monitorId: string) {
  const rawConfig = monitorConfigs[monitorId as keyof typeof monitorConfigs];
  if (!rawConfig) {
    return { success: false, error: "Monitor not found" };
  }

  const monitorConfig = rawConfig as MonitorConfig;
  const timeoutMs = monitorConfig.timeout
    ? parseDuration(monitorConfig.timeout)
    : 30000;

  try {
    const result = await runMonitor(
      { id: monitorId, config: monitorConfig, timeoutMs },
      config,
    );

    await logResult(result);
    revalidatePath(`/monitors/${monitorId}`);

    return {
      success: true,
      status: result.result.status,
      responseTime: result.result.responseTime,
      message: result.result.message,
      attempts: result.attempts,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
