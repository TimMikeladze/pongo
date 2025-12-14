// src/scheduler/alerts/evaluator.ts
import { and, desc, eq, gt } from "drizzle-orm";
import { alertEvents, alertState, checkResults, getDb } from "@/db";
import { REGION } from "../region";
import { evaluateCondition } from "./conditions";
import { type ChannelsConfig, dispatchToChannels } from "./dispatcher";
import type {
  AlertConfig,
  AlertSnapshot,
  CheckResultWithId,
  RegionThreshold,
  WebhookPayload,
} from "./types";

const HISTORY_LIMIT = 20;

/**
 * Get regions that have reported check results in the last hour
 */
// biome-ignore lint/suspicious/noExplicitAny: Runtime db type
async function getActiveRegions(db: any, monitorId: string): Promise<string[]> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const results = await db
    .selectDistinct({ region: checkResults.region })
    .from(checkResults)
    .where(
      and(
        eq(checkResults.monitorId, monitorId),
        gt(checkResults.checkedAt, oneHourAgo),
      ),
    );

  return results.map((r: { region: string }) => r.region);
}

/**
 * Get regions where an alert is currently firing
 */
async function getFiringRegions(
  // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
  db: any,
  monitorId: string,
  alertId: string,
): Promise<string[]> {
  const results = await db
    .select({ region: alertState.region })
    .from(alertState)
    .where(
      and(
        eq(alertState.monitorId, monitorId),
        eq(alertState.alertId, alertId),
        eq(alertState.status, "firing"),
      ),
    );

  return results.map((r: { region: string }) => r.region);
}

/**
 * Check if global alert should dispatch based on regionThreshold
 */
function shouldDispatchGlobal(
  threshold: RegionThreshold,
  firingCount: number,
  totalCount: number,
): boolean {
  if (threshold === "any") return firingCount >= 1;
  if (threshold === "all") return firingCount === totalCount && totalCount > 0;
  if (threshold === "majority") return firingCount > totalCount / 2;
  if (typeof threshold === "number") return firingCount >= threshold;
  return firingCount >= 1; // default to 'any'
}

/**
 * Build snapshot of current state for alert event
 */
function buildSnapshot(
  history: CheckResultWithId[],
  consecutiveFailures: number,
  consecutiveSuccesses: number,
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
  status: "up" | "down" | "degraded",
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
  latestCheckId: string,
): Promise<void> {
  if (alerts.length === 0) return;

  const db = await getDb();

  // Fetch recent check history
  // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
  const history = (await (db as any)
    .select()
    .from(checkResults)
    .where(
      and(
        eq(checkResults.monitorId, monitorId),
        eq(checkResults.region, REGION),
      ),
    )
    .orderBy(desc(checkResults.checkedAt))
    .limit(HISTORY_LIMIT)) as CheckResultWithId[];

  if (history.length === 0) return;

  const latestCheck = history[0];
  const consecutiveFailures = countConsecutive(history, "down");
  const consecutiveSuccesses =
    latestCheck.status === "down"
      ? 0
      : countConsecutive(history, latestCheck.status as "up" | "degraded");

  for (const alert of alerts) {
    // Get current alert state
    // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
    const [currentState] = (await (db as any)
      .select()
      .from(alertState)
      .where(
        and(eq(alertState.alertId, alert.id), eq(alertState.region, REGION)),
      )) as Array<{
      alertId: string;
      status: "ok" | "firing";
      currentEventId: string | null;
    }>;

    const isCurrentlyFiring = currentState?.status === "firing";
    const conditionMet = evaluateCondition(
      alert.condition,
      latestCheck,
      history,
    );

    if (conditionMet && !isCurrentlyFiring) {
      // Alert should fire
      const snapshot = buildSnapshot(
        history,
        consecutiveFailures,
        consecutiveSuccesses,
      );

      // Create alert event
      const eventId = crypto.randomUUID();
      // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
      await (db as any).insert(alertEvents).values({
        id: eventId,
        alertId: alert.id,
        monitorId,
        region: REGION,
        eventType: "fired",
        triggeredAt: new Date(),
        snapshot,
        triggerCheckId: latestCheckId,
      });

      // Update or create alert state
      if (currentState) {
        // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
        await (db as any)
          .update(alertState)
          .set({
            status: "firing",
            lastFiredAt: new Date(),
            currentEventId: eventId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(alertState.alertId, alert.id),
              eq(alertState.region, REGION),
            ),
          );
      } else {
        // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
        await (db as any).insert(alertState).values({
          alertId: alert.id,
          monitorId,
          region: REGION,
          status: "firing",
          lastFiredAt: new Date(),
          currentEventId: eventId,
        });
      }

      // Check if we should dispatch globally
      const threshold = alert.regionThreshold ?? "any";
      const activeRegions = await getActiveRegions(db, monitorId);
      const firingRegions = await getFiringRegions(db, monitorId, alert.id);
      const healthyRegions = activeRegions.filter(
        (r) => !firingRegions.includes(r),
      );

      if (
        shouldDispatchGlobal(
          threshold,
          firingRegions.length,
          activeRegions.length,
        )
      ) {
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
        console.log(
          `[alerts] FIRED: ${alert.name} (${alert.id}) - ${firingRegions.length}/${activeRegions.length} regions`,
        );
      } else {
        console.log(
          `[alerts] ${alert.name} (${alert.id}) firing in ${REGION}, but threshold not met (${firingRegions.length}/${activeRegions.length})`,
        );
      }
    } else if (!conditionMet && isCurrentlyFiring) {
      // Alert should resolve
      const snapshot = buildSnapshot(
        history,
        consecutiveFailures,
        consecutiveSuccesses,
      );

      // Update the existing event with resolution
      if (currentState?.currentEventId) {
        // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
        await (db as any)
          .update(alertEvents)
          .set({
            resolvedAt: new Date(),
            resolveCheckId: latestCheckId,
          })
          .where(eq(alertEvents.id, currentState.currentEventId));
      }

      // Update alert state
      // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
      await (db as any)
        .update(alertState)
        .set({
          status: "ok",
          lastResolvedAt: new Date(),
          currentEventId: null,
          updatedAt: new Date(),
        })
        .where(
          and(eq(alertState.alertId, alert.id), eq(alertState.region, REGION)),
        );

      // Check if we should dispatch resolution globally
      const threshold = alert.regionThreshold ?? "any";
      const activeRegions = await getActiveRegions(db, monitorId);
      const firingRegions = await getFiringRegions(db, monitorId, alert.id);
      const healthyRegions = activeRegions.filter(
        (r) => !firingRegions.includes(r),
      );

      // Dispatch if alert is no longer firing in enough regions
      if (
        !shouldDispatchGlobal(
          threshold,
          firingRegions.length,
          activeRegions.length,
        )
      ) {
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
          region: REGION,
          firingRegions,
          healthyRegions,
        };

        await dispatchToChannels(alert.channels, channels, payload);
        console.log(
          `[alerts] RESOLVED: ${alert.name} (${alert.id}) - ${firingRegions.length}/${activeRegions.length} regions`,
        );
      } else {
        console.log(
          `[alerts] ${alert.name} (${alert.id}) resolved in ${REGION}, but still firing in other regions (${firingRegions.length}/${activeRegions.length})`,
        );
      }
    }
  }
}
