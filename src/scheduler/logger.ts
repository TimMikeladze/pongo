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
