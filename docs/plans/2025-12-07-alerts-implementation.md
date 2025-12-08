# Alert System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add code-defined alerts to monitors with declarative and callback-based conditions, webhook delivery, and database state tracking.

**Architecture:** Alerts are evaluated synchronously after each monitor check. Alert state persists in the database. Webhooks fire on state transitions (ok→firing, firing→ok).

**Tech Stack:** TypeScript, Drizzle ORM, Bun runtime

---

## Task 1: Alert Type Definitions

**Files:**
- Create: `src/scheduler/alerts/types.ts`

**Step 1: Create the alert types file**

```typescript
// src/scheduler/alerts/types.ts
import type { MonitorResult } from "@/lib/config-types";

/**
 * Check result with ID for database references
 */
export interface CheckResultWithId {
  id: string;
  monitorId: string;
  status: "up" | "down" | "degraded" | "pending";
  responseTimeMs: number;
  statusCode: number | null;
  message: string | null;
  checkedAt: Date;
}

/**
 * Declarative alert conditions
 */
export type DeclarativeCondition =
  | { consecutiveFailures: number }
  | { consecutiveSuccesses: number }
  | { latencyAboveMs: number; forChecks?: number }
  | { status: "down" | "degraded"; forChecks?: number }
  | { downForMs: number }
  | { upForMs: number };

/**
 * Callback-based condition function
 */
export type ConditionCallback = (
  result: CheckResultWithId,
  history: CheckResultWithId[]
) => boolean;

/**
 * Alert condition - declarative or callback
 */
export type AlertCondition = DeclarativeCondition | ConditionCallback;

/**
 * Alert definition within a monitor
 */
export interface AlertConfig {
  id: string;
  name: string;
  condition: AlertCondition;
  channels: string[];
}

/**
 * Alert state in memory/database
 */
export type AlertStatus = "ok" | "firing";

/**
 * Alert event types
 */
export type AlertEventType = "fired" | "resolved";

/**
 * Snapshot of state when alert fires
 */
export interface AlertSnapshot {
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastStatus: string;
  lastResponseTimeMs: number | null;
  lastMessage: string | null;
}

/**
 * Webhook payload sent to channels
 */
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
}
```

**Step 2: Verify file compiles**

Run: `bunx tsc --noEmit src/scheduler/alerts/types.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/scheduler/alerts/types.ts
git commit -m "feat(alerts): add alert type definitions"
```

---

## Task 2: Database Schema for Alerts

**Files:**
- Modify: `src/db/schema.sqlite.ts`
- Modify: `src/db/schema.pg.ts`

**Step 1: Add alert tables to SQLite schema**

Add after `checkResultsIndexes` in `src/db/schema.sqlite.ts`:

```typescript
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
export const alertState = sqliteTable("pongo_alert_state", {
  alertId: text("alert_id").primaryKey(),
  monitorId: text("monitor_id").notNull(),
  status: text("status", { enum: alertStatusEnum }).notNull().default("ok"),
  lastFiredAt: integer("last_fired_at", { mode: "timestamp_ms" }),
  lastResolvedAt: integer("last_resolved_at", { mode: "timestamp_ms" }),
  currentEventId: text("current_event_id"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

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
```

**Step 2: Add alert tables to PostgreSQL schema**

Add to `src/db/schema.pg.ts` (same structure, using `pgTable` and PostgreSQL types):

```typescript
import { pgTable, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const alertStatusPgEnum = pgEnum("alert_status", ["ok", "firing"]);
export const alertEventTypePgEnum = pgEnum("alert_event_type", ["fired", "resolved"]);

export const alertState = pgTable("pongo_alert_state", {
  alertId: text("alert_id").primaryKey(),
  monitorId: text("monitor_id").notNull(),
  status: alertStatusPgEnum("status").notNull().default("ok"),
  lastFiredAt: timestamp("last_fired_at", { mode: "date" }),
  lastResolvedAt: timestamp("last_resolved_at", { mode: "date" }),
  currentEventId: text("current_event_id"),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type AlertState = typeof alertState.$inferSelect;
export type NewAlertState = typeof alertState.$inferInsert;

export const alertEvents = pgTable("pongo_alert_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  alertId: text("alert_id").notNull(),
  monitorId: text("monitor_id").notNull(),
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
```

