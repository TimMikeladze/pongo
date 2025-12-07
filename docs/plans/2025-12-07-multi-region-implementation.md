# Multi-Region Monitoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable monitors to run from multiple geographic locations with per-region latency visibility and configurable multi-region alert thresholds.

**Architecture:** Fully independent schedulers per region, all writing to shared PostgreSQL database. Each scheduler reads `PONGO_REGION` env var and tags results with it. Alert evaluation aggregates across regions based on configurable thresholds.

**Tech Stack:** Drizzle ORM (PostgreSQL), Bun, Hono, Next.js, React

---

## Task 1: Add region column to database schemas

**Files:**
- Modify: `src/db/schema.pg.ts`
- Modify: `src/db/schema.sqlite.ts`

**Step 1: Add region to checkResults in PostgreSQL schema**

In `src/db/schema.pg.ts`, add `region` column to `checkResults` table:

```typescript
/** Region where the check was executed */
region: text("region").notNull().default("default"),
```

Add after `message` field (line ~46). Also add index in the table's index array:

```typescript
index("idx_pongo_check_results_region").on(table.region),
index("idx_pongo_check_results_monitor_region_checked_at").on(
  table.monitorId,
  table.region,
  table.checkedAt,
),
```

**Step 2: Add region to alertState in PostgreSQL schema**

In same file, add `region` column to `alertState` table. Change the primary key from just `alertId` to a composite, and add `region`:

```typescript
export const alertState = pgTable("pongo_alert_state", {
  alertId: text("alert_id").notNull(),
  monitorId: text("monitor_id").notNull(),
  region: text("region").notNull().default("default"),
  status: alertStatusPgEnum("status").notNull().default("ok"),
  lastFiredAt: timestamp("last_fired_at", { mode: "date" }),
  lastResolvedAt: timestamp("last_resolved_at", { mode: "date" }),
  currentEventId: text("current_event_id"),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => [
  // Composite primary key
  primaryKey({ columns: [table.alertId, table.region] }),
  index("idx_pongo_alert_state_monitor_id").on(table.monitorId),
]);
```

Import `primaryKey` from `drizzle-orm/pg-core`.

**Step 3: Add region to alertEvents in PostgreSQL schema**

Add `region` column:

```typescript
region: text("region").notNull().default("default"),
```

**Step 4: Repeat for SQLite schema**

Apply same changes to `src/db/schema.sqlite.ts`:
- Add `region` to `checkResults`
- Add `region` to `alertState` with composite primary key
- Add `region` to `alertEvents`

For SQLite composite primary key, use:

```typescript
import { primaryKey } from "drizzle-orm/sqlite-core";
```

**Step 5: Verify types compile**

Run: `bunx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/db/schema.pg.ts src/db/schema.sqlite.ts
git commit -m "feat(db): add region column to checkResults, alertState, alertEvents"
```

---

## Task 2: Create migration script

**Files:**
- Create: `scripts/migrate-multi-region.ts`

**Step 1: Create migration script**

