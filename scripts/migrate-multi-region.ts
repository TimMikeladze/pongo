// scripts/migrate-multi-region.ts

import { sql } from "drizzle-orm";
import { getDbAsync, getDbDriver } from "@/db";

async function migrate() {
  console.log("Running multi-region migration...");

  const db = await getDbAsync();
  const driver = getDbDriver();

  if (driver === "pg") {
    // PostgreSQL migrations
    console.log("Adding region column to pongo_check_results...");
    await (db as any).execute(sql`
      ALTER TABLE pongo_check_results
      ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'default'
    `);

    console.log("Creating region indexes on pongo_check_results...");
    await (db as any).execute(sql`
      CREATE INDEX IF NOT EXISTS idx_pongo_check_results_region
      ON pongo_check_results(region)
    `);
    await (db as any).execute(sql`
      CREATE INDEX IF NOT EXISTS idx_pongo_check_results_monitor_region_checked_at
      ON pongo_check_results(monitor_id, region, checked_at DESC)
    `);

    console.log("Adding region column to pongo_alert_state...");
    await (db as any).execute(sql`
      ALTER TABLE pongo_alert_state
      ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'default'
    `);

    console.log("Updating pongo_alert_state primary key...");
    // Check if region column is already part of primary key
    const pkCheck = await (db as any).execute(sql`
      SELECT COUNT(*) as cnt FROM information_schema.key_column_usage
      WHERE table_name = 'pongo_alert_state'
      AND constraint_name = 'pongo_alert_state_pkey'
      AND column_name = 'region'
    `);
    const hasRegionInPK = pkCheck[0]?.cnt > 0;

    if (!hasRegionInPK) {
      // Drop old primary key and create new composite one
      await (db as any).execute(sql`
        ALTER TABLE pongo_alert_state DROP CONSTRAINT IF EXISTS pongo_alert_state_pkey
      `);
      await (db as any).execute(sql`
        ALTER TABLE pongo_alert_state ADD PRIMARY KEY (alert_id, region)
      `);
    } else {
      console.log("  Primary key already includes region column, skipping...");
    }

    console.log("Adding region column to pongo_alert_events...");
    await (db as any).execute(sql`
      ALTER TABLE pongo_alert_events
      ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'default'
    `);
  } else {
    // SQLite migrations
    // Note: SQLite doesn't support altering primary keys after table creation.
    // New SQLite databases will use the updated schema automatically.
    // Existing SQLite databases will keep the old single-column primary key.

    // SQLite doesn't support IF NOT EXISTS for ADD COLUMN, so we need to catch errors
    console.log("Adding region column to pongo_check_results...");
    try {
      await (db as any).run(sql`
        ALTER TABLE pongo_check_results ADD COLUMN region TEXT NOT NULL DEFAULT 'default'
      `);
    } catch (e: any) {
      const errMsg =
        (e.message?.toLowerCase() || "") +
        " " +
        (e.cause?.message?.toLowerCase() || "");
      if (errMsg.includes("duplicate column") || errMsg.includes("duplicate")) {
        console.log("  Column already exists, skipping...");
      } else {
        throw e;
      }
    }

    console.log("Creating region indexes...");
    await (db as any).run(sql`
      CREATE INDEX IF NOT EXISTS idx_pongo_check_results_region
      ON pongo_check_results(region)
    `);
    await (db as any).run(sql`
      CREATE INDEX IF NOT EXISTS idx_pongo_check_results_monitor_region_checked_at
      ON pongo_check_results(monitor_id, region, checked_at DESC)
    `);

    console.log("Adding region to pongo_alert_state...");
    try {
      await (db as any).run(sql`
        ALTER TABLE pongo_alert_state ADD COLUMN region TEXT NOT NULL DEFAULT 'default'
      `);
    } catch (e: any) {
      const errMsg =
        (e.message?.toLowerCase() || "") +
        " " +
        (e.cause?.message?.toLowerCase() || "");
      if (errMsg.includes("duplicate column") || errMsg.includes("duplicate")) {
        console.log("  Column already exists, skipping...");
      } else {
        throw e;
      }
    }

    console.log("Adding region to pongo_alert_events...");
    try {
      await (db as any).run(sql`
        ALTER TABLE pongo_alert_events ADD COLUMN region TEXT NOT NULL DEFAULT 'default'
      `);
    } catch (e: any) {
      const errMsg =
        (e.message?.toLowerCase() || "") +
        " " +
        (e.cause?.message?.toLowerCase() || "");
      if (errMsg.includes("duplicate column") || errMsg.includes("duplicate")) {
        console.log("  Column already exists, skipping...");
      } else {
        throw e;
      }
    }
  }

  console.log("Migration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
