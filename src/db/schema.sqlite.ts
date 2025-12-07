import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Monitor status enum values
 * Matches MonitorStatus from types.ts
 */
export const monitorStatusEnum = ["up", "down", "degraded", "pending"] as const;
export type MonitorStatusEnum = (typeof monitorStatusEnum)[number];

/**
 * Check results table - stores the results of monitor handler executions
 *
 * This table tracks every execution of a monitor's handler function,
 * storing the status, response time, and any error information.
 */
export const checkResults = sqliteTable("pongo_check_results", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  /** Monitor ID (filename without .ts extension) */
  monitorId: text("monitor_id").notNull(),

  /** Status returned by the handler: up, down, degraded, or pending */
  status: text("status", { enum: monitorStatusEnum }).notNull(),

  /** Response time in milliseconds */
  responseTimeMs: real("response_time_ms").notNull(),

  /** HTTP status code if applicable */
  statusCode: integer("status_code"),

  /** Error or status message from the handler */
  message: text("message"),

  /** When the check was executed */
  checkedAt: integer("checked_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),

  /** When this record was created */
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),

  /** When this row was marked for archival (null = not archived) */
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
});

/**
 * Type for inserting a new check result
 */
export type NewCheckResult = typeof checkResults.$inferInsert;

/**
 * Type for a check result from the database
 */
export type CheckResult = typeof checkResults.$inferSelect;

/**
 * Indexes for common queries - defined separately for migrations
 */
export const checkResultsIndexes = {
  /** Index for querying by monitor ID */
  monitorIdIdx: sql`CREATE INDEX IF NOT EXISTS idx_pongo_check_results_monitor_id ON pongo_check_results(monitor_id)`,

  /** Index for querying by check time (for time-based queries) */
  checkedAtIdx: sql`CREATE INDEX IF NOT EXISTS idx_pongo_check_results_checked_at ON pongo_check_results(checked_at DESC)`,

  /** Composite index for monitor + time queries (most common) */
  monitorCheckedAtIdx: sql`CREATE INDEX IF NOT EXISTS idx_pongo_check_results_monitor_checked_at ON pongo_check_results(monitor_id, checked_at DESC)`,

  /** Index for status filtering */
  statusIdx: sql`CREATE INDEX IF NOT EXISTS idx_pongo_check_results_status ON pongo_check_results(status)`,

  /** Index for archival queries - finds rows eligible for archival */
  archivalIdx: sql`CREATE INDEX IF NOT EXISTS idx_pongo_check_results_archival ON pongo_check_results(checked_at) WHERE archived_at IS NULL`,
};