```typescript
// scripts/migrate-multi-region.ts
import { getDbAsync, getDbDriver } from "@/db";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Running multi-region migration...");

  const db = await getDbAsync();
  const driver = getDbDriver();

  if (driver === "pg") {
    // PostgreSQL migrations
    console.log("Adding region column to pongo_check_results...");
    await db.execute(sql`
      ALTER TABLE pongo_check_results
      ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'default'
    `);

    console.log("Creating region indexes on pongo_check_results...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_pongo_check_results_region
      ON pongo_check_results(region)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_pongo_check_results_monitor_region_checked_at
      ON pongo_check_results(monitor_id, region, checked_at DESC)
    `);

    console.log("Adding region column to pongo_alert_state...");
    await db.execute(sql`
      ALTER TABLE pongo_alert_state
      ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'default'
    `);

    console.log("Updating pongo_alert_state primary key...");
    // Drop old primary key and create new composite one
    await db.execute(sql`
      ALTER TABLE pongo_alert_state DROP CONSTRAINT IF EXISTS pongo_alert_state_pkey
    `);
    await db.execute(sql`
      ALTER TABLE pongo_alert_state ADD PRIMARY KEY (alert_id, region)
    `);

    console.log("Adding region column to pongo_alert_events...");
    await db.execute(sql`
      ALTER TABLE pongo_alert_events
      ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'default'
    `);
  } else {
    // SQLite migrations
    console.log("Adding region column to pongo_check_results...");
    await db.execute(sql`
      ALTER TABLE pongo_check_results ADD COLUMN region TEXT NOT NULL DEFAULT 'default'
    `);

    console.log("Creating region indexes...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_pongo_check_results_region
      ON pongo_check_results(region)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_pongo_check_results_monitor_region_checked_at
      ON pongo_check_results(monitor_id, region, checked_at DESC)
    `);

    console.log("Adding region to pongo_alert_state...");
    await db.execute(sql`
      ALTER TABLE pongo_alert_state ADD COLUMN region TEXT NOT NULL DEFAULT 'default'
    `);

    console.log("Adding region to pongo_alert_events...");
    await db.execute(sql`
      ALTER TABLE pongo_alert_events ADD COLUMN region TEXT NOT NULL DEFAULT 'default'
    `);
  }

  console.log("Migration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
```

**Step 2: Test migration runs without error**

Run: `bun run scripts/migrate-multi-region.ts`
Expected: "Migration complete!" (or table already has columns if run twice)

**Step 3: Commit**

```bash
git add scripts/migrate-multi-region.ts
git commit -m "feat(scripts): add multi-region database migration"
```

---

## Task 3: Add region to scheduler logger

**Files:**
- Modify: `src/scheduler/logger.ts`
- Modify: `src/scheduler/index.ts`

**Step 1: Export region from index.ts**

In `src/scheduler/index.ts`, add region detection and export it:

```typescript
// At top of file, after imports
export const REGION = process.env.PONGO_REGION || process.env.FLY_REGION || "default";
```

Update the main() function to log the region at startup:

```typescript
async function main() {
  console.log("=".repeat(60));
  console.log("Pongo Scheduler");
  console.log(`Region: ${REGION}`);
  console.log("=".repeat(60));
  // ... rest unchanged
}
```

**Step 2: Update logger to include region**

In `src/scheduler/logger.ts`, import REGION and include it in database writes:

```typescript
import { REGION } from "./index";
```

Update `logToDatabase`:

```typescript
export async function logToDatabase(result: ExecutionResult): Promise<string> {
  const db = await getDbAsync();
  const driver = getDbDriver();
  const checkResults = driver === "pg" ? pgCheckResults : sqliteCheckResults;

  const id = crypto.randomUUID();

  // biome-ignore lint/suspicious/noExplicitAny: dual-schema type union issue
  await (db as any).insert(checkResults).values({
    id,
    monitorId: result.monitorId,
    status: result.result.status,
    responseTimeMs: result.result.responseTime,
    statusCode: result.result.statusCode ?? null,
    message: result.result.message ?? null,
    region: REGION,
    checkedAt: result.executedAt,
  });

  return id;
}
```

Update `logToConsole` to show region:

```typescript
export function logToConsole(result: ExecutionResult): void {
  const { monitorId, result: r, attempts, executedAt } = result;
  const status = r.status.toUpperCase().padEnd(8);
  const time = `${r.responseTime}ms`.padStart(8);
  const retriesInfo = attempts > 1 ? ` (${attempts} attempts)` : "";
  const message = r.message ? ` - ${r.message}` : "";

  console.log(
    `[${formatTime(executedAt)}] [${REGION}] ${monitorId.padEnd(20)} ${status} ${time}${retriesInfo}${message}`,
  );
}
```

**Step 3: Verify build**

Run: `bunx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/scheduler/index.ts src/scheduler/logger.ts
git commit -m "feat(scheduler): log check results with region tag"
```

---

## Task 4: Update scheduler HTTP API with region

**Files:**
- Modify: `src/scheduler/server.ts`

**Step 1: Import REGION and update health endpoint**

```typescript
import { REGION } from "./index";
```

Update health endpoint:

```typescript
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    region: REGION,
  });
});
```

Update monitor list to include region:

```typescript
app.get("/monitors", (c) => {
  const monitors = scheduler.getMonitorIds().map((id) => {
    const state = scheduler.getState(id);
    return {
      id,
      region: REGION,
      lastRun: state?.lastRun?.toISOString() ?? null,
      lastStatus: state?.lastResult?.status ?? null,
      isRunning: state?.isRunning ?? false,
      consecutiveFailures: state?.consecutiveFailures ?? 0,
    };
  });
  return c.json({ monitors, region: REGION });
});
```

**Step 2: Verify build**

Run: `bunx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/scheduler/server.ts
git commit -m "feat(scheduler): include region in HTTP API responses"
```

---

## Task 5: Add regionThreshold to alert types

**Files:**
- Modify: `src/scheduler/alerts/types.ts`

**Step 1: Add RegionThreshold type and update AlertConfig**

```typescript
/**
 * Region threshold for multi-region alerting
 * - 'any': fire if any region triggers (default)
 * - 'majority': fire if >50% of regions trigger
 * - 'all': fire only if all regions trigger
 * - number: fire if N or more regions trigger
 */
export type RegionThreshold = "any" | "majority" | "all" | number;

/**
 * Alert definition within a monitor
 */
export interface AlertConfig {
  id: string;
  name: string;
  condition: AlertCondition;
  channels: string[];
  regionThreshold?: RegionThreshold;
}
```

**Step 2: Update WebhookPayload to include region info**

```typescript
export interface WebhookPayload {
  event: "alert.fired" | "alert.resolved";
  alert: {
    id: string;
    name: string;
    monitorId: string;
    monitorName: string;
  };
  timestamp: string;
  snapshot: AlertSnapshot;
  checkResult: {
    id: string;
    status: string;
    responseTimeMs: number;
    message: string | null;
    checkedAt: string;
  };
  region?: string;
  firingRegions?: string[];
  healthyRegions?: string[];
}
```

**Step 3: Commit**

```bash
git add src/scheduler/alerts/types.ts
git commit -m "feat(alerts): add regionThreshold type for multi-region alerting"
```

---

## Task 6: Update alert evaluator for multi-region

**Files:**
- Modify: `src/scheduler/alerts/evaluator.ts`

**Step 1: Import REGION and update query to filter by region**

Add import:

```typescript
import { REGION } from "../index";
```

**Step 2: Update history query to filter by region**

In `evaluateAlerts`, update the history fetch to only get this region's results:

```typescript
const history = (await (db as any)
  .select()
  .from(checkResultsTable)
  .where(
    and(
      eq(checkResultsTable.monitorId, monitorId),
      eq(checkResultsTable.region, REGION)
    )
  )
  .orderBy(desc(checkResultsTable.checkedAt))
  .limit(HISTORY_LIMIT)) as CheckResultWithId[];
```

Import `and` from drizzle-orm if not already imported.

**Step 3: Update alert state queries to include region**

When querying for current state:

```typescript
const [currentState] = (await (db as any)
  .select()
  .from(alertStateTable)
  .where(
    and(
      eq(alertStateTable.alertId, alert.id),
      eq(alertStateTable.region, REGION)
    )
  )) as Array<{
  alertId: string;
  status: "ok" | "firing";
  currentEventId: string | null;
}>;
```

**Step 4: Update alert state inserts/updates to include region**

When creating alert state:

```typescript
await (db as any).insert(alertStateTable).values({
  alertId: alert.id,
  monitorId,
  region: REGION,
  status: "firing",
  lastFiredAt: new Date(),
  currentEventId: eventId,
});
```

When updating alert state, add region to where clause:

```typescript
.where(
  and(
    eq(alertStateTable.alertId, alert.id),
    eq(alertStateTable.region, REGION)
  )
)
```

**Step 5: Update alert event inserts to include region**

```typescript
await (db as any).insert(alertEventsTable).values({
  id: eventId,
  alertId: alert.id,
  monitorId,
  region: REGION,
  eventType: "fired",
  triggeredAt: new Date(),
  snapshot,
  triggerCheckId: latestCheckId,
});
```

**Step 6: Add region to webhook payload**

```typescript
const payload: WebhookPayload = {
  event: "alert.fired",
  alert: {
    id: alert.id,
    name: alert.name,
    monitorId,
    monitorName,
  },
  timestamp: new Date().toISOString(),
  snapshot,
  checkResult: {
    id: latestCheck.id,
    status: latestCheck.status,
    responseTimeMs: latestCheck.responseTimeMs,
    message: latestCheck.message,
    checkedAt: latestCheck.checkedAt.toISOString(),
  },
  region: REGION,
};
```

**Step 7: Verify build**

Run: `bunx tsc --noEmit`
Expected: No errors

**Step 8: Commit**

```bash
git add src/scheduler/alerts/evaluator.ts
git commit -m "feat(alerts): evaluate alerts per-region with region tagging"
```

---

## Task 7: Add multi-region aggregation for alerting

**Files:**
- Modify: `src/scheduler/alerts/evaluator.ts`

**Step 1: Add helper function to get active regions**

Add after imports:

```typescript
import { gt } from "drizzle-orm";

/**
 * Get regions that have reported check results in the last hour
 */
async function getActiveRegions(
  db: any,
  checkResultsTable: any,
  monitorId: string
): Promise<string[]> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const results = await db
    .selectDistinct({ region: checkResultsTable.region })
    .from(checkResultsTable)
    .where(
      and(
        eq(checkResultsTable.monitorId, monitorId),
        gt(checkResultsTable.checkedAt, oneHourAgo)
      )
    );

  return results.map((r: { region: string }) => r.region);
}

/**
 * Get regions where an alert is currently firing
 */
async function getFiringRegions(
  db: any,
  alertStateTable: any,
  monitorId: string,
  alertId: string
): Promise<string[]> {
  const results = await db
    .select({ region: alertStateTable.region })
    .from(alertStateTable)
    .where(
      and(
        eq(alertStateTable.monitorId, monitorId),
        eq(alertStateTable.alertId, alertId),
        eq(alertStateTable.status, "firing")
      )
    );

  return results.map((r: { region: string }) => r.region);
}

/**
 * Check if global alert should dispatch based on regionThreshold
 */
function shouldDispatchGlobal(
  threshold: RegionThreshold,
  firingCount: number,
  totalCount: number
): boolean {
  if (threshold === "any") return firingCount >= 1;
  if (threshold === "all") return firingCount === totalCount && totalCount > 0;
  if (threshold === "majority") return firingCount > totalCount / 2;
  if (typeof threshold === "number") return firingCount >= threshold;
  return firingCount >= 1; // default to 'any'
}
```

Import `RegionThreshold` from types:

```typescript
import type {
  AlertConfig,
  AlertSnapshot,
  CheckResultWithId,
  RegionThreshold,
  WebhookPayload,
} from "./types";
```

**Step 2: Update dispatch logic to check regionThreshold**

After updating local alert state to "firing", check if global dispatch is needed:

```typescript
if (conditionMet && !isCurrentlyFiring) {
  // ... create event, update state (existing code) ...

  // Check if we should dispatch globally
  const threshold = alert.regionThreshold ?? "any";
  const activeRegions = await getActiveRegions(db, checkResultsTable, monitorId);
  const firingRegions = await getFiringRegions(db, alertStateTable, monitorId, alert.id);
  const healthyRegions = activeRegions.filter(r => !firingRegions.includes(r));

  if (shouldDispatchGlobal(threshold, firingRegions.length, activeRegions.length)) {
    const payload: WebhookPayload = {
      event: "alert.fired",
      alert: {
        id: alert.id,
        name: alert.name,
        monitorId,
        monitorName,
      },
      timestamp: new Date().toISOString(),
      snapshot,
      checkResult: {
        id: latestCheck.id,
        status: latestCheck.status,
        responseTimeMs: latestCheck.responseTimeMs,
        message: latestCheck.message,
        checkedAt: latestCheck.checkedAt.toISOString(),
      },
      region: REGION,
      firingRegions,
      healthyRegions,
    };

    await dispatchToChannels(alert.channels, channels, payload);
    console.log(`[alerts] FIRED: ${alert.name} (${alert.id}) - ${firingRegions.length}/${activeRegions.length} regions`);
  } else {
    console.log(`[alerts] ${alert.name} (${alert.id}) firing in ${REGION}, but threshold not met (${firingRegions.length}/${activeRegions.length})`);
  }
}
```

Apply similar logic for resolution - only dispatch if alert is no longer firing in enough regions.

**Step 3: Verify build**

Run: `bunx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/scheduler/alerts/evaluator.ts
git commit -m "feat(alerts): add multi-region aggregation with configurable thresholds"
```

---

## Task 8: Add region data to UI queries

**Files:**
- Modify: `src/lib/data.ts`

**Step 1: Add getActiveRegions function**

```typescript
/**
 * Get all regions that have reported results recently
 */
export const getActiveRegions = cache(async (): Promise<string[]> => {
  const db = await getDbAsync();
  const driver = getDbDriver();
  const checkResults = driver === "pg" ? pgSchema.checkResults : sqliteSchema.checkResults;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // biome-ignore lint/suspicious/noExplicitAny: dual-schema
  const results = await (db as any)
    .selectDistinct({ region: checkResults.region })
    .from(checkResults)
    .where(gte(checkResults.checkedAt, oneHourAgo));

  return results.map((r: { region: string }) => r.region);
});
```

**Step 2: Add getCheckResultsByRegion function**

```typescript
/**
 * Get latest check result per region for a monitor
 */
export const getLatestCheckResultByRegion = cache(
  async (monitorId: string): Promise<Record<string, CheckResult | null>> => {
    const db = await getDbAsync();
    const driver = getDbDriver();
    const checkResults = driver === "pg" ? pgSchema.checkResults : sqliteSchema.checkResults;

    const regions = await getActiveRegions();
    const result: Record<string, CheckResult | null> = {};

    for (const region of regions) {
      // biome-ignore lint/suspicious/noExplicitAny: dual-schema
      const [latest] = await (db as any)
        .select()
        .from(checkResults)
        .where(
          and(
            eq(checkResults.monitorId, monitorId),
            eq(checkResults.region, region)
          )
        )
        .orderBy(desc(checkResults.checkedAt))
        .limit(1);

      result[region] = latest ?? null;
    }

    return result;
  }
);
```

**Step 3: Add getMonitorStatsByRegion function**

```typescript
export interface RegionStats {
  region: string;
  uptime: number;
  avgResponseTime: number;
  lastCheck: Date | null;
  status: MonitorStatus;
}

/**
 * Get monitor stats broken down by region
 */
export const getMonitorStatsByRegion = cache(
  async (monitorId: string, timeRange: TimeRange): Promise<RegionStats[]> => {
    const db = await getDbAsync();
    const driver = getDbDriver();
    const checkResults = driver === "pg" ? pgSchema.checkResults : sqliteSchema.checkResults;

    const regions = await getActiveRegions();
    const stats: RegionStats[] = [];

    for (const region of regions) {
      // biome-ignore lint/suspicious/noExplicitAny: dual-schema
      const results = await (db as any)
        .select()
        .from(checkResults)
        .where(
          and(
            eq(checkResults.monitorId, monitorId),
            eq(checkResults.region, region),
            gte(checkResults.checkedAt, timeRange.from),
            lte(checkResults.checkedAt, timeRange.to)
          )
        )
        .orderBy(desc(checkResults.checkedAt));

      if (results.length === 0) continue;

      const upCount = results.filter((r: any) => r.status === "up").length;
      const uptime = results.length > 0 ? (upCount / results.length) * 100 : 100;
      const avgResponseTime = results.length > 0
        ? results.reduce((sum: number, r: any) => sum + r.responseTimeMs, 0) / results.length
        : 0;

      stats.push({
        region,
        uptime: Math.round(uptime * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        lastCheck: results[0]?.checkedAt ?? null,
        status: results[0]?.status ?? "pending",
      });
    }

    return stats;
  }
);
```

**Step 4: Commit**

```bash
git add src/lib/data.ts
git commit -m "feat(data): add region-aware data fetching functions"
```

---

## Task 9: Add region breakdown component

**Files:**
- Create: `src/components/region-breakdown.tsx`

**Step 1: Create RegionBreakdown component**

```tsx
// src/components/region-breakdown.tsx
import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "./status-badge";
import type { RegionStats } from "@/lib/data";

interface RegionBreakdownProps {
  stats: RegionStats[];
}

export function RegionBreakdown({ stats }: RegionBreakdownProps) {
  if (stats.length <= 1) {
    return null; // Don't show if only one region
  }

  const healthyCount = stats.filter(s => s.status === "up").length;
  const totalCount = stats.length;

  return (
    <div className="border border-border rounded bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">
          regions
        </h3>
        <span className="text-xs text-muted-foreground">
          {healthyCount}/{totalCount} healthy
        </span>
      </div>
      <div className="space-y-2">
        {stats.map((stat) => (
          <div
            key={stat.region}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <StatusBadge status={stat.status} size="sm" />
              <span className="text-xs font-mono">{stat.region}</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span>{stat.avgResponseTime}ms</span>
              <span>{stat.uptime}%</span>
              <span>
                {stat.lastCheck
                  ? formatDistanceToNow(stat.lastCheck, { addSuffix: true })
                  : "never"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/region-breakdown.tsx
git commit -m "feat(ui): add RegionBreakdown component"
```

---

## Task 10: Add region breakdown to monitor detail page

**Files:**
- Modify: `src/app/monitors/[id]/page.tsx`

**Step 1: Import new components and data functions**

```typescript
import { RegionBreakdown } from "@/components/region-breakdown";
import { getMonitorStatsByRegion } from "@/lib/data";
```

**Step 2: Fetch region stats in page**

Add to the Promise.all:

```typescript
const [
  latestResult,
  results,
  stats,
  regionStats, // add this
  dashboards,
  // ... rest
] = await Promise.all([
  getLatestCheckResult(id),
  getCheckResults(id, { timeRange, limit: 10 }),
  getMonitorStats(id, timeRange),
  getMonitorStatsByRegion(id, timeRange), // add this
  getDashboards(),
  // ... rest
]);
```

**Step 3: Add RegionBreakdown to the page**

After the stats grid and before the uptime bars:

```tsx
{/* Region breakdown */}
{regionStats.length > 1 && (
  <RegionBreakdown stats={regionStats} />
)}
```

**Step 4: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/app/monitors/[id]/page.tsx
git commit -m "feat(ui): show region breakdown on monitor detail page"
```

---

## Task 11: Update monitors list to show aggregated status

**Files:**
- Modify: `src/lib/data.ts`
- Modify: `src/app/monitors/page.tsx`

**Step 1: Add aggregateStatus helper in data.ts**

```typescript
/**
 * Compute aggregate status from multiple regions
 * - all up = up
 * - all down = down
 * - mixed = degraded
 */
export function aggregateStatus(statuses: MonitorStatus[]): MonitorStatus {
  if (statuses.length === 0) return "pending";
  const uniqueStatuses = [...new Set(statuses)];
  if (uniqueStatuses.length === 1) return uniqueStatuses[0];
  if (uniqueStatuses.every(s => s === "down")) return "down";
  if (uniqueStatuses.every(s => s === "up")) return "up";
  return "degraded";
}
```

**Step 2: Update getLatestCheckResult to aggregate**

Modify to return aggregated status when multiple regions exist:

```typescript
export const getLatestCheckResult = cache(
  async (monitorId: string): Promise<CheckResult | null> => {
    const db = await getDbAsync();
    const driver = getDbDriver();
    const checkResults = driver === "pg" ? pgSchema.checkResults : sqliteSchema.checkResults;

    // Get latest result per region
    const regions = await getActiveRegions();

    if (regions.length <= 1) {
      // Single region - return as-is
      // biome-ignore lint/suspicious/noExplicitAny: dual-schema
      const [result] = await (db as any)
        .select()
        .from(checkResults)
        .where(eq(checkResults.monitorId, monitorId))
        .orderBy(desc(checkResults.checkedAt))
        .limit(1);
      return result ?? null;
    }

    // Multiple regions - get latest from each and aggregate
    const latestPerRegion: CheckResult[] = [];
    for (const region of regions) {
      // biome-ignore lint/suspicious/noExplicitAny: dual-schema
      const [result] = await (db as any)
        .select()
        .from(checkResults)
        .where(
          and(
            eq(checkResults.monitorId, monitorId),
            eq(checkResults.region, region)
          )
        )
        .orderBy(desc(checkResults.checkedAt))
        .limit(1);
      if (result) latestPerRegion.push(result);
    }

    if (latestPerRegion.length === 0) return null;

    // Return most recent with aggregated status
    const mostRecent = latestPerRegion.sort(
      (a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()
    )[0];

    return {
      ...mostRecent,
      status: aggregateStatus(latestPerRegion.map(r => r.status)),
    };
  }
);
```

**Step 3: Commit**

```bash
git add src/lib/data.ts src/app/monitors/page.tsx
git commit -m "feat(ui): aggregate status across regions on monitors list"
```

---

## Task 12: Final verification and documentation

**Step 1: Run full build**

Run: `bun run build`
Expected: Build succeeds with no errors

**Step 2: Test scheduler startup**

Run: `PONGO_REGION=test-region timeout 5 bun run src/scheduler/index.ts || true`
Expected: Logs show "Region: test-region"

**Step 3: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: finalize multi-region monitoring implementation"
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/db/schema.pg.ts` | Add `region` column to checkResults, alertState, alertEvents |
| `src/db/schema.sqlite.ts` | Add `region` column to checkResults, alertState, alertEvents |
| `scripts/migrate-multi-region.ts` | Migration script for existing databases |
| `src/scheduler/index.ts` | Export `REGION` constant from env |
| `src/scheduler/logger.ts` | Include region in check result logging |
| `src/scheduler/server.ts` | Include region in HTTP API responses |
| `src/scheduler/alerts/types.ts` | Add `RegionThreshold` type, update `WebhookPayload` |
| `src/scheduler/alerts/evaluator.ts` | Evaluate alerts per-region, aggregate for dispatch |
| `src/lib/data.ts` | Add region-aware query functions |
| `src/components/region-breakdown.tsx` | New component for region stats display |
| `src/app/monitors/[id]/page.tsx` | Show region breakdown on monitor detail |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PONGO_REGION` | Region identifier for this scheduler | Falls back to `FLY_REGION` or `"default"` |

## Deployment

Deploy same scheduler to multiple regions with different `PONGO_REGION` values:

```bash
# Fly.io
fly scale count scheduler=1 --region iad
fly scale count scheduler=1 --region lhr

# EC2/other
PONGO_REGION=us-east bun run src/scheduler/index.ts
PONGO_REGION=eu-west bun run src/scheduler/index.ts
```