**Step 3: Verify schemas compile**

Run: `bunx tsc --noEmit src/db/schema.sqlite.ts src/db/schema.pg.ts`
Expected: No errors

**Step 4: Generate migrations**

Run: `bun run db:sqlite:generate`
Expected: Migration files created in `drizzle/` folder

**Step 5: Commit**

```bash
git add src/db/schema.sqlite.ts src/db/schema.pg.ts drizzle/
git commit -m "feat(alerts): add alert_state and alert_events database tables"
```

---

## Task 3: Condition Evaluators

**Files:**
- Create: `src/scheduler/alerts/conditions.ts`
- Create: `src/scheduler/alerts/conditions.test.ts`

**Step 1: Write failing tests for condition evaluators**

```typescript
// src/scheduler/alerts/conditions.test.ts
import { describe, test, expect } from "bun:test";
import { evaluateCondition } from "./conditions";
import type { CheckResultWithId, AlertCondition } from "./types";

function makeCheck(
  overrides: Partial<CheckResultWithId> = {}
): CheckResultWithId {
  return {
    id: crypto.randomUUID(),
    monitorId: "test-monitor",
    status: "up",
    responseTimeMs: 100,
    statusCode: 200,
    message: null,
    checkedAt: new Date(),
    ...overrides,
  };
}

describe("evaluateCondition", () => {
  describe("consecutiveFailures", () => {
    test("returns false when no failures", () => {
      const condition: AlertCondition = { consecutiveFailures: 3 };
      const history = [makeCheck(), makeCheck(), makeCheck()];
      expect(evaluateCondition(condition, history[0], history)).toBe(false);
    });

    test("returns true when threshold met", () => {
      const condition: AlertCondition = { consecutiveFailures: 3 };
      const history = [
        makeCheck({ status: "down" }),
        makeCheck({ status: "down" }),
        makeCheck({ status: "down" }),
      ];
      expect(evaluateCondition(condition, history[0], history)).toBe(true);
    });

    test("returns false when threshold not met", () => {
      const condition: AlertCondition = { consecutiveFailures: 3 };
      const history = [
        makeCheck({ status: "down" }),
        makeCheck({ status: "down" }),
        makeCheck({ status: "up" }),
      ];
      expect(evaluateCondition(condition, history[0], history)).toBe(false);
    });
  });

  describe("consecutiveSuccesses", () => {
    test("returns true when threshold met", () => {
      const condition: AlertCondition = { consecutiveSuccesses: 2 };
      const history = [makeCheck(), makeCheck()];
      expect(evaluateCondition(condition, history[0], history)).toBe(true);
    });
  });

  describe("latencyAboveMs", () => {
    test("returns true when latency exceeds threshold", () => {
      const condition: AlertCondition = { latencyAboveMs: 500, forChecks: 2 };
      const history = [
        makeCheck({ responseTimeMs: 600 }),
        makeCheck({ responseTimeMs: 550 }),
      ];
      expect(evaluateCondition(condition, history[0], history)).toBe(true);
    });

    test("returns false when not enough checks exceed threshold", () => {
      const condition: AlertCondition = { latencyAboveMs: 500, forChecks: 2 };
      const history = [
        makeCheck({ responseTimeMs: 600 }),
        makeCheck({ responseTimeMs: 100 }),
      ];
      expect(evaluateCondition(condition, history[0], history)).toBe(false);
    });
  });

  describe("status condition", () => {
    test("returns true when status matches for required checks", () => {
      const condition: AlertCondition = { status: "degraded", forChecks: 2 };
      const history = [
        makeCheck({ status: "degraded" }),
        makeCheck({ status: "degraded" }),
      ];
      expect(evaluateCondition(condition, history[0], history)).toBe(true);
    });
  });

  describe("callback condition", () => {
    test("invokes callback with result and history", () => {
      const condition: AlertCondition = (result, history) => {
        return history.filter((r) => r.status === "degraded").length >= 3;
      };
      const history = [
        makeCheck({ status: "degraded" }),
        makeCheck({ status: "up" }),
        makeCheck({ status: "degraded" }),
        makeCheck({ status: "up" }),
        makeCheck({ status: "degraded" }),
      ];
      expect(evaluateCondition(condition, history[0], history)).toBe(true);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test src/scheduler/alerts/conditions.test.ts`
