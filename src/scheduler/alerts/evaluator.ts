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
