/**
 * Seed script to populate 2 years of check results data
 * Run with: bun run scripts/seed-data.ts
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/db/schema.sqlite";

const MONITORS = ["example", "github"];
const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Realistic patterns
const UPTIME_PERCENTAGE = 0.995; // 99.5% uptime
const DEGRADED_PERCENTAGE = 0.003; // 0.3% degraded
const BASE_RESPONSE_TIME = { example: 150, github: 200 };
const RESPONSE_TIME_VARIANCE = 100;

function randomStatus(): "up" | "down" | "degraded" {
  const rand = Math.random();
  if (rand < UPTIME_PERCENTAGE) return "up";
  if (rand < UPTIME_PERCENTAGE + DEGRADED_PERCENTAGE) return "degraded";
  return "down";
}

function randomResponseTime(monitorId: string, status: string): number {
  const base =
    BASE_RESPONSE_TIME[monitorId as keyof typeof BASE_RESPONSE_TIME] || 150;

  if (status === "down") {
    // Timeouts are usually longer
    return base + Math.random() * 5000 + 2000;
  }

  if (status === "degraded") {
    // Degraded is slower but not timeout
    return base + Math.random() * 1500 + 500;
  }

  // Normal variance with occasional spikes
  const spike = Math.random() < 0.05 ? Math.random() * 300 : 0;
  return Math.round(
    base + (Math.random() - 0.5) * RESPONSE_TIME_VARIANCE + spike,
  );
}

function randomStatusCode(status: string): number | null {
  if (status === "down") {
    const codes = [500, 502, 503, 504, 0]; // 0 for timeout/connection error
    return codes[Math.floor(Math.random() * codes.length)] || null;
  }
  return 200;
}

function randomMessage(
  status: string,
  statusCode: number | null,
): string | null {
  if (status === "up") return null;

  if (status === "degraded") {
    return "Response time above threshold";
  }

  if (statusCode === 0 || statusCode === null) {
    const errors = [
      "Connection timeout",
      "Connection refused",
      "DNS resolution failed",
      "Socket hang up",
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  }

  return `HTTP ${statusCode}`;
}

// Add some realistic incident patterns
function shouldBeDown(date: Date, monitorId: string): boolean {
  // Create some multi-hour outages spread across the 2 years
  const incidentDates = [
    {
      start: new Date("2023-03-15T14:00:00Z"),
      durationHours: 2,
      monitor: "example",
    },
    {
      start: new Date("2023-06-22T08:30:00Z"),
      durationHours: 4,
      monitor: "github",
    },
    {
      start: new Date("2023-09-10T22:00:00Z"),
      durationHours: 1,
      monitor: "example",
    },
    {
      start: new Date("2023-12-01T03:00:00Z"),
      durationHours: 3,
      monitor: "github",
    },
    {
      start: new Date("2024-02-14T16:00:00Z"),
      durationHours: 2,
      monitor: "example",
    },
    {
      start: new Date("2024-05-20T11:00:00Z"),
      durationHours: 1.5,
      monitor: "github",
    },
    {
      start: new Date("2024-08-08T07:00:00Z"),
      durationHours: 5,
      monitor: "example",
    },
    {
      start: new Date("2024-10-30T19:00:00Z"),
      durationHours: 2,
      monitor: "github",
    },
    {
      start: new Date("2025-01-05T02:00:00Z"),
      durationHours: 1,
      monitor: "example",
    },
  ];

  for (const incident of incidentDates) {
    if (incident.monitor !== monitorId) continue;

    const incidentEnd = new Date(
      incident.start.getTime() + incident.durationHours * 60 * 60 * 1000,
    );
    if (date >= incident.start && date <= incidentEnd) {
      return true;
    }
  }

  return false;
}

async function main() {
  console.log("Connecting to database...");

  const client = createClient({ url: "file:./pongo/pongo.db" });
  const db = drizzle(client, { schema });

  const now = Date.now();
  const startTime = now - TWO_YEARS_MS;
  const totalChecks = Math.floor(TWO_YEARS_MS / CHECK_INTERVAL_MS);

  console.log(`Generating ${totalChecks} checks per monitor over 2 years...`);
  console.log(`Total records to insert: ${totalChecks * MONITORS.length}`);

  // Clear existing data
  console.log("Clearing existing check results...");
  await db.delete(schema.checkResults);

  // Insert in batches for performance
  const BATCH_SIZE = 1000;
  let inserted = 0;

  for (const monitorId of MONITORS) {
    console.log(`\nGenerating data for monitor: ${monitorId}`);
    let batch: (typeof schema.checkResults.$inferInsert)[] = [];

    for (let i = 0; i < totalChecks; i++) {
      const checkedAt = new Date(startTime + i * CHECK_INTERVAL_MS);

      // Determine status - check for planned incidents first
      let status: "up" | "down" | "degraded";
      if (shouldBeDown(checkedAt, monitorId)) {
        status = "down";
      } else {
        status = randomStatus();
      }

      const responseTimeMs = randomResponseTime(monitorId, status);
      const statusCode = randomStatusCode(status);
      const message = randomMessage(status, statusCode);

      batch.push({
        id: crypto.randomUUID(),
        monitorId,
        status,
        responseTimeMs,
        statusCode,
        message,
        checkedAt,
        createdAt: checkedAt,
      });

      if (batch.length >= BATCH_SIZE) {
        await db.insert(schema.checkResults).values(batch);
        inserted += batch.length;
        process.stdout.write(
          `\r  Inserted ${inserted.toLocaleString()} records...`,
        );
        batch = [];
      }
    }

    // Insert remaining
    if (batch.length > 0) {
      await db.insert(schema.checkResults).values(batch);
      inserted += batch.length;
    }

    console.log(`\n  Completed ${monitorId}`);
  }

  console.log(`\n\nDone! Inserted ${inserted.toLocaleString()} total records.`);

  // Show some stats
  const results = await db.select().from(schema.checkResults).limit(5);
  console.log("\nSample records:");
  console.table(
    results.map((r) => ({
      monitor: r.monitorId,
      status: r.status,
      responseMs: r.responseTimeMs,
      checkedAt: r.checkedAt?.toISOString().slice(0, 16),
    })),
  );

  client.close();
}

main().catch(console.error);
