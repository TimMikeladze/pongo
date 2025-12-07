// src/scheduler/types.ts
import type { MonitorConfig, MonitorResult } from "@/lib/config-types";

/**
 * Scheduler configuration from environment
 */
export interface SchedulerConfig {
  /** Max concurrent monitor executions (default: 10) */
  maxConcurrency: number;
  /** Max retries on failure (default: 3) */
  maxRetries: number;
  /** Base delay between retries in ms (default: 5000) */
  retryBaseDelayMs: number;
  /** HTTP API port (default: 3001) */
  port: number;
}

/**
 * Internal monitor representation with resolved config
 */
export interface ScheduledMonitor {
  id: string;
  config: MonitorConfig;
  /** Resolved timeout in milliseconds */
  timeoutMs: number;
}

/**
 * Result of a single monitor execution (after all retries)
 */
export interface ExecutionResult {
  monitorId: string;
  result: MonitorResult;
  attempts: number;
  executedAt: Date;
}

/**
 * Scheduler state for a monitor
 */
export interface MonitorState {
  lastRun: Date | null;
  lastResult: MonitorResult | null;
  isRunning: boolean;
  consecutiveFailures: number;
}