Expected: FAIL - module not found

**Step 3: Implement condition evaluators**

```typescript
// src/scheduler/alerts/conditions.ts
import type {
  AlertCondition,
  CheckResultWithId,
  DeclarativeCondition,
} from "./types";

/**
 * Check if a condition is a callback function
 */
function isCallback(
  condition: AlertCondition
): condition is (
  result: CheckResultWithId,
  history: CheckResultWithId[]
) => boolean {
  return typeof condition === "function";
}

/**
 * Count consecutive checks matching a predicate from the start
 */
function countConsecutive(
  history: CheckResultWithId[],
  predicate: (check: CheckResultWithId) => boolean
): number {
  let count = 0;
  for (const check of history) {
    if (predicate(check)) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

/**
 * Evaluate a declarative condition against check history
 */
function evaluateDeclarative(
  condition: DeclarativeCondition,
  history: CheckResultWithId[]
): boolean {
  if ("consecutiveFailures" in condition) {
    const failures = countConsecutive(history, (c) => c.status === "down");
    return failures >= condition.consecutiveFailures;
  }

  if ("consecutiveSuccesses" in condition) {
    const successes = countConsecutive(
      history,
      (c) => c.status === "up" || c.status === "degraded"
    );
    return successes >= condition.consecutiveSuccesses;
  }

  if ("latencyAboveMs" in condition) {
    const forChecks = condition.forChecks ?? 1;
    const recentChecks = history.slice(0, forChecks);
    if (recentChecks.length < forChecks) return false;
    return recentChecks.every((c) => c.responseTimeMs > condition.latencyAboveMs);
  }

  if ("status" in condition) {
    const forChecks = condition.forChecks ?? 1;
    const recentChecks = history.slice(0, forChecks);
    if (recentChecks.length < forChecks) return false;
    return recentChecks.every((c) => c.status === condition.status);
  }

  if ("downForMs" in condition) {
    const now = Date.now();
    const firstDown = history.find((c) => c.status !== "down");
    if (!firstDown) {
      // All history is down, check first entry
      const oldest = history[history.length - 1];
      if (!oldest) return false;
      return now - oldest.checkedAt.getTime() >= condition.downForMs;
    }
    const downStart = history[0];
    if (downStart.status !== "down") return false;
    return now - downStart.checkedAt.getTime() >= condition.downForMs;
  }

  if ("upForMs" in condition) {
    const now = Date.now();
    const firstNotUp = history.find((c) => c.status === "down");
    if (!firstNotUp) {
      const oldest = history[history.length - 1];
      if (!oldest) return false;
      return now - oldest.checkedAt.getTime() >= condition.upForMs;
    }
    const upStart = history[0];
    if (upStart.status === "down") return false;
    return now - upStart.checkedAt.getTime() >= condition.upForMs;
  }

  return false;
}

/**
 * Evaluate an alert condition against the current result and history
 */
export function evaluateCondition(
  condition: AlertCondition,
  result: CheckResultWithId,
  history: CheckResultWithId[]
): boolean {
  if (isCallback(condition)) {
    return condition(result, history);
  }
  return evaluateDeclarative(condition, history);
}
```

**Step 4: Run tests to verify they pass**

