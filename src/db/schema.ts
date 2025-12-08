/**
 * Schema re-export based on DB_DRIVER environment variable
 *
 * This module exports the appropriate schema based on the database driver:
 * - DB_DRIVER=pg -> PostgreSQL schema
 * - DB_DRIVER=sqlite (default) -> SQLite schema
 */

import type { MonitorStatusEnum as PgMonitorStatusEnum } from "./schema.pg";
import type { MonitorStatusEnum as SqliteMonitorStatusEnum } from "./schema.sqlite";

export type MonitorStatusEnum = SqliteMonitorStatusEnum | PgMonitorStatusEnum;

// Re-export types that are compatible across both schemas
export type { CheckResult, NewCheckResult } from "./schema.sqlite";

// Export the status enum values (same for both)
export const monitorStatusEnum = ["up", "down", "degraded", "pending"] as const;
