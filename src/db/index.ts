import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as sqliteSchema from "./schema.sqlite";
import * as pgSchema from "./schema.pg";

/**
 * Database driver type
 * Set via DB_DRIVER environment variable
 * Defaults to 'sqlite' for backwards compatibility
 */
export type DbDriver = "sqlite" | "pg";

const dbDriver: DbDriver = (process.env.DB_DRIVER as DbDriver) ?? "sqlite";

/**
 * Database instance type based on driver
 */
export type Database =
  | BetterSQLite3Database<typeof sqliteSchema>
  | PostgresJsDatabase<typeof pgSchema>;

let _db: Database;
let _closeDb: (() => void) | (() => Promise<void>);

/**
 * Initialize the database connection based on DB_DRIVER
 */
async function initDatabase(): Promise<Database> {
  if (_db) return _db;

  if (dbDriver === "pg") {
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
    // SQLite with better-sqlite3 (default)
    const Database = (await import("better-sqlite3")).default;
    const { drizzle } = await import("drizzle-orm/better-sqlite3");

    const databasePath = process.env.DATABASE_URL ?? "./data/pongo.db";
    const sqlite = new Database(databasePath);

    // Enable WAL mode for better concurrent read performance
    sqlite.pragma("journal_mode = WAL");

    _db = drizzle(sqlite, { schema: sqliteSchema });
    _closeDb = () => {
      sqlite.close();
    };
  }

  return _db;
}

// Initialize on module load for synchronous access
// This works because Next.js server components run in Node.js
let dbPromise: Promise<Database> | null = null;

function getDbPromise(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = initDatabase();
  }
  return dbPromise;
}

// For synchronous SQLite access (backwards compatible)
// Will throw if using PostgreSQL and db not initialized
export function getDb(): Database {
  if (!_db) {
    // For SQLite, we can initialize synchronously
    if (dbDriver === "sqlite") {
      const Database = require("better-sqlite3");
      const { drizzle } = require("drizzle-orm/better-sqlite3");

      const databasePath = process.env.DATABASE_URL ?? "./data/pongo.db";
      const sqlite = new Database(databasePath);
      sqlite.pragma("journal_mode = WAL");

      _db = drizzle(sqlite, { schema: sqliteSchema });
      _closeDb = () => {
        sqlite.close();
      };
    } else {
      throw new Error(
        "Database not initialized. Use getDbAsync() for PostgreSQL.",
      );
    }
  }
  return _db;
}

/**
 * Get database instance asynchronously (works for both SQLite and PostgreSQL)
 */
export async function getDbAsync(): Promise<Database> {
  return getDbPromise();
}

/**
 * Get the current database driver
 */
export function getDbDriver(): DbDriver {
  return dbDriver;
}

/**
 * Get the appropriate schema based on the driver
 */
export function getSchema() {
  return dbDriver === "pg" ? pgSchema : sqliteSchema;
}

/**
 * Close the database connection
 * Call this when shutting down the application
 */
export async function closeDatabase(): Promise<void> {
  if (_closeDb) {
    await _closeDb();
  }
}

// Export the synchronous db getter as default for backwards compatibility
export const db = new Proxy({} as Database, {
  get(_, prop) {
    const database = getDb();
    return (database as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Re-export schemas
export * from "./schema";
export { sqliteSchema, pgSchema };
