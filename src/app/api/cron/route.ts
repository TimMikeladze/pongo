import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { checkResults, getDb } from "@/db";
import { type MonitorConfig, parseDuration } from "@/lib/config-types";
import { loadChannels } from "@/lib/loader";
import { revalidateCheckResults } from "@/lib/revalidate";
import monitorConfigs from "@/pongo/monitors";
import { evaluateAlerts } from "@/scheduler/alerts/evaluator";
import { logResult } from "@/scheduler/logger";
import { runMonitor } from "@/scheduler/runner";
import type { ScheduledMonitor, SchedulerConfig } from "@/scheduler/types";

/**
 * Get the last check time for a monitor from the database
 */
async function getLastCheckTime(monitorId: string): Promise<Date | null> {
  const db = await getDb();

  const results = await db
    .select({ checkedAt: checkResults.checkedAt })
    .from(checkResults)
    .where(eq(checkResults.monitorId, monitorId))
    .orderBy(desc(checkResults.checkedAt))
    .limit(1);

  if (results.length === 0) return null;

  const checkedAt = results[0].checkedAt;
  return checkedAt instanceof Date ? checkedAt : new Date(checkedAt);
}

/**
 * Check if a monitor is due to run based on its interval and last check time
 */
function isMonitorDue(
  intervalMs: number,
  lastCheckTime: Date | null,
  now: Date,
): boolean {
  // If never checked, it's due
  if (!lastCheckTime) return true;

  const elapsed = now.getTime() - lastCheckTime.getTime();
  // Add a small buffer (10% of interval or 30s, whichever is smaller) to avoid edge cases
  const buffer = Math.min(intervalMs * 0.1, 30000);
  return elapsed >= intervalMs - buffer;
}

/**
 * Vercel Cron Job handler
 * This endpoint is called by Vercel's cron scheduler to run all due monitors
 */
export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron");

  // Allow Vercel Cron (has x-vercel-cron header)
  // OR require CRON_SECRET for manual/external invocations
  if (!isVercelCron) {
    if (!process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "Cron secret not set" },
        { status: 500 },
      );
    }
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startTime = Date.now();
  const now = new Date();
  const results: Array<{
    monitorId: string;
    status: string;
    responseTime: number;
    message?: string;
    skippedReason?: string;
  }> = [];
  const skipped: Array<{ monitorId: string; reason: string }> = [];

  try {
    // Load channels for alert evaluation
    const channels = await loadChannels();

    // Scheduler config (simplified for serverless)
    const config: SchedulerConfig = {
      maxConcurrency: 10,
      maxRetries: parseInt(process.env.SCHEDULER_MAX_RETRIES ?? "2", 10),
      retryBaseDelayMs: parseInt(
        process.env.SCHEDULER_RETRY_DELAY_MS ?? "1000",
        10,
      ),
      port: 0, // Not used in serverless
    };

    // Process all active monitors
    const monitorPromises = Object.entries(monitorConfigs).map(
      async ([id, rawConfig]) => {
        const monitorConfig = rawConfig as MonitorConfig;

        // Skip inactive monitors
        if (monitorConfig.active === false) {
          return { monitorId: id, skipped: true, reason: "inactive" };
        }

        // Get interval in milliseconds
        const intervalMs = monitorConfig.interval
          ? parseDuration(monitorConfig.interval)
          : 60000; // Default to 1 minute if no interval

        // Check if monitor is due
        const lastCheckTime = await getLastCheckTime(id);
        if (!isMonitorDue(intervalMs, lastCheckTime, now)) {
          const nextDueIn = lastCheckTime
            ? Math.max(
                0,
                intervalMs - (now.getTime() - lastCheckTime.getTime()),
              )
            : 0;
          return {
            monitorId: id,
            skipped: true,
            reason: `not due (next in ${Math.round(nextDueIn / 1000)}s)`,
          };
        }

        const timeoutMs = monitorConfig.timeout
          ? parseDuration(monitorConfig.timeout)
          : 30000;

        const monitor: ScheduledMonitor = {
          id,
          config: monitorConfig,
          timeoutMs,
        };

        try {
          // Run the monitor
          const result = await runMonitor(monitor, config);

          // Log to database
          const checkId = await logResult(result);

          // Evaluate alerts
          if (monitorConfig.alerts && monitorConfig.alerts.length > 0) {
            await evaluateAlerts(
              id,
              monitorConfig.name,
              monitorConfig.alerts,
              channels,
              checkId,
            );
          }

          return {
            monitorId: id,
            status: result.result.status,
            responseTime: result.result.responseTime,
            message: result.result.message,
            attempts: result.attempts,
          };
        } catch (error) {
          console.error(`[cron] Error running monitor ${id}:`, error);
          return {
            monitorId: id,
            status: "error",
            responseTime: 0,
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    );

    // Run all monitors concurrently (with p-limit in runMonitor handling concurrency)
    const monitorResults = await Promise.all(monitorPromises);

    for (const result of monitorResults) {
      if ("skipped" in result && result.skipped) {
        skipped.push({ monitorId: result.monitorId, reason: result.reason });
      } else if (!("skipped" in result)) {
        results.push(result);
      }
    }

    // Invalidate caches if any monitors ran (new check results written)
    if (results.length > 0) {
      await revalidateCheckResults();
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration,
      monitorsRun: results.length,
      monitorsSkipped: skipped.length,
      results,
      skipped,
    });
  } catch (error) {
    console.error("[cron] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      },
      { status: 500 },
    );
  }
}

// Vercel cron configuration is in vercel.json
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for all monitors to complete
