import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
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

    /** Region where the check was executed */
    region: text("region").notNull().default("default"),

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
    index("idx_pongo_check_results_region").on(table.region),
    index("idx_pongo_check_results_monitor_region_checked_at").on(
      table.monitorId,
      table.region,
      table.checkedAt,
    ),
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

/**
 * Alert status enum
 */
export const alertStatusPgEnum = pgEnum("alert_status", ["ok", "firing"]);

/**
 * Alert event type enum
 */
export const alertEventTypePgEnum = pgEnum("alert_event_type", [
  "fired",
  "resolved",
]);

/**
 * Alert state table - current state of each alert
 */
export const alertState = pgTable(
  "pongo_alert_state",
  {
    alertId: text("alert_id").notNull(),
    monitorId: text("monitor_id").notNull(),
    region: text("region").notNull().default("default"),
    status: alertStatusPgEnum("status").notNull().default("ok"),
    lastFiredAt: timestamp("last_fired_at", { mode: "date" }),
    lastResolvedAt: timestamp("last_resolved_at", { mode: "date" }),
    lastNotifiedAt: timestamp("last_notified_at", { mode: "date" }),
    currentEventId: text("current_event_id"),
    stateChanges: integer("state_changes").notNull().default(0),
    flapWindowStart: timestamp("flap_window_start", { mode: "date" }),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.alertId, table.region] }),
    index("idx_pongo_alert_state_monitor_id").on(table.monitorId),
  ],
);

export type AlertState = typeof alertState.$inferSelect;
export type NewAlertState = typeof alertState.$inferInsert;

/**
 * Alert events table - immutable log of all alert activity
 */
export const alertEvents = pgTable("pongo_alert_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  alertId: text("alert_id").notNull(),
  monitorId: text("monitor_id").notNull(),
  region: text("region").notNull().default("default"),
  eventType: alertEventTypePgEnum("event_type").notNull(),
  triggeredAt: timestamp("triggered_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  resolvedAt: timestamp("resolved_at", { mode: "date" }),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>(),
  triggerCheckId: text("trigger_check_id"),
  resolveCheckId: text("resolve_check_id"),
});

export type AlertEvent = typeof alertEvents.$inferSelect;
export type NewAlertEvent = typeof alertEvents.$inferInsert;

/**
 * Alert overrides table - operational controls set via UI
 */
export const alertOverrides = pgTable("pongo_alert_overrides", {
  alertId: text("alert_id").primaryKey(),
  silencedUntil: timestamp("silenced_until", { mode: "date" }),
  disabled: boolean("disabled").notNull().default(false),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type AlertOverride = typeof alertOverrides.$inferSelect;
export type NewAlertOverride = typeof alertOverrides.$inferInsert;