Run: `bun test src/scheduler/alerts/conditions.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/scheduler/alerts/conditions.ts src/scheduler/alerts/conditions.test.ts
git commit -m "feat(alerts): add condition evaluators with tests"
```

---

## Task 4: Webhook Dispatcher

**Files:**
- Create: `src/scheduler/alerts/dispatcher.ts`
- Create: `src/scheduler/alerts/dispatcher.test.ts`

**Step 1: Write failing test for dispatcher**

```typescript
// src/scheduler/alerts/dispatcher.test.ts
import { describe, test, expect, mock, beforeEach } from "bun:test";
import { dispatchWebhook, type ChannelConfig } from "./dispatcher";
import type { WebhookPayload } from "./types";

describe("dispatchWebhook", () => {
  beforeEach(() => {
    // Reset fetch mock
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(null, { status: 200 }))
    );
  });

  test("sends POST request with JSON payload", async () => {
    const channel: ChannelConfig = {
      type: "webhook",
      url: "https://example.com/webhook",
    };

    const payload: WebhookPayload = {
      event: "alert.fired",
      alert: {
        id: "test-alert",
        name: "Test Alert",
        monitorId: "test-monitor",
        monitorName: "Test Monitor",
      },
      timestamp: new Date().toISOString(),
      snapshot: {
        consecutiveFailures: 3,
        consecutiveSuccesses: 0,
        lastStatus: "down",
        lastResponseTimeMs: null,
        lastMessage: "Connection refused",
      },
      checkResult: {
        id: "check-123",
        status: "down",
        responseTimeMs: 0,
        message: "Connection refused",
        checkedAt: new Date().toISOString(),
      },
    };

    await dispatchWebhook(channel, payload);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (globalThis.fetch as ReturnType<typeof mock>).mock
      .calls[0];
    expect(url).toBe("https://example.com/webhook");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  test("includes custom headers", async () => {
    const channel: ChannelConfig = {
      type: "webhook",
      url: "https://example.com/webhook",
      headers: { "X-Source": "pongo", Authorization: "Bearer token" },
    };

    const payload: WebhookPayload = {
      event: "alert.fired",
      alert: { id: "a", name: "A", monitorId: "m", monitorName: "M" },
      timestamp: new Date().toISOString(),
      snapshot: {
        consecutiveFailures: 1,
        consecutiveSuccesses: 0,
        lastStatus: "down",
        lastResponseTimeMs: null,
        lastMessage: null,
      },
      checkResult: {
        id: "c",
        status: "down",
        responseTimeMs: 0,
        message: null,
        checkedAt: new Date().toISOString(),
      },
    };

    await dispatchWebhook(channel, payload);

    const [, options] = (globalThis.fetch as ReturnType<typeof mock>).mock
      .calls[0];
    expect(options.headers["X-Source"]).toBe("pongo");
    expect(options.headers["Authorization"]).toBe("Bearer token");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test src/scheduler/alerts/dispatcher.test.ts`
Expected: FAIL - module not found

**Step 3: Implement dispatcher**

```typescript
// src/scheduler/alerts/dispatcher.ts
import type { WebhookPayload } from "./types";

/**
 * Channel configuration
 */
export interface ChannelConfig {
  type: "webhook";
  url: string;
  headers?: Record<string, string>;
}

/**
 * Channels configuration map
 */
export type ChannelsConfig = Record<string, ChannelConfig>;

/**
 * Send a webhook payload to a channel
 */
export async function dispatchWebhook(
  channel: ChannelConfig,
  payload: WebhookPayload
): Promise<void> {
  try {
    const response = await fetch(channel.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...channel.headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `[alerts] Webhook failed: ${channel.url} returned ${response.status}`
      );
    }
  } catch (error) {
    console.error(
      `[alerts] Webhook error: ${channel.url}`,
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Dispatch payload to multiple channels
 */
export async function dispatchToChannels(
  channelIds: string[],
  channels: ChannelsConfig,
  payload: WebhookPayload
): Promise<void> {
  const dispatches = channelIds.map(async (channelId) => {
    const channel = channels[channelId];
    if (!channel) {
      console.warn(`[alerts] Unknown channel: ${channelId}`);
      return;
    }
    await dispatchWebhook(channel, payload);
  });

  await Promise.all(dispatches);
}
```

