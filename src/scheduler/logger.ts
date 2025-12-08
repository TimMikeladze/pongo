// src/scheduler/logger.ts
import { getDbAsync, getDbDriver } from "@/db";
import { checkResults as pgCheckResults } from "@/db/schema.pg";
import { checkResults as sqliteCheckResults } from "@/db/schema.sqlite";
import { REGION } from "./region";
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
    `[${formatTime(executedAt)}] [${REGION}] ${monitorId.padEnd(20)} ${status} ${time}${retriesInfo}${message}`,
  );
}

/**
 * Log execution result to database
 */
export async function logToDatabase(result: ExecutionResult): Promise<string> {
  const db = await getDbAsync();
  const driver = getDbDriver();
  const checkResults = driver === "pg" ? pgCheckResults : sqliteCheckResults;

  const id = crypto.randomUUID();

  // biome-ignore lint/suspicious/noExplicitAny: dual-schema type union issue
  await (db as any).insert(checkResults).values({
    id,
    monitorId: result.monitorId,
    status: result.result.status,
    responseTimeMs: result.result.responseTime,
    statusCode: result.result.statusCode ?? null,
    message: result.result.message ?? null,
    region: REGION,
    checkedAt: result.executedAt,
  });

  return id;
}

/**
 * Log execution result to both console and database
 */
export async function logResult(result: ExecutionResult): Promise<string> {
  logToConsole(result);
  return await logToDatabase(result);
}
