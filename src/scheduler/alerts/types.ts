// src/scheduler/alerts/types.ts

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