**Step 4: Run tests to verify they pass**

Run: `bun test src/scheduler/alerts/dispatcher.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/scheduler/alerts/dispatcher.ts src/scheduler/alerts/dispatcher.test.ts
git commit -m "feat(alerts): add webhook dispatcher with tests"
```

---

## Task 5: Alert Evaluator (Core Logic)

**Files:**
- Create: `src/scheduler/alerts/evaluator.ts`

**Step 1: Implement the alert evaluator**

```typescript
// src/scheduler/alerts/evaluator.ts
import { eq, desc } from "drizzle-orm";
import { getDbAsync, getDbDriver } from "@/db";
import {
  alertState as sqliteAlertState,
  alertEvents as sqliteAlertEvents,
  checkResults as sqliteCheckResults,
} from "@/db/schema.sqlite";
import {
  alertState as pgAlertState,
  alertEvents as pgAlertEvents,
  checkResults as pgCheckResults,
} from "@/db/schema.pg";
import { evaluateCondition } from "./conditions";
import { dispatchToChannels, type ChannelsConfig } from "./dispatcher";
import type {
  AlertConfig,
  AlertSnapshot,
  CheckResultWithId,
  WebhookPayload,
} from "./types";

const HISTORY_LIMIT = 20;

/**
 * Build snapshot of current state for alert event
 */
function buildSnapshot(
  history: CheckResultWithId[],
  consecutiveFailures: number,
  consecutiveSuccesses: number
): AlertSnapshot {
  const latest = history[0];
  return {
    consecutiveFailures,
    consecutiveSuccesses,
    lastStatus: latest?.status ?? "pending",
    lastResponseTimeMs: latest?.responseTimeMs ?? null,
    lastMessage: latest?.message ?? null,
  };
}

/**
 * Count consecutive checks matching a status from the start
 */
function countConsecutive(
  history: CheckResultWithId[],
  status: "up" | "down" | "degraded"
): number {
  let count = 0;
  for (const check of history) {
    if (check.status === status) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

/**
 * Evaluate all alerts for a monitor after a check completes
 */
export async function evaluateAlerts(
  monitorId: string,
  monitorName: string,
  alerts: AlertConfig[],
  channels: ChannelsConfig,
  latestCheckId: string
): Promise<void> {
  if (alerts.length === 0) return;

  const db = await getDbAsync();
  const driver = getDbDriver();

  // Select correct schema based on driver
  const alertStateTable = driver === "pg" ? pgAlertState : sqliteAlertState;
  const alertEventsTable = driver === "pg" ? pgAlertEvents : sqliteAlertEvents;
  const checkResultsTable = driver === "pg" ? pgCheckResults : sqliteCheckResults;

  // Fetch recent check history
  // biome-ignore lint/suspicious/noExplicitAny: dual-schema type union
  const history = (await (db as any)
    .select()
    .from(checkResultsTable)
    .where(eq(checkResultsTable.monitorId, monitorId))
    .orderBy(desc(checkResultsTable.checkedAt))
    .limit(HISTORY_LIMIT)) as CheckResultWithId[];

  if (history.length === 0) return;

  const latestCheck = history[0];
  const consecutiveFailures = countConsecutive(history, "down");
  const consecutiveSuccesses =
    latestCheck.status === "down"
      ? 0
      : countConsecutive(
          history,
          latestCheck.status as "up" | "degraded"
        );

  for (const alert of alerts) {
    // Get current alert state
    // biome-ignore lint/suspicious/noExplicitAny: dual-schema type union
    const [currentState] = (await (db as any)
      .select()
      .from(alertStateTable)
      .where(eq(alertStateTable.alertId, alert.id))) as Array<{
      alertId: string;
      status: "ok" | "firing";
      currentEventId: string | null;
    }>;

    const isCurrentlyFiring = currentState?.status === "firing";
    const conditionMet = evaluateCondition(alert.condition, latestCheck, history);

    if (conditionMet && !isCurrentlyFiring) {
      // Alert should fire
      const snapshot = buildSnapshot(
        history,
        consecutiveFailures,
        consecutiveSuccesses
      );

      // Create alert event
      const eventId = crypto.randomUUID();
      // biome-ignore lint/suspicious/noExplicitAny: dual-schema type union
      await (db as any).insert(alertEventsTable).values({
        id: eventId,
        alertId: alert.id,
        monitorId,
        eventType: "fired",
        triggeredAt: new Date(),
        snapshot,
        triggerCheckId: latestCheckId,
      });

      // Update or create alert state
      if (currentState) {
        // biome-ignore lint/suspicious/noExplicitAny: dual-schema type union
        await (db as any)
          .update(alertStateTable)
          .set({
            status: "firing",
            lastFiredAt: new Date(),
            currentEventId: eventId,
            updatedAt: new Date(),
          })
          .where(eq(alertStateTable.alertId, alert.id));
      } else {
        // biome-ignore lint/suspicious/noExplicitAny: dual-schema type union
        await (db as any).insert(alertStateTable).values({
          alertId: alert.id,
          monitorId,
          status: "firing",
          lastFiredAt: new Date(),
          currentEventId: eventId,
        });
      }

      // Dispatch webhook
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
      };

      await dispatchToChannels(alert.channels, channels, payload);

      console.log(`[alerts] FIRED: ${alert.name} (${alert.id})`);
    } else if (!conditionMet && isCurrentlyFiring) {
      // Alert should resolve
      const snapshot = buildSnapshot(
        history,
        consecutiveFailures,
        consecutiveSuccesses
      );

      // Update the existing event with resolution
      if (currentState?.currentEventId) {
        // biome-ignore lint/suspicious/noExplicitAny: dual-schema type union
        await (db as any)
          .update(alertEventsTable)
          .set({
            resolvedAt: new Date(),
            resolveCheckId: latestCheckId,
          })
          .where(eq(alertEventsTable.id, currentState.currentEventId));
      }

      // Update alert state
      // biome-ignore lint/suspicious/noExplicitAny: dual-schema type union
      await (db as any)
        .update(alertStateTable)
        .set({
          status: "ok",
          lastResolvedAt: new Date(),
          currentEventId: null,
          updatedAt: new Date(),
        })
        .where(eq(alertStateTable.alertId, alert.id));

      // Dispatch resolution webhook
      const payload: WebhookPayload = {
        event: "alert.resolved",
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
      };

      await dispatchToChannels(alert.channels, channels, payload);

      console.log(`[alerts] RESOLVED: ${alert.name} (${alert.id})`);
    }
  }
}
```

