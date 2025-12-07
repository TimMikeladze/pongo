import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"

/**
 * Database file path
 * Uses DATABASE_URL env var or defaults to ./data/pongo.db
 */
const databasePath = process.env.DATABASE_URL ?? "./data/pongo.db"

/**
 * SQLite database instance
 * Uses better-sqlite3 for synchronous, high-performance SQLite access
 */
const sqlite = new Database(databasePath)

/**
 * Enable WAL mode for better concurrent read performance
 * This is especially useful for a monitoring application where
 * writes happen periodically but reads are frequent
 */
sqlite.pragma("journal_mode = WAL")

/**
 * Drizzle ORM database instance
 * Provides type-safe query building and schema access
 */
export const db = drizzle(sqlite, { schema })

/**
 * Export schema for use in queries
 */
export * from "./schema"

/**
 * Close the database connection
 * Call this when shutting down the application
 */
export function closeDatabase() {
  sqlite.close()
}
