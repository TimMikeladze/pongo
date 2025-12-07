// src/db/index.ts
// Unified database module that abstracts away pg vs sqlite

import { sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as pgSchema from "./schema.pg";
import * as sqliteSchema from "./schema.sqlite";

/**
 * Database driver type - detected automatically from DATABASE_URL
 */
export type DbDriver = "sqlite" | "pg";

/**
 * Canonical database type used throughout the codebase.
 * We use the SQLite drizzle type as the canonical TypeScript type for both
 * drivers. Both schemas produce structurally identical $inferSelect/$inferInsert
 * types, so this is safe at runtime. Type assertions are contained to this file.
 */
export type PongoDb = LibSQLDatabase<typeof sqliteSchema>;

type DbCloseFn = () => void | Promise<void>;

type DbGlobalCache = {
  __pongoDb?: PongoDb | null;
  __pongoDbClose?: DbCloseFn | null;
  __pongoDbPromise?: Promise<PongoDb> | null;
  __pongoDbDriver?: DbDriver | null;
  __pongoPgClient?: unknown | null;
};

const globalCache = globalThis as unknown as DbGlobalCache;

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

let _db: PongoDb | null = null;
let _closeDb: DbCloseFn | null = null;

// If we already initialized in this Node process (e.g. Next.js HMR),
// reuse the same db/client rather than creating new connections.
if (globalCache.__pongoDb && globalCache.__pongoDbDriver === DB_DRIVER) {
  _db = globalCache.__pongoDb;
  _closeDb = globalCache.__pongoDbClose ?? null;
}

/**
 * Initialize the database connection based on detected driver
 */
async function initDatabase(): Promise<PongoDb> {
  if (_db) return _db;
  if (globalCache.__pongoDb && globalCache.__pongoDbDriver === DB_DRIVER) {
    _db = globalCache.__pongoDb;
    _closeDb = globalCache.__pongoDbClose ?? null;
    return _db;
  }

  if (DB_DRIVER === "pg") {
    // PostgreSQL with postgres-js
    const postgres = (await import("postgres")).default;
    const { drizzle } = await import("drizzle-orm/postgres-js");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is required for PostgreSQL");
    }

    const client =
      globalCache.__pongoDbDriver === "pg" && globalCache.__pongoPgClient
        ? (globalCache.__pongoPgClient as ReturnType<typeof postgres>)
        : postgres(connectionString);

    globalCache.__pongoDbDriver = "pg";
    globalCache.__pongoPgClient = client;

    _db = drizzle(client, { schema: pgSchema }) as unknown as PongoDb;
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

  globalCache.__pongoDbDriver = DB_DRIVER;
  globalCache.__pongoDb = _db;
  globalCache.__pongoDbClose = _closeDb;

  return _db!;
}

// Promise for async initialization
let dbPromise: Promise<PongoDb> | null = null;

function getDbPromise() {
  if (!dbPromise) {
    if (
      globalCache.__pongoDbPromise &&
      globalCache.__pongoDbDriver === DB_DRIVER
    ) {
      dbPromise = globalCache.__pongoDbPromise;
    } else {
      dbPromise = initDatabase();
      globalCache.__pongoDbPromise = dbPromise;
      globalCache.__pongoDbDriver = DB_DRIVER;
    }
  }
  return dbPromise;
}

/**
 * Get database instance asynchronously
 * This is the primary way to access the database
 */
export async function getDb(): Promise<PongoDb> {
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
    if (globalCache.__pongoDbDriver === DB_DRIVER) {
      globalCache.__pongoDb = null;
      globalCache.__pongoDbClose = null;
      globalCache.__pongoDbPromise = null;
      if (DB_DRIVER === "pg") {
        globalCache.__pongoPgClient = null;
      }
      globalCache.__pongoDbDriver = null;
    }
  }
}

/**
 * Execute a raw SQL query and return typed results
 * Use sql.raw() for the query string
 */
export async function runQuery<T>(queryStr: string): Promise<T[]> {
  const db = await getDb();

  if (DB_DRIVER === "pg") {
    // pg drizzle has execute() which returns rows directly
    const result = await (
      db as unknown as {
        execute: (q: ReturnType<typeof sql.raw>) => Promise<T[]>;
      }
    ).execute(sql.raw(queryStr));
    return result;
  }

  // libsql drizzle has all() which returns typed rows
  return db.all<T>(sql.raw(queryStr));
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

// Export tables that work for both drivers.
// When using pg, we assert the pg table to the sqlite table type.
// Both schemas are structurally identical at runtime.
export const checkResults =
  DB_DRIVER === "sqlite"
    ? sqliteSchema.checkResults
    : (pgSchema.checkResults as unknown as typeof sqliteSchema.checkResults);

export const alertState =
  DB_DRIVER === "sqlite"
    ? sqliteSchema.alertState
    : (pgSchema.alertState as unknown as typeof sqliteSchema.alertState);

export const alertEvents =
  DB_DRIVER === "sqlite"
    ? sqliteSchema.alertEvents
    : (pgSchema.alertEvents as unknown as typeof sqliteSchema.alertEvents);

export const alertOverrides =
  DB_DRIVER === "sqlite"
    ? sqliteSchema.alertOverrides
    : (pgSchema.alertOverrides as unknown as typeof sqliteSchema.alertOverrides);

// ============================================
// Schema modules for migrations/advanced use
// ============================================

export { pgSchema, sqliteSchema };

// ============================================
// Types - compatible across both drivers
// ============================================

export type {
  AlertEvent,
  AlertOverride,
  AlertState,
  CheckResult,
  NewAlertEvent,
  NewAlertOverride,
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