**Step 2: Verify file compiles**

Run: `bunx tsc --noEmit src/scheduler/alerts/evaluator.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/scheduler/alerts/evaluator.ts
git commit -m "feat(alerts): add core alert evaluator"
```

---

## Task 6: Update MonitorConfig Types

**Files:**
- Modify: `src/lib/config-types.ts`

**Step 1: Add alert and channel types to config-types**

Add imports and types at the top:

```typescript
import type { AlertConfig } from "@/scheduler/alerts/types";
```

Update `MonitorConfig` interface to include alerts:

```typescript
export interface MonitorConfig {
  name: string;
  interval?: string;
  cron?: string;
  timeout?: string;
  active?: boolean;
  alerts?: AlertConfig[];
  handler: () => Promise<MonitorResult>;
}
```

Add `channels` helper function at the bottom:

```typescript
/**
 * Channel configuration for webhooks
 */
export interface ChannelConfig {
  type: "webhook";
  url: string;
  headers?: Record<string, string>;
}

export type ChannelsConfig = Record<string, ChannelConfig>;

/**
 * Define webhook channels with type inference
 */
export function channels(config: ChannelsConfig): ChannelsConfig {
  return config;
}
```

**Step 2: Verify file compiles**

Run: `bunx tsc --noEmit src/lib/config-types.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/config-types.ts
git commit -m "feat(alerts): add alert config to MonitorConfig type"
```

