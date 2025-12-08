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
  condition: AlertCondition,
): condition is (
  result: CheckResultWithId,
  history: CheckResultWithId[],
) => boolean {
  return typeof condition === "function";
}

/**
 * Count consecutive checks matching a predicate from the start
 */
function countConsecutive(
  history: CheckResultWithId[],
  predicate: (check: CheckResultWithId) => boolean,
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
  history: CheckResultWithId[],
): boolean {
  if ("consecutiveFailures" in condition) {
    const failures = countConsecutive(history, (c) => c.status === "down");
    return failures >= condition.consecutiveFailures;
  }

  if ("consecutiveSuccesses" in condition) {
    const successes = countConsecutive(
      history,
      (c) => c.status === "up" || c.status === "degraded",
    );
    return successes >= condition.consecutiveSuccesses;
  }

  if ("latencyAboveMs" in condition) {
    const forChecks = condition.forChecks ?? 1;
    const recentChecks = history.slice(0, forChecks);
    if (recentChecks.length < forChecks) return false;
    return recentChecks.every(
      (c) => c.responseTimeMs > condition.latencyAboveMs,
    );
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
  history: CheckResultWithId[],
): boolean {
  if (isCallback(condition)) {
    return condition(result, history);
  }
  return evaluateDeclarative(condition, history);
}
