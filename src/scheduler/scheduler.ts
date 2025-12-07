// src/scheduler/scheduler.ts
import { Cron } from "croner";
import pLimit from "p-limit";
import monitorConfigs from "@pongo/monitors";
import { parseDuration, type MonitorConfig } from "@/lib/config-types";
import type { ScheduledMonitor, SchedulerConfig, MonitorState } from "./types";
import { runMonitor } from "./runner";
import { logResult } from "./logger";
import { evaluateAlerts } from "./alerts/evaluator";
import { loadChannels } from "@/lib/loader";
import type { ChannelsConfig } from "@/lib/config-types";

/**
 * Convert interval string to croner-compatible schedule
 * For intervals, we use croner's interval option with a per-second cron
 */
function intervalToSeconds(interval: string): number {
  return parseDuration(interval) / 1000;
}

export class Scheduler {
  private config: SchedulerConfig;
  private monitors: Map<string, ScheduledMonitor> = new Map();
  private jobs: Map<string, Cron> = new Map();
  private states: Map<string, MonitorState> = new Map();
  private limit: ReturnType<typeof pLimit>;
  private channels: ChannelsConfig = {};

  constructor(config: SchedulerConfig) {
    this.config = config;
    this.limit = pLimit(config.maxConcurrency);
  }

  /**
   * Load monitors from config
   */
  async loadMonitors(): Promise<void> {
    this.channels = await loadChannels();

    for (const [id, rawConfig] of Object.entries(monitorConfigs)) {
      const config = rawConfig as MonitorConfig;

      // active defaults to true, only skip if explicitly false
      if (config.active === false) {
        console.log(`[scheduler] Skipping inactive monitor: ${id}`);
        continue;
      }

      const timeoutMs = config.timeout ? parseDuration(config.timeout) : 30000;

      this.monitors.set(id, { id, config, timeoutMs });
      this.states.set(id, {
        lastRun: null,
        lastResult: null,
        isRunning: false,
        consecutiveFailures: 0,
      });

      console.log(
        `[scheduler] Loaded monitor: ${id} (${config.cron ?? config.interval})`,
      );
    }
  }

  /**
   * Execute a single monitor (called by cron job or trigger)
   */
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

  /**
   * Start all scheduled jobs
   */
  start(): void {
    console.log(
      `[scheduler] Starting scheduler with ${this.monitors.size} monitors...`,
    );
    console.log(`[scheduler] Max concurrency: ${this.config.maxConcurrency}`);
    console.log(`[scheduler] Max retries: ${this.config.maxRetries}`);

    for (const [id, monitor] of this.monitors) {
      const { config } = monitor;

      if (config.cron) {
        // Cron-based scheduling
        const job = new Cron(config.cron, { protect: true }, () => {
          this.executeMonitor(id);
        });
        this.jobs.set(id, job);
        console.log(`[scheduler] Scheduled ${id} with cron: ${config.cron}`);
      } else if (config.interval) {
        // Interval-based scheduling using croner's interval option
        const seconds = intervalToSeconds(config.interval);
        const job = new Cron(
          "* * * * * *",
          { interval: seconds, protect: true },
          () => {
            this.executeMonitor(id);
          },
        );
        this.jobs.set(id, job);
        console.log(
          `[scheduler] Scheduled ${id} with interval: ${config.interval} (${seconds}s)`,
        );
      } else {
        console.warn(
          `[scheduler] Monitor ${id} has no cron or interval, skipping`,
        );
      }
    }

    console.log("[scheduler] All monitors scheduled");
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    console.log("[scheduler] Stopping scheduler...");
    for (const [id, job] of this.jobs) {
      job.stop();
      console.log(`[scheduler] Stopped ${id}`);
    }
    this.jobs.clear();
    console.log("[scheduler] Scheduler stopped");
  }

  /**
   * Trigger a monitor ad-hoc
   */
  async trigger(monitorId: string): Promise<boolean> {
    if (!this.monitors.has(monitorId)) {
      return false;
    }
    await this.executeMonitor(monitorId);
    return true;
  }

  /**
   * Get list of monitor IDs
   */
  getMonitorIds(): string[] {
    return Array.from(this.monitors.keys());
  }

  /**
   * Get monitor state
   */
  getState(monitorId: string): MonitorState | undefined {
    return this.states.get(monitorId);
  }
}
