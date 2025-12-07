// src/scheduler/alerts/evaluator.ts
import { and, desc, eq, gt } from "drizzle-orm";
import {
  alertEvents,
  alertOverrides,
  alertState,
  checkResults,
  getDb,
  type PongoDb,
} from "@/db";
import { REGION } from "../region";
import { evaluateCondition } from "./conditions";
import { type ChannelsConfig, dispatchToChannels } from "./dispatcher";
import { trackStateTransition } from "./flap-detection";
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
async function getActiveRegions(
  db: PongoDb,
  monitorId: string,
): Promise<string[]> {
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
  db: PongoDb,
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
 * Check if an alert is silenced or disabled via overrides
 */
async function getOverride(
  db: PongoDb,
  alertId: string,
): Promise<{ silenced: boolean; disabled: boolean }> {
  const [override] = await db
    .select()
    .from(alertOverrides)
    .where(eq(alertOverrides.alertId, alertId));

  if (!override) return { silenced: false, disabled: false };

  const now = new Date();
  const silenced = override.silencedUntil
    ? new Date(override.silencedUntil) > now
    : false;

  return { silenced, disabled: Boolean(override.disabled) };
}

interface AlertStateRow {
  alertId: string;
  status: "ok" | "firing";
  currentEventId: string | null;
  lastNotifiedAt: Date | null;
  stateChanges: number;
  flapWindowStart: Date | null;
}

/**
 * Build and dispatch a webhook payload, returns true if dispatched
 */
async function tryDispatch(
  alert: AlertConfig,
  monitorId: string,
  monitorName: string,
  event: "alert.fired" | "alert.resolved",
  snapshot: AlertSnapshot,
  latestCheck: CheckResultWithId,
  channels: ChannelsConfig,
  db: PongoDb,
): Promise<boolean> {
  const threshold = alert.regionThreshold ?? "any";
  const activeRegions = await getActiveRegions(db, monitorId);
  const firingRegions = await getFiringRegions(db, monitorId, alert.id);
  const healthyRegions = activeRegions.filter(
    (r) => !firingRegions.includes(r),
  );

  const shouldFire =
    event === "alert.fired"
      ? shouldDispatchGlobal(
          threshold,
          firingRegions.length,
          activeRegions.length,
        )
      : !shouldDispatchGlobal(
          threshold,
          firingRegions.length,
          activeRegions.length,
        );

  if (!shouldFire) {
    console.log(
      `[alerts] ${alert.name} (${alert.id}) ${event === "alert.fired" ? "firing" : "resolved"} in ${REGION}, but threshold not met (${firingRegions.length}/${activeRegions.length})`,
    );
    return false;
  }

  const payload: WebhookPayload = {
    event,
    alert: {
      id: alert.id,
      name: alert.name,
      monitorId,
      monitorName,
      severity: alert.severity ?? "warning",
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
    `[alerts] ${event === "alert.fired" ? "FIRED" : "RESOLVED"}: ${alert.name} (${alert.id}) - ${firingRegions.length}/${activeRegions.length} regions`,
  );
  return true;
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
  const history = (await db
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
    // Check overrides first
    const override = await getOverride(db, alert.id);
    if (override.disabled) {
      continue;
    }

    // Get current alert state
    const [currentState] = (await db
      .select()
      .from(alertState)
      .where(
        and(eq(alertState.alertId, alert.id), eq(alertState.region, REGION)),
      )) as AlertStateRow[];

    const isCurrentlyFiring = currentState?.status === "firing";
    const conditionMet = evaluateCondition(
      alert.condition,
      latestCheck,
      history,
    );

    if (conditionMet && !isCurrentlyFiring) {
      // === ALERT FIRES ===
      const snapshot = buildSnapshot(
        history,
        consecutiveFailures,
        consecutiveSuccesses,
      );

      // Track flap state
      const flapResult = trackStateTransition({
        stateChanges: currentState?.stateChanges ?? 0,
        flapWindowStart: currentState?.flapWindowStart ?? null,
      });

      // Create alert event (always, even when flapping)
      const eventId = crypto.randomUUID();
      await db.insert(alertEvents).values({
        id: eventId,
        alertId: alert.id,
        monitorId,
        region: REGION,
        eventType: "fired",
        triggeredAt: new Date(),
        snapshot: snapshot as unknown as Record<string, unknown>,
        triggerCheckId: latestCheckId,
      });

      const now = new Date();

      // Update or create alert state
      if (currentState) {
        await db
          .update(alertState)
          .set({
            status: "firing",
            lastFiredAt: now,
            currentEventId: eventId,
            stateChanges: flapResult.stateChanges,
            flapWindowStart: flapResult.flapWindowStart,
            updatedAt: now,
          })
          .where(
            and(
              eq(alertState.alertId, alert.id),
              eq(alertState.region, REGION),
            ),
          );
      } else {
        await db.insert(alertState).values({
          alertId: alert.id,
          monitorId,
          region: REGION,
          status: "firing",
          lastFiredAt: now,
          currentEventId: eventId,
          stateChanges: flapResult.stateChanges,
          flapWindowStart: flapResult.flapWindowStart,
        });
      }

      // Dispatch if not flapping and not silenced
      if (flapResult.isFlapping) {
        console.log(
          `[alerts] ${alert.name} (${alert.id}) is flapping (${flapResult.stateChanges} transitions), suppressing notification`,
        );
      } else if (override.silenced) {
        console.log(
          `[alerts] ${alert.name} (${alert.id}) is silenced, suppressing notification`,
        );
      } else {
        const dispatched = await tryDispatch(
          alert,
          monitorId,
          monitorName,
          "alert.fired",
          snapshot,
          latestCheck,
          channels,
          db,
        );
        if (dispatched) {
          await db
            .update(alertState)
            .set({ lastNotifiedAt: now })
            .where(
              and(
                eq(alertState.alertId, alert.id),
                eq(alertState.region, REGION),
              ),
            );
        }
      }
    } else if (!conditionMet && isCurrentlyFiring) {
      // === ALERT RESOLVES ===
      const snapshot = buildSnapshot(
        history,
        consecutiveFailures,
        consecutiveSuccesses,
      );

      // Track flap state
      const flapResult = trackStateTransition({
        stateChanges: currentState?.stateChanges ?? 0,
        flapWindowStart: currentState?.flapWindowStart ?? null,
      });

      // Update the existing event with resolution
      if (currentState?.currentEventId) {
        await db
          .update(alertEvents)
          .set({
            resolvedAt: new Date(),
            resolveCheckId: latestCheckId,
          })
          .where(eq(alertEvents.id, currentState.currentEventId));
      }

      // Update alert state
      const now = new Date();
      await db
        .update(alertState)
        .set({
          status: "ok",
          lastResolvedAt: now,
          currentEventId: null,
          lastNotifiedAt: null,
          stateChanges: flapResult.stateChanges,
          flapWindowStart: flapResult.flapWindowStart,
          updatedAt: now,
        })
        .where(
          and(eq(alertState.alertId, alert.id), eq(alertState.region, REGION)),
        );

      // Dispatch resolution if not flapping and not silenced
      if (flapResult.isFlapping) {
        console.log(
          `[alerts] ${alert.name} (${alert.id}) is flapping, suppressing resolution notification`,
        );
      } else if (override.silenced) {
        console.log(
          `[alerts] ${alert.name} (${alert.id}) is silenced, suppressing resolution notification`,
        );
      } else {
        await tryDispatch(
          alert,
          monitorId,
          monitorName,
          "alert.resolved",
          snapshot,
          latestCheck,
          channels,
          db,
        );
      }
    } else if (conditionMet && isCurrentlyFiring) {
      // === STILL FIRING — check re-notify ===
      if (
        alert.escalateAfterMs &&
        currentState?.lastNotifiedAt &&
        !override.silenced
      ) {
        const lastNotified =
          currentState.lastNotifiedAt instanceof Date
            ? currentState.lastNotifiedAt.getTime()
            : new Date(currentState.lastNotifiedAt).getTime();

        if (Date.now() - lastNotified >= alert.escalateAfterMs) {
          const snapshot = buildSnapshot(
            history,
            consecutiveFailures,
            consecutiveSuccesses,
          );

          // Check flap state before re-notifying
          const flapResult = trackStateTransition({
            stateChanges: currentState.stateChanges ?? 0,
            flapWindowStart: currentState.flapWindowStart ?? null,
          });

          if (!flapResult.isFlapping) {
            const dispatched = await tryDispatch(
              alert,
              monitorId,
              monitorName,
              "alert.fired",
              snapshot,
              latestCheck,
              channels,
              db,
            );
            if (dispatched) {
              await db
                .update(alertState)
                .set({ lastNotifiedAt: new Date() })
                .where(
                  and(
                    eq(alertState.alertId, alert.id),
                    eq(alertState.region, REGION),
                  ),
                );
              console.log(
                `[alerts] RE-NOTIFY: ${alert.name} (${alert.id}) still firing after ${alert.escalateAfterMs}ms`,
              );
            }
          }
        }
      }
    }
  }
}
