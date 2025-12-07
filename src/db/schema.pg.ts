import { sql } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

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
export const checkResults = pgTable(
  "pongo_check_results",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    /** Monitor ID (filename without .ts extension) */
    monitorId: text("monitor_id").notNull(),

    /** Status returned by the handler: up, down, degraded, or pending */
    status: text("status", { enum: monitorStatusEnum }).notNull(),

    /** Response time in milliseconds */
    responseTimeMs: doublePrecision("response_time_ms").notNull(),

    /** HTTP status code if applicable */
    statusCode: integer("status_code"),

    /** Error or status message from the handler */
    message: text("message"),

    /** When the check was executed */
    checkedAt: timestamp("checked_at", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),

    /** When this record was created */
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),

    /** When this row was marked for archival (null = not archived) */
    archivedAt: timestamp("archived_at", { mode: "date", withTimezone: true }),
  },
  (table) => [
    index("idx_pongo_check_results_monitor_id").on(table.monitorId),
    index("idx_pongo_check_results_checked_at").on(table.checkedAt),
    index("idx_pongo_check_results_monitor_checked_at").on(
      table.monitorId,
      table.checkedAt,
    ),
    index("idx_pongo_check_results_status").on(table.status),
    index("idx_pongo_check_results_archival")
      .on(table.checkedAt)
      .where(sql`archived_at IS NULL`),
  ],
);

/**
 * Type for inserting a new check result
 */
export type NewCheckResult = typeof checkResults.$inferInsert;

/**
 * Type for a check result from the database
 */
export type CheckResult = typeof checkResults.$inferSelect;