---

## Task 7: Create Channels Loader

**Files:**
- Modify: `src/lib/loader.ts`
- Create: `pongo/channels.ts`

**Step 1: Create default channels file**

```typescript
// pongo/channels.ts
import { channels } from "../src/lib/config-types";

export default channels({
  // Add your webhook channels here, e.g.:
  // "ops-team": {
  //   type: "webhook",
  //   url: process.env.OPS_WEBHOOK_URL!,
  // },
});
```

**Step 2: Add channels loading to loader.ts**

Add import near top of file:

```typescript
import type { ChannelsConfig } from "./config-types";
```

Add loader function:

```typescript
/**
 * Load channel configurations from pongo/channels.ts
 */
export async function loadChannels(): Promise<ChannelsConfig> {
  try {
    const channelsModule = await import("@/pongo/channels");
    return channelsModule.default ?? {};
  } catch {
    return {};
  }
}
```

**Step 3: Update tsconfig to add channels path**

Add to `tsconfig.json` paths:

```json
"@/pongo/channels": ["./pongo/channels.ts"]
```

**Step 4: Verify it compiles**

Run: `bunx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add pongo/channels.ts src/lib/loader.ts tsconfig.json
git commit -m "feat(alerts): add channels config loader"
```

---

## Task 8: Integrate Alerts into Scheduler

**Files:**
- Modify: `src/scheduler/logger.ts`
- Modify: `src/scheduler/scheduler.ts`

**Step 1: Update logger to return check ID**

