// src/db/index.ts
// Unified database module that abstracts away pg vs sqlite

import { sql } from "drizzle-orm";
import * as pgSchema from "./schema.pg";
import * as sqliteSchema from "./schema.sqlite";

/**
 * Database driver type - detected automatically from DATABASE_URL
 */
export type DbDriver = "sqlite" | "pg";

// Auto-detect driver from DATABASE_URL
function detectDriver(): DbDriver {
  if (process.env.DB_DRIVER) {
    return process.env.DB_DRIVER as DbDriver;
  }

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
      return "pg";
    }
  }

  return "sqlite";
}

export const DB_DRIVER = detectDriver();

// biome-ignore lint/suspicious/noExplicitAny: Runtime db type depends on driver
let _db: any = null;
// biome-ignore lint/suspicious/noExplicitAny: Cleanup function type varies
let _closeDb: (() => void | Promise<void>) | null = null;

/**
 * Initialize the database connection based on detected driver
 */
async function initDatabase() {
  if (_db) return _db;

  if (DB_DRIVER === "pg") {
    // PostgreSQL with postgres-js
    const postgres = (await import("postgres")).default;
    const { drizzle } = await import("drizzle-orm/postgres-js");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is required for PostgreSQL");
    }

    const client = postgres(connectionString);
    _db = drizzle(client, { schema: pgSchema });
    _closeDb = async () => {
      await client.end();
    };
  } else {
    // SQLite with libsql
    const { createClient } = await import("@libsql/client");
    const { drizzle } = await import("drizzle-orm/libsql");

    let databasePath = process.env.DATABASE_URL ?? "file:./pongo/pongo.db";
    if (!databasePath.includes("://") && !databasePath.startsWith("file:")) {
      databasePath = `file:${databasePath}`;
    }

    const client = createClient({
      url: databasePath,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Production SQLite performance pragmas
    await client.executeMultiple(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA cache_size = -64000;
      PRAGMA busy_timeout = 5000;
      PRAGMA temp_store = MEMORY;
    `);

    // Apply indexes
    for (const sql of sqliteSchema.checkResultsIndexes) {
      await client.execute(sql);
    }
    for (const sql of sqliteSchema.alertIndexes) {
      await client.execute(sql);
    }

    _db = drizzle(client, { schema: sqliteSchema });
    _closeDb = () => {
      client.close();
    };
  }

  return _db;
}

// Promise for async initialization
let dbPromise: Promise<typeof _db> | null = null;

function getDbPromise() {
  if (!dbPromise) {
    dbPromise = initDatabase();
  }
  return dbPromise;
}

/**
 * Get database instance asynchronously
 * This is the primary way to access the database
 */
// biome-ignore lint/suspicious/noExplicitAny: Runtime db type depends on driver
export async function getDb(): Promise<any> {
  return getDbPromise();
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (_closeDb) {
    await _closeDb();
    _db = null;
    dbPromise = null;
  }
}

/**
 * Execute a raw SQL query and return typed results
 * Use sql.raw() for the query string
 */
export async function runQuery<T>(queryStr: string): Promise<T[]> {
  const db = await getDb();
  const result = await db.execute(sql.raw(queryStr));

  if (DB_DRIVER === "pg") {
    // postgres-js returns array directly
    return result as T[];
  }
  // libsql returns { rows: [...] }
  return (result as { rows: T[] }).rows;
}

/**
 * SQL helpers for cross-database compatibility
 */
export const dbHelpers = {
  /**
   * Convert timestamp column to milliseconds for bucketing
   * SQLite stores as integer ms, PostgreSQL needs EXTRACT
   */
  timestampToMs: (column: string) =>
    DB_DRIVER === "pg"
      ? `(EXTRACT(EPOCH FROM ${column}) * 1000)::bigint`
      : column,

  /**
   * Round a number (PostgreSQL uses different syntax)
   */
  round: (expr: string) =>
    DB_DRIVER === "pg" ? `ROUND(${expr})::integer` : `ROUND(${expr})`,
} as const;

// ============================================
// Table exports - import these directly
// ============================================

// Export tables that work for both drivers
// The actual table used depends on DB_DRIVER at runtime
export const checkResults =
  DB_DRIVER === "sqlite" ? sqliteSchema.checkResults : pgSchema.checkResults;

export const alertState =
  DB_DRIVER === "sqlite" ? sqliteSchema.alertState : pgSchema.alertState;

export const alertEvents =
  DB_DRIVER === "sqlite" ? sqliteSchema.alertEvents : pgSchema.alertEvents;

// ============================================
// Schema modules for migrations/advanced use
// ============================================

export { pgSchema, sqliteSchema };

// ============================================
// Types - compatible across both drivers
// ============================================

export type {
  AlertEvent,
  AlertState,
  CheckResult,
  NewAlertEvent,
  NewAlertState,
  NewCheckResult,
} from "./schema.sqlite";

// Enum values (same for both)
export const monitorStatusEnum = ["up", "down", "degraded", "pending"] as const;
export type MonitorStatusEnum = (typeof monitorStatusEnum)[number];

export const alertStatusEnum = ["ok", "firing"] as const;
export type AlertStatusEnum = (typeof alertStatusEnum)[number];

export const alertEventTypeEnum = ["fired", "resolved"] as const;
export type AlertEventTypeEnum = (typeof alertEventTypeEnum)[number];
