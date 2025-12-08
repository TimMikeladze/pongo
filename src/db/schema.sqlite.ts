import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

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

  /** Region where the check was executed */
  region: text("region").notNull().default("default"),

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

  /** Index for region filtering */
  regionIdx: sql`CREATE INDEX IF NOT EXISTS idx_pongo_check_results_region ON pongo_check_results(region)`,

  /** Composite index for monitor + region + time queries */
  monitorRegionCheckedAtIdx: sql`CREATE INDEX IF NOT EXISTS idx_pongo_check_results_monitor_region_checked_at ON pongo_check_results(monitor_id, region, checked_at DESC)`,

  /** Index for archival queries - finds rows eligible for archival */
  archivalIdx: sql`CREATE INDEX IF NOT EXISTS idx_pongo_check_results_archival ON pongo_check_results(checked_at) WHERE archived_at IS NULL`,

  /** Covering index for dashboard/listing queries - avoids table lookups */
  monitorCoveringIdx: sql`CREATE INDEX IF NOT EXISTS idx_pongo_check_results_monitor_covering ON pongo_check_results(monitor_id, checked_at DESC, status, response_time_ms, region)`,
};

/**
 * Alert status enum values
 */
export const alertStatusEnum = ["ok", "firing"] as const;
export type AlertStatusEnum = (typeof alertStatusEnum)[number];

/**
 * Alert event type enum values
 */
export const alertEventTypeEnum = ["fired", "resolved"] as const;
export type AlertEventTypeEnum = (typeof alertEventTypeEnum)[number];

/**
 * Alert state table - current state of each alert
 */
export const alertState = sqliteTable(
  "pongo_alert_state",
  {
    alertId: text("alert_id").notNull(),
    monitorId: text("monitor_id").notNull(),
    region: text("region").notNull().default("default"),
    status: text("status", { enum: alertStatusEnum }).notNull().default("ok"),
    lastFiredAt: integer("last_fired_at", { mode: "timestamp_ms" }),
    lastResolvedAt: integer("last_resolved_at", { mode: "timestamp_ms" }),
    currentEventId: text("current_event_id"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.alertId, table.region] }),
  }),
);

export type AlertState = typeof alertState.$inferSelect;
export type NewAlertState = typeof alertState.$inferInsert;

/**
 * Alert events table - immutable log of all alert activity
 */
export const alertEvents = sqliteTable("pongo_alert_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  alertId: text("alert_id").notNull(),
  monitorId: text("monitor_id").notNull(),
  region: text("region").notNull().default("default"),
  eventType: text("event_type", { enum: alertEventTypeEnum }).notNull(),
  triggeredAt: integer("triggered_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
  snapshot: text("snapshot", { mode: "json" }).$type<Record<string, unknown>>(),
  triggerCheckId: text("trigger_check_id"),
  resolveCheckId: text("resolve_check_id"),
});

export type AlertEvent = typeof alertEvents.$inferSelect;
export type NewAlertEvent = typeof alertEvents.$inferInsert;

/**
 * Indexes for alert tables
 */
export const alertIndexes = {
  alertStateMonitorIdx: sql`CREATE INDEX IF NOT EXISTS idx_pongo_alert_state_monitor_id ON pongo_alert_state(monitor_id)`,
  alertEventsAlertIdx: sql`CREATE INDEX IF NOT EXISTS idx_pongo_alert_events_alert_id ON pongo_alert_events(alert_id)`,
  alertEventsMonitorIdx: sql`CREATE INDEX IF NOT EXISTS idx_pongo_alert_events_monitor_id ON pongo_alert_events(monitor_id)`,
  alertEventsTriggeredAtIdx: sql`CREATE INDEX IF NOT EXISTS idx_pongo_alert_events_triggered_at ON pongo_alert_events(triggered_at DESC)`,
};