Modify `logToDatabase` in `src/scheduler/logger.ts` to return the created check ID:

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
    checkedAt: result.executedAt,
  });

  return id;
}
```

Update `logResult` to return the ID:

```typescript
export async function logResult(result: ExecutionResult): Promise<string> {
  logToConsole(result);
  return await logToDatabase(result);
}
```

**Step 2: Update scheduler to evaluate alerts after each check**

Add imports at top of `src/scheduler/scheduler.ts`:

```typescript
import { evaluateAlerts } from "./alerts/evaluator";
import { loadChannels } from "@/lib/loader";
import type { ChannelsConfig } from "@/lib/config-types";
```

Add channels property to Scheduler class:

```typescript
private channels: ChannelsConfig = {};
```

Add `loadChannels` call in `loadMonitors`:

```typescript
async loadMonitors(): Promise<void> {
  // Load channels first
  this.channels = await loadChannels();
  console.log(`[scheduler] Loaded ${Object.keys(this.channels).length} channels`);

  for (const [id, rawConfig] of Object.entries(monitorConfigs)) {
    // ... existing code
  }
}
```

Update `executeMonitor` to call alert evaluation:

```typescript
async executeMonitor(monitorId: string): Promise<void> {
  const monitor = this.monitors.get(monitorId);
  if (!monitor) {
    console.error(`[scheduler] Unknown monitor: ${monitorId}`);
    return;
  }

  const state = this.states.get(monitorId)!;
  if (state.isRunning) {
    console.log(`[scheduler] Skipping ${monitorId} - already running`);
    return;
  }

  state.isRunning = true;

  try {
    const result = await this.limit(() => runMonitor(monitor, this.config));
    state.lastRun = result.executedAt;
    state.lastResult = result.result;

    if (result.result.status === "down") {
      state.consecutiveFailures++;
    } else {
      state.consecutiveFailures = 0;
    }

    const checkId = await logResult(result);

    // Evaluate alerts after logging
    if (monitor.config.alerts && monitor.config.alerts.length > 0) {
      await evaluateAlerts(
        monitorId,
        monitor.config.name,
        monitor.config.alerts,
        this.channels,
        checkId
      );
    }
  } catch (error) {
    console.error(`[scheduler] Error executing ${monitorId}:`, error);
  } finally {
    state.isRunning = false;
  }
}
```

**Step 3: Verify it compiles**

Run: `bunx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/scheduler/logger.ts src/scheduler/scheduler.ts
git commit -m "feat(alerts): integrate alert evaluation into scheduler"
```

---

## Task 9: Create Alert Index Export

**Files:**
- Create: `src/scheduler/alerts/index.ts`

**Step 1: Create the index file**

```typescript
// src/scheduler/alerts/index.ts
export { evaluateCondition } from "./conditions";
export { evaluateAlerts } from "./evaluator";
export { dispatchWebhook, dispatchToChannels } from "./dispatcher";
export type {
  AlertConfig,
  AlertCondition,
  AlertSnapshot,
  AlertStatus,
  AlertEventType,
  CheckResultWithId,
  DeclarativeCondition,
  ConditionCallback,
  WebhookPayload,
} from "./types";
export type { ChannelConfig, ChannelsConfig } from "./dispatcher";
```

**Step 2: Commit**

```bash
git add src/scheduler/alerts/index.ts
git commit -m "feat(alerts): add module index export"
```

---

## Task 10: Add Example Alert to GitHub Monitor

**Files:**
- Modify: `pongo/monitors/github.ts`

**Step 1: Add alerts to the github monitor**

```typescript
import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "GitHub Status",
  interval: "30m",
  timeout: "30s",

  alerts: [
    {
      id: "github-down",
      name: "GitHub is down",
      condition: { consecutiveFailures: 3 },
      channels: [],
    },
    {
      id: "github-slow",
      name: "GitHub is slow",
      condition: { latencyAboveMs: 2000, forChecks: 2 },
      channels: [],
    },
  ],

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch("https://github.com/status");
      const responseTime = Date.now() - start;

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `HTTP ${res.status}`,
        };
      }

      const body = await res.text();
      const confirmationString = "GitHub lives!";
      const hasConfirmation = body.includes(confirmationString);

      if (!hasConfirmation) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `Missing confirmation: "${confirmationString}"`,
        };
      }

      return {
        status: responseTime > 1000 ? "degraded" : "up",
        responseTime,
        statusCode: res.status,
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

**Step 2: Commit**

```bash
git add pongo/monitors/github.ts
git commit -m "feat(alerts): add example alerts to github monitor"
```

---

## Task 11: Push Database Schema and Test

**Step 1: Push schema to database**

Run: `bun run db:sqlite:push`
Expected: Tables created successfully

**Step 2: Start scheduler and verify alerts load**

Run: `bun run scheduler`
Expected:
- See "Loaded X channels"
- See monitors loading with alerts
- No errors

**Step 3: Commit any migration files**

```bash
git add drizzle/
git commit -m "chore: add database migrations for alerts"
```

---

## Summary

After completing all tasks:

1. **New files created:**
   - `src/scheduler/alerts/types.ts`
   - `src/scheduler/alerts/conditions.ts`
   - `src/scheduler/alerts/conditions.test.ts`
   - `src/scheduler/alerts/dispatcher.ts`
   - `src/scheduler/alerts/dispatcher.test.ts`
   - `src/scheduler/alerts/evaluator.ts`
   - `src/scheduler/alerts/index.ts`
   - `pongo/channels.ts`

2. **Files modified:**
   - `src/db/schema.sqlite.ts`
   - `src/db/schema.pg.ts`
   - `src/lib/config-types.ts`
   - `src/lib/loader.ts`
   - `src/scheduler/logger.ts`
   - `src/scheduler/scheduler.ts`
   - `pongo/monitors/github.ts`
   - `tsconfig.json`

3. **Database tables added:**
   - `pongo_alert_state`
   - `pongo_alert_events`
