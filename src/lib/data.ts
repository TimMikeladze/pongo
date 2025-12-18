// src/lib/data.ts

import { and, desc, eq, gte, lte } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import {
  alertEvents,
  alertState,
  checkResults,
  dbHelpers,
  getDb,
  runQuery,
} from "@/db";
import {
  loadAnnouncements,
  loadDashboards,
  loadIncidents,
  loadMonitors,
} from "./loader";
import type { IntervalOption } from "./time-range";
import { formatBucketLabel, getIntervalMs } from "./time-range";
import type {
  Announcement,
  CheckResult,
  Dashboard,
  FeedItem,
  Incident,
  MaintenanceWindow,
  Monitor,
  MonitorStatus,
} from "./types";

export interface TimeRange {
  from: Date;
  to: Date;
}

// Cache key helper for time-range based queries
function timeRangeKey(timeRange: TimeRange): string {
  return `${timeRange.from.getTime()}-${timeRange.to.getTime()}`;
}

// Cache key helper for multi-monitor queries
function monitorIdsKey(monitorIds: string[]): string {
  return [...monitorIds].sort().join(",");
}

export interface AlertEventWithMonitor {
  id: string;
  alertId: string;
  monitorId: string;
  monitorName: string;
  alertName: string;
  eventType: "fired" | "resolved";
  triggeredAt: Date;
  resolvedAt: Date | null;
  snapshot: Record<string, unknown> | null;
  duration: number | null; // milliseconds, null if still firing
}

export interface FiringAlert {
  alertId: string;
  monitorId: string;
  monitorName: string;
  alertName: string;
  lastFiredAt: Date;
  currentEventId: string | null;
}

// Cache data loading per request
export const getMonitors = cache(async (): Promise<Monitor[]> => {
  return loadMonitors();
});

export const getMonitor = cache(
  async (id: string): Promise<Monitor | undefined> => {
    const monitors = await getMonitors();
    return monitors.find((m) => m.id === id);
  },
);

export const getDashboards = cache(async (): Promise<Dashboard[]> => {
  return loadDashboards();
});

export const getDashboard = cache(
  async (id: string): Promise<Dashboard | undefined> => {
    const dashboards = await getDashboards();
    return dashboards.find((d) => d.id === id);
  },
);

export const getDashboardBySlug = cache(
  async (slug: string): Promise<Dashboard | undefined> => {
    const dashboards = await getDashboards();
    return dashboards.find((d) => d.slug === slug);
  },
);

export const getAnnouncements = cache(
  async (dashboardId?: string): Promise<Announcement[]> => {
    const all = await loadAnnouncements();
    const now = Date.now();

    return all
      .filter((a) => !dashboardId || a.dashboardId === dashboardId)
      .filter((a) => !a.expiresAt || new Date(a.expiresAt).getTime() > now)
      .filter((a) => !a.archived);
  },
);

export const getIncidents = cache(
  async (dashboardId?: string): Promise<Incident[]> => {
    const all = await loadIncidents();
    return all
      .filter((i) => !dashboardId || i.dashboardId === dashboardId)
      .filter((i) => !i.archived);
  },
);

export const getActiveIncidents = cache(
  async (dashboardId?: string): Promise<Incident[]> => {
    const incidents = await getIncidents(dashboardId);
    return incidents.filter((i) => i.status !== "resolved");
  },
);

// Get check results from database
export const getCheckResults = cache(
  async (
    monitorId: string,
    options?: { limit?: number; timeRange?: TimeRange },
  ): Promise<CheckResult[]> => {
    const db = await getDb();

    const conditions = [eq(checkResults.monitorId, monitorId)];

    if (options?.timeRange) {
      conditions.push(gte(checkResults.checkedAt, options.timeRange.from));
      conditions.push(lte(checkResults.checkedAt, options.timeRange.to));
    }

    // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
    let query = (db as any)
      .select()
      .from(checkResults)
      .where(and(...conditions))
      .orderBy(desc(checkResults.checkedAt));

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const dbResults = await query;

    // Map database results to CheckResult type
    // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
    return dbResults.map((r: any) => ({
      id: r.id,
      monitorId: r.monitorId,
      status: r.status as MonitorStatus,
      responseTimeMs: r.responseTimeMs,
      statusCode: r.statusCode,
      errorMessage: r.message,
      checkedAt:
        r.checkedAt instanceof Date
          ? r.checkedAt.toISOString()
          : new Date(r.checkedAt).toISOString(),
    }));
  },
);

export const getLatestCheckResult = cache(
  async (monitorId: string): Promise<CheckResult | null> => {
    const db = await getDb();

    // Get active regions
    const regions = await getActiveRegions();

    if (regions.length <= 1) {
      // Single region - return as-is
      const results = await getCheckResults(monitorId, { limit: 1 });
      return results[0] || null;
    }

    // Multiple regions - get latest from each and aggregate
    const latestPerRegion: Array<{
      id: string;
      monitorId: string;
      status: MonitorStatus;
      responseTimeMs: number;
      statusCode: number | null;
      message: string | null;
      checkedAt: Date;
    }> = [];

    for (const region of regions) {
      // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
      const [result] = await (db as any)
        .select()
        .from(checkResults)
        .where(
          and(
            eq(checkResults.monitorId, monitorId),
            eq(checkResults.region, region),
          ),
        )
        .orderBy(desc(checkResults.checkedAt))
        .limit(1);
      if (result) latestPerRegion.push(result);
    }

    if (latestPerRegion.length === 0) return null;

    // Return most recent with aggregated status
    const mostRecent = latestPerRegion.sort(
      (a, b) =>
        new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime(),
    )[0];

    return {
      id: mostRecent.id,
      monitorId: mostRecent.monitorId,
      status: aggregateStatus(
        latestPerRegion.map((r) => r.status as MonitorStatus),
      ),
      responseTimeMs: mostRecent.responseTimeMs,
      statusCode: mostRecent.statusCode,
      errorMessage: mostRecent.message,
      checkedAt:
        mostRecent.checkedAt instanceof Date
          ? mostRecent.checkedAt.toISOString()
          : new Date(mostRecent.checkedAt).toISOString(),
    };
  },
);

// Stats helpers - wrapped with unstable_cache for cross-request caching
export const getUptimePercentage = cache(
  async (monitorId: string, timeRange: TimeRange): Promise<number> => {
    return unstable_cache(
      async () => {
        const results = await getCheckResults(monitorId, { timeRange });

        if (results.length === 0) return 100;
        const upCount = results.filter(
          (r) => r.status === "up" || r.status === "degraded",
        ).length;
        return Math.round((upCount / results.length) * 10000) / 100;
      },
      [`uptime-${monitorId}-${timeRangeKey(timeRange)}`],
      {
        tags: [`monitor-${monitorId}`, "check-results"],
        revalidate: 600,
      },
    )();
  },
);

export const getAverageResponseTime = cache(
  async (monitorId: string, timeRange: TimeRange): Promise<number> => {
    return unstable_cache(
      async () => {
        const results = await getCheckResults(monitorId, { timeRange });
        const filtered = results.filter((c) => c.status !== "down");

        if (filtered.length === 0) return 0;
        const sum = filtered.reduce((acc, r) => acc + r.responseTimeMs, 0);
        return Math.round(sum / filtered.length);
      },
      [`avg-response-${monitorId}-${timeRangeKey(timeRange)}`],
      {
        tags: [`monitor-${monitorId}`, "check-results"],
        revalidate: 600,
      },
    )();
  },
);

export async function getMonitorStats(monitorId: string, timeRange: TimeRange) {
  const [uptime, avgResponseTime] = await Promise.all([
    getUptimePercentage(monitorId, timeRange),
    getAverageResponseTime(monitorId, timeRange),
  ]);
  return { uptime, avgResponseTime };
}

export const getErrorRate = cache(
  async (monitorId: string, timeRange: TimeRange): Promise<number> => {
    return unstable_cache(
      async () => {
        const results = await getCheckResults(monitorId, { timeRange });

        if (results.length === 0) return 0;
        const errorCount = results.filter((r) => r.status === "down").length;
        return Math.round((errorCount / results.length) * 10000) / 100;
      },
      [`error-rate-${monitorId}-${timeRangeKey(timeRange)}`],
      {
        tags: [`monitor-${monitorId}`, "check-results"],
        revalidate: 600,
      },
    )();
  },
);

export const getP95ResponseTime = cache(
  async (monitorId: string, timeRange: TimeRange): Promise<number> => {
    return unstable_cache(
      async () => {
        const results = await getCheckResults(monitorId, { timeRange });
        const responseTimes = results
          .filter((c) => c.status !== "down")
          .map((r) => r.responseTimeMs)
          .sort((a, b) => a - b);

        if (responseTimes.length === 0) return 0;
        const index = Math.floor(responseTimes.length * 0.95);
        return responseTimes[index] || responseTimes[responseTimes.length - 1];
      },
      [`p95-${monitorId}-${timeRangeKey(timeRange)}`],
      {
        tags: [`monitor-${monitorId}`, "check-results"],
        revalidate: 600,
      },
    )();
  },
);

export const getP99ResponseTime = cache(
  async (monitorId: string, timeRange: TimeRange): Promise<number> => {
    return unstable_cache(
      async () => {
        const results = await getCheckResults(monitorId, { timeRange });
        const responseTimes = results
          .filter((c) => c.status !== "down")
          .map((r) => r.responseTimeMs)
          .sort((a, b) => a - b);

        if (responseTimes.length === 0) return 0;
        const index = Math.floor(responseTimes.length * 0.99);
        return responseTimes[index] || responseTimes[responseTimes.length - 1];
      },
      [`p99-${monitorId}-${timeRangeKey(timeRange)}`],
      {
        tags: [`monitor-${monitorId}`, "check-results"],
        revalidate: 600,
      },
    )();
  },
);

export const getTotalChecks = cache(
  async (monitorId: string, timeRange: TimeRange): Promise<number> => {
    return unstable_cache(
      async () => {
        const results = await getCheckResults(monitorId, { timeRange });
        return results.length;
      },
      [`total-checks-${monitorId}-${timeRangeKey(timeRange)}`],
      {
        tags: [`monitor-${monitorId}`, "check-results"],
        revalidate: 600,
      },
    )();
  },
);

export interface StatusBucket {
  label: string;
  status: MonitorStatus | "pending";
  uptime: number;
  checks: number;
  timestamp: number;
}

export const getStatusBuckets = cache(
  async (
    monitorId: string,
    timeRange: TimeRange,
    interval: IntervalOption,
  ): Promise<StatusBucket[]> => {
    return unstable_cache(
      async () => {
        const results = await getCheckResults(monitorId, { timeRange });
        const intervalMs = getIntervalMs(interval);
        const fromMs = timeRange.from.getTime();
        const toMs = timeRange.to.getTime();

        // Calculate number of buckets based on time range and interval
        const bucketCount = Math.ceil((toMs - fromMs) / intervalMs);

        // Create buckets spanning the full time range
        const buckets: Map<number, CheckResult[]> = new Map();
        const bucketTimestamps: number[] = [];

        for (let i = 0; i < bucketCount; i++) {
          const bucketStart = fromMs + i * intervalMs;
          buckets.set(bucketStart, []);
          bucketTimestamps.push(bucketStart);
        }

        // Assign results to buckets based on which bucket they fall into
        for (const r of results) {
          const checkTime = new Date(r.checkedAt).getTime();
          const bucketIndex = Math.min(
            Math.floor((checkTime - fromMs) / intervalMs),
            bucketCount - 1,
          );
          if (bucketIndex >= 0) {
            const bucketStart = bucketTimestamps[bucketIndex];
            const bucket = buckets.get(bucketStart);
            if (bucket) {
              bucket.push(r);
            }
          }
        }

        // Calculate status for each bucket
        return bucketTimestamps.map((timestamp) => {
          const bucketChecks = buckets.get(timestamp) || [];

          if (bucketChecks.length === 0) {
            return {
              label: formatBucketLabel(timestamp, interval),
              status: "pending" as const,
              uptime: 100,
              checks: 0,
              timestamp,
            };
          }

          const upCount = bucketChecks.filter((c) => c.status === "up").length;
          const degradedCount = bucketChecks.filter(
            (c) => c.status === "degraded",
          ).length;
          const downCount = bucketChecks.filter(
            (c) => c.status === "down",
          ).length;
          const uptime =
            Math.round(
              ((upCount + degradedCount) / bucketChecks.length) * 10000,
            ) / 100;

          let status: MonitorStatus = "up";
          if (downCount > 0) status = "down";
          else if (degradedCount > 0) status = "degraded";

          return {
            label: formatBucketLabel(timestamp, interval),
            status,
            uptime,
            checks: bucketChecks.length,
            timestamp,
          };
        });
      },
      [`status-buckets-${monitorId}-${timeRangeKey(timeRange)}-${interval}`],
      {
        tags: [`monitor-${monitorId}`, "check-results"],
        revalidate: 600,
      },
    )();
  },
);

export const getSLAStatus = cache(
  async (dashboardId: string, timeRange: TimeRange) => {
    return unstable_cache(
      async () => {
        const dashboard = await getDashboard(dashboardId);
        if (!dashboard) return null;

        const monitors = await getMonitors();
        const dashboardMonitors = monitors.filter((m) =>
          dashboard.monitorIds.includes(m.id),
        );
        if (dashboardMonitors.length === 0) return null;

        const uptimes = await Promise.all(
          dashboardMonitors.map((m) => getUptimePercentage(m.id, timeRange)),
        );
        const totalUptime = uptimes.reduce((a, b) => a + b, 0) / uptimes.length;
        const target = dashboard.slaTarget || 99.9;

        return {
          target,
          actual: Math.round(totalUptime * 100) / 100,
          met: totalUptime >= target,
          remaining: Math.max(0, target - totalUptime),
        };
      },
      [`sla-status-${dashboardId}-${timeRangeKey(timeRange)}`],
      {
        tags: [`dashboard-${dashboardId}`, "check-results"],
        revalidate: 600,
      },
    )();
  },
);

// Maintenance windows - empty for now (to be added with orchestration)
export async function getMaintenanceWindows(
  _dashboardId?: string,
): Promise<MaintenanceWindow[]> {
  return [];
}

export async function getUpcomingMaintenance(
  _dashboardId?: string,
): Promise<MaintenanceWindow[]> {
  return [];
}

export const getFiringAlerts = cache(async (): Promise<FiringAlert[]> => {
  const db = await getDb();

  // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
  const rows = await (db as any)
    .select()
    .from(alertState)
    .where(eq(alertState.status, "firing"));

  const monitors = await getMonitors();
  const monitorMap = new Map(monitors.map((m) => [m.id, m.name]));

  // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
  return rows.map((row: any) => ({
    alertId: row.alertId,
    monitorId: row.monitorId,
    monitorName: monitorMap.get(row.monitorId) || row.monitorId,
    alertName: row.alertId, // Will be enhanced when we have alert names in state
    lastFiredAt:
      row.lastFiredAt instanceof Date
        ? row.lastFiredAt
        : new Date(row.lastFiredAt),
    currentEventId: row.currentEventId,
  }));
});

export const getAlertEvents = cache(
  async (timeRange: TimeRange): Promise<AlertEventWithMonitor[]> => {
    const db = await getDb();

    // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
    const rows = await (db as any)
      .select()
      .from(alertEvents)
      .where(
        and(
          gte(alertEvents.triggeredAt, timeRange.from),
          lte(alertEvents.triggeredAt, timeRange.to),
        ),
      )
      .orderBy(desc(alertEvents.triggeredAt));

    const monitors = await getMonitors();
    const monitorMap = new Map(monitors.map((m) => [m.id, m.name]));

    // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
    return rows.map((row: any) => {
      const triggeredAt =
        row.triggeredAt instanceof Date
          ? row.triggeredAt
          : new Date(row.triggeredAt);
      const resolvedAt = row.resolvedAt
        ? row.resolvedAt instanceof Date
          ? row.resolvedAt
          : new Date(row.resolvedAt)
        : null;

      return {
        id: row.id,
        alertId: row.alertId,
        monitorId: row.monitorId,
        monitorName: monitorMap.get(row.monitorId) || row.monitorId,
        alertName: row.alertId,
        eventType: row.eventType,
        triggeredAt,
        resolvedAt,
        snapshot: row.snapshot,
        duration: resolvedAt
          ? resolvedAt.getTime() - triggeredAt.getTime()
          : null,
      };
    });
  },
);

// ============================================
// Server-side aggregation for charts (SQL-based)
// ============================================

export interface ResponseTimeDataPoint {
  time: string;
  responseTime: number;
}

export interface ErrorRateDataPoint {
  time: string;
  errorRate: number;
  errors: number;
}

export interface UptimeDataPoint {
  time: string;
  uptime: number;
}

export interface LatencyPercentilesDataPoint {
  time: string;
  p50: number;
  p95: number;
  p99: number;
}

export interface ThroughputDataPoint {
  time: string;
  checks: number;
}

export interface StatusTimelineDataPoint {
  time: string;
  timestamp: number;
  status: MonitorStatus;
  up: number;
  down: number;
  degraded: number;
  total: number;
  avgResponseTime: number;
}

export interface StatusDistributionData {
  up: number;
  degraded: number;
  down: number;
}

// Helper to run raw SQL aggregation queries
async function runAggregationQuery<T>(queryStr: string): Promise<T[]> {
  return runQuery<T>(queryStr);
}

export async function getResponseTimeChartData(
  monitorId: string,
  timeRange: TimeRange,
  interval: IntervalOption,
): Promise<ResponseTimeDataPoint[]> {
  const intervalMs = getIntervalMs(interval);
  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();
  const ts = dbHelpers.timestampToMs("checked_at");

  const query = `
    SELECT
      (${ts} / ${intervalMs}) * ${intervalMs} as bucket,
      ${dbHelpers.round("AVG(response_time_ms)")} as avg_response_time,
      COUNT(*) as cnt
    FROM pongo_check_results
    WHERE monitor_id = '${monitorId}'
      AND ${ts} >= ${fromMs}
      AND ${ts} <= ${toMs}
      AND status != 'down'
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  const rows = await runAggregationQuery<{
    bucket: number;
    avg_response_time: number;
    cnt: number;
  }>(query);

  return rows.map((row) => ({
    time: formatBucketLabel(row.bucket, interval),
    responseTime: Math.round(row.avg_response_time),
  }));
}

export async function getErrorRateChartData(
  monitorId: string,
  timeRange: TimeRange,
  interval: IntervalOption,
): Promise<ErrorRateDataPoint[]> {
  const intervalMs = getIntervalMs(interval);
  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();
  const ts = dbHelpers.timestampToMs("checked_at");

  const query = `
    SELECT
      (${ts} / ${intervalMs}) * ${intervalMs} as bucket,
      SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as errors,
      COUNT(*) as total
    FROM pongo_check_results
    WHERE monitor_id = '${monitorId}'
      AND ${ts} >= ${fromMs}
      AND ${ts} <= ${toMs}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  const rows = await runAggregationQuery<{
    bucket: number;
    errors: number;
    total: number;
  }>(query);

  return rows.map((row) => ({
    time: formatBucketLabel(row.bucket, interval),
    errorRate: row.total > 0 ? Math.round((row.errors / row.total) * 100) : 0,
    errors: Number(row.errors),
  }));
}

export async function getUptimeChartData(
  monitorId: string,
  timeRange: TimeRange,
  interval: IntervalOption,
): Promise<UptimeDataPoint[]> {
  const intervalMs = getIntervalMs(interval);
  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();
  const ts = dbHelpers.timestampToMs("checked_at");

  const query = `
    SELECT
      (${ts} / ${intervalMs}) * ${intervalMs} as bucket,
      SUM(CASE WHEN status IN ('up', 'degraded') THEN 1 ELSE 0 END) as up_count,
      COUNT(*) as total
    FROM pongo_check_results
    WHERE monitor_id = '${monitorId}'
      AND ${ts} >= ${fromMs}
      AND ${ts} <= ${toMs}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  const rows = await runAggregationQuery<{
    bucket: number;
    up_count: number;
    total: number;
  }>(query);

  return rows.map((row) => ({
    time: formatBucketLabel(row.bucket, interval),
    uptime: Math.round((Number(row.up_count) / Number(row.total)) * 100),
  }));
}

export async function getLatencyPercentilesChartData(
  monitorId: string,
  timeRange: TimeRange,
  interval: IntervalOption,
): Promise<LatencyPercentilesDataPoint[]> {
  // Neither SQLite nor PostgreSQL have built-in percentile functions that work
  // universally, so we fetch bucketed data and compute percentiles in JS
  const intervalMs = getIntervalMs(interval);
  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();
  const ts = dbHelpers.timestampToMs("checked_at");

  const query = `
    SELECT
      (${ts} / ${intervalMs}) * ${intervalMs} as bucket,
      response_time_ms
    FROM pongo_check_results
    WHERE monitor_id = '${monitorId}'
      AND ${ts} >= ${fromMs}
      AND ${ts} <= ${toMs}
      AND status != 'down'
    ORDER BY bucket ASC, response_time_ms ASC
  `;

  const rows = await runAggregationQuery<{
    bucket: number;
    response_time_ms: number;
  }>(query);

  // Group by bucket and compute percentiles
  const buckets: Map<number, number[]> = new Map();
  for (const row of rows) {
    const existing = buckets.get(row.bucket);
    if (existing) {
      existing.push(row.response_time_ms);
    } else {
      buckets.set(row.bucket, [row.response_time_ms]);
    }
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([bucket, times]) => {
      const sorted = times.sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
      const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
      const p99 =
        sorted[Math.floor(sorted.length * 0.99)] ||
        sorted[sorted.length - 1] ||
        0;
      return {
        time: formatBucketLabel(bucket, interval),
        p50,
        p95,
        p99,
      };
    });
}

export async function getThroughputChartData(
  monitorId: string,
  timeRange: TimeRange,
  interval: IntervalOption,
): Promise<ThroughputDataPoint[]> {
  const intervalMs = getIntervalMs(interval);
  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();
  const ts = dbHelpers.timestampToMs("checked_at");

  const query = `
    SELECT
      (${ts} / ${intervalMs}) * ${intervalMs} as bucket,
      COUNT(*) as checks
    FROM pongo_check_results
    WHERE monitor_id = '${monitorId}'
      AND ${ts} >= ${fromMs}
      AND ${ts} <= ${toMs}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  const rows = await runAggregationQuery<{
    bucket: number;
    checks: number;
  }>(query);

  return rows.map((row) => ({
    time: formatBucketLabel(row.bucket, interval),
    checks: Number(row.checks),
  }));
}

export async function getStatusTimelineData(
  monitorId: string,
  timeRange: TimeRange,
  interval: IntervalOption,
  limit = 30,
): Promise<StatusTimelineDataPoint[]> {
  const intervalMs = getIntervalMs(interval);
  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();
  const ts = dbHelpers.timestampToMs("checked_at");

  const query = `
    SELECT
      (${ts} / ${intervalMs}) * ${intervalMs} as bucket,
      SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up_count,
      SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as down_count,
      SUM(CASE WHEN status = 'degraded' THEN 1 ELSE 0 END) as degraded_count,
      COUNT(*) as total,
      ${dbHelpers.round("AVG(response_time_ms)")} as avg_response_time
    FROM pongo_check_results
    WHERE monitor_id = '${monitorId}'
      AND ${ts} >= ${fromMs}
      AND ${ts} <= ${toMs}
    GROUP BY bucket
    ORDER BY bucket DESC
    LIMIT ${limit}
  `;

  const rows = await runAggregationQuery<{
    bucket: number;
    up_count: number;
    down_count: number;
    degraded_count: number;
    total: number;
    avg_response_time: number;
  }>(query);

  // Reverse to get chronological order (we fetched DESC for LIMIT)
  return rows.reverse().map((row) => {
    let status: MonitorStatus = "up";
    if (Number(row.down_count) > 0) status = "down";
    else if (Number(row.degraded_count) > 0) status = "degraded";
    else if (Number(row.up_count) === 0) status = "pending";

    return {
      time: formatBucketLabel(row.bucket, interval),
      timestamp: row.bucket,
      status,
      up: Number(row.up_count),
      down: Number(row.down_count),
      degraded: Number(row.degraded_count),
      total: Number(row.total),
      avgResponseTime: Math.round(row.avg_response_time),
    };
  });
}

export async function getStatusDistributionData(
  monitorId: string,
  timeRange: TimeRange,
): Promise<StatusDistributionData> {
  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();
  const ts = dbHelpers.timestampToMs("checked_at");

  const query = `
    SELECT
      SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up_count,
      SUM(CASE WHEN status = 'degraded' THEN 1 ELSE 0 END) as degraded_count,
      SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as down_count
    FROM pongo_check_results
    WHERE monitor_id = '${monitorId}'
      AND ${ts} >= ${fromMs}
      AND ${ts} <= ${toMs}
  `;

  const rows = await runAggregationQuery<{
    up_count: number;
    degraded_count: number;
    down_count: number;
  }>(query);

  const row = rows[0] || { up_count: 0, degraded_count: 0, down_count: 0 };
  return {
    up: Number(row.up_count) || 0,
    degraded: Number(row.degraded_count) || 0,
    down: Number(row.down_count) || 0,
  };
}

// Aggregated data for multiple monitors (for overview page)
// Wrapped with unstable_cache for cross-request caching
export const getAggregatedResponseTimeChartData = cache(
  async (
    monitorIds: string[],
    timeRange: TimeRange,
    interval: IntervalOption,
  ): Promise<ResponseTimeDataPoint[]> => {
    if (monitorIds.length === 0) return [];

    return unstable_cache(
      async () => {
        const intervalMs = getIntervalMs(interval);
        const fromMs = timeRange.from.getTime();
        const toMs = timeRange.to.getTime();
        const idList = monitorIds.map((id) => `'${id}'`).join(",");
        const ts = dbHelpers.timestampToMs("checked_at");

        const query = `
          SELECT
            (${ts} / ${intervalMs}) * ${intervalMs} as bucket,
            ${dbHelpers.round("AVG(response_time_ms)")} as avg_response_time
          FROM pongo_check_results
          WHERE monitor_id IN (${idList})
            AND ${ts} >= ${fromMs}
            AND ${ts} <= ${toMs}
            AND status != 'down'
          GROUP BY bucket
          ORDER BY bucket ASC
        `;

        const rows = await runAggregationQuery<{
          bucket: number;
          avg_response_time: number;
        }>(query);

        return rows.map((row) => ({
          time: formatBucketLabel(row.bucket, interval),
          responseTime: Math.round(row.avg_response_time),
        }));
      },
      [
        `agg-response-time-${monitorIdsKey(monitorIds)}-${timeRangeKey(timeRange)}-${interval}`,
      ],
      {
        tags: ["check-results"],
        revalidate: 600,
      },
    )();
  },
);

export const getAggregatedErrorRateChartData = cache(
  async (
    monitorIds: string[],
    timeRange: TimeRange,
    interval: IntervalOption,
  ): Promise<ErrorRateDataPoint[]> => {
    if (monitorIds.length === 0) return [];

    return unstable_cache(
      async () => {
        const intervalMs = getIntervalMs(interval);
        const fromMs = timeRange.from.getTime();
        const toMs = timeRange.to.getTime();
        const idList = monitorIds.map((id) => `'${id}'`).join(",");
        const ts = dbHelpers.timestampToMs("checked_at");

        const query = `
          SELECT
            (${ts} / ${intervalMs}) * ${intervalMs} as bucket,
            SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as errors,
            COUNT(*) as total
          FROM pongo_check_results
          WHERE monitor_id IN (${idList})
            AND ${ts} >= ${fromMs}
            AND ${ts} <= ${toMs}
          GROUP BY bucket
          ORDER BY bucket ASC
        `;

        const rows = await runAggregationQuery<{
          bucket: number;
          errors: number;
          total: number;
        }>(query);

        return rows.map((row) => ({
          time: formatBucketLabel(row.bucket, interval),
          errorRate:
            Number(row.total) > 0
              ? Math.round((Number(row.errors) / Number(row.total)) * 100)
              : 0,
          errors: Number(row.errors),
        }));
      },
      [
        `agg-error-rate-${monitorIdsKey(monitorIds)}-${timeRangeKey(timeRange)}-${interval}`,
      ],
      {
        tags: ["check-results"],
        revalidate: 600,
      },
    )();
  },
);

export const getAggregatedUptimeChartData = cache(
  async (
    monitorIds: string[],
    timeRange: TimeRange,
    interval: IntervalOption,
  ): Promise<UptimeDataPoint[]> => {
    if (monitorIds.length === 0) return [];

    return unstable_cache(
      async () => {
        const intervalMs = getIntervalMs(interval);
        const fromMs = timeRange.from.getTime();
        const toMs = timeRange.to.getTime();
        const idList = monitorIds.map((id) => `'${id}'`).join(",");
        const ts = dbHelpers.timestampToMs("checked_at");

        const query = `
          SELECT
            (${ts} / ${intervalMs}) * ${intervalMs} as bucket,
            SUM(CASE WHEN status IN ('up', 'degraded') THEN 1 ELSE 0 END) as up_count,
            COUNT(*) as total
          FROM pongo_check_results
          WHERE monitor_id IN (${idList})
            AND ${ts} >= ${fromMs}
            AND ${ts} <= ${toMs}
          GROUP BY bucket
          ORDER BY bucket ASC
        `;

        const rows = await runAggregationQuery<{
          bucket: number;
          up_count: number;
          total: number;
        }>(query);

        return rows.map((row) => ({
          time: formatBucketLabel(row.bucket, interval),
          uptime: Math.round((Number(row.up_count) / Number(row.total)) * 100),
        }));
      },
      [
        `agg-uptime-${monitorIdsKey(monitorIds)}-${timeRangeKey(timeRange)}-${interval}`,
      ],
      {
        tags: ["check-results"],
        revalidate: 600,
      },
    )();
  },
);

export const getAggregatedLatencyPercentilesChartData = cache(
  async (
    monitorIds: string[],
    timeRange: TimeRange,
    interval: IntervalOption,
  ): Promise<LatencyPercentilesDataPoint[]> => {
    if (monitorIds.length === 0) return [];

    return unstable_cache(
      async () => {
        const intervalMs = getIntervalMs(interval);
        const fromMs = timeRange.from.getTime();
        const toMs = timeRange.to.getTime();
        const idList = monitorIds.map((id) => `'${id}'`).join(",");
        const ts = dbHelpers.timestampToMs("checked_at");

        const query = `
          SELECT
            (${ts} / ${intervalMs}) * ${intervalMs} as bucket,
            response_time_ms
          FROM pongo_check_results
          WHERE monitor_id IN (${idList})
            AND ${ts} >= ${fromMs}
            AND ${ts} <= ${toMs}
            AND status != 'down'
          ORDER BY bucket ASC, response_time_ms ASC
        `;

        const rows = await runAggregationQuery<{
          bucket: number;
          response_time_ms: number;
        }>(query);

        const buckets: Map<number, number[]> = new Map();
        for (const row of rows) {
          const existing = buckets.get(row.bucket);
          if (existing) {
            existing.push(row.response_time_ms);
          } else {
            buckets.set(row.bucket, [row.response_time_ms]);
          }
        }

        return Array.from(buckets.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([bucket, times]) => {
            const sorted = times.sort((a, b) => a - b);
            const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
            const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
            const p99 =
              sorted[Math.floor(sorted.length * 0.99)] ||
              sorted[sorted.length - 1] ||
              0;
            return {
              time: formatBucketLabel(bucket, interval),
              p50,
              p95,
              p99,
            };
          });
      },
      [
        `agg-latency-percentiles-${monitorIdsKey(monitorIds)}-${timeRangeKey(timeRange)}-${interval}`,
      ],
      {
        tags: ["check-results"],
        revalidate: 600,
      },
    )();
  },
);

export const getAggregatedThroughputChartData = cache(
  async (
    monitorIds: string[],
    timeRange: TimeRange,
    interval: IntervalOption,
  ): Promise<ThroughputDataPoint[]> => {
    if (monitorIds.length === 0) return [];

    return unstable_cache(
      async () => {
        const intervalMs = getIntervalMs(interval);
        const fromMs = timeRange.from.getTime();
        const toMs = timeRange.to.getTime();
        const idList = monitorIds.map((id) => `'${id}'`).join(",");
        const ts = dbHelpers.timestampToMs("checked_at");

        const query = `
          SELECT
            (${ts} / ${intervalMs}) * ${intervalMs} as bucket,
            COUNT(*) as checks
          FROM pongo_check_results
          WHERE monitor_id IN (${idList})
            AND ${ts} >= ${fromMs}
            AND ${ts} <= ${toMs}
          GROUP BY bucket
          ORDER BY bucket ASC
        `;

        const rows = await runAggregationQuery<{
          bucket: number;
          checks: number;
        }>(query);

        return rows.map((row) => ({
          time: formatBucketLabel(row.bucket, interval),
          checks: Number(row.checks),
        }));
      },
      [
        `agg-throughput-${monitorIdsKey(monitorIds)}-${timeRangeKey(timeRange)}-${interval}`,
      ],
      {
        tags: ["check-results"],
        revalidate: 600,
      },
    )();
  },
);

export const getAggregatedStatusDistributionData = cache(
  async (
    monitorIds: string[],
    timeRange: TimeRange,
  ): Promise<StatusDistributionData> => {
    if (monitorIds.length === 0) return { up: 0, degraded: 0, down: 0 };

    return unstable_cache(
      async () => {
        const fromMs = timeRange.from.getTime();
        const toMs = timeRange.to.getTime();
        const idList = monitorIds.map((id) => `'${id}'`).join(",");
        const ts = dbHelpers.timestampToMs("checked_at");

        const query = `
          SELECT
            SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up_count,
            SUM(CASE WHEN status = 'degraded' THEN 1 ELSE 0 END) as degraded_count,
            SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as down_count
          FROM pongo_check_results
          WHERE monitor_id IN (${idList})
            AND ${ts} >= ${fromMs}
            AND ${ts} <= ${toMs}
        `;

        const rows = await runAggregationQuery<{
          up_count: number;
          degraded_count: number;
          down_count: number;
        }>(query);

        const row = rows[0] || {
          up_count: 0,
          degraded_count: 0,
          down_count: 0,
        };
        return {
          up: Number(row.up_count) || 0,
          degraded: Number(row.degraded_count) || 0,
          down: Number(row.down_count) || 0,
        };
      },
      [
        `agg-status-dist-${monitorIdsKey(monitorIds)}-${timeRangeKey(timeRange)}`,
      ],
      {
        tags: ["check-results"],
        revalidate: 600,
      },
    )();
  },
);

export async function getFeedItems(
  dashboardId: string,
  monitorIds: string[],
  baseUrl: string,
  slug: string,
  limit = 50,
): Promise<FeedItem[]> {
  const items: FeedItem[] = [];

  // Get alert events for dashboard monitors (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const alertEventsData = await getAlertEvents({
    from: thirtyDaysAgo,
    to: new Date(),
  });

  for (const event of alertEventsData) {
    if (!monitorIds.includes(event.monitorId)) continue;

    const eventType = event.eventType === "fired" ? "fired" : "resolved";
    items.push({
      id: `alert-${event.id}`,
      type: "alert",
      title: `${event.monitorName}: ${event.alertName} ${eventType}`,
      description: event.snapshot
        ? `Status: ${(event.snapshot as Record<string, unknown>).status || "unknown"}`
        : `Alert ${eventType}`,
      link: `${baseUrl}/dashboards/shared/${slug}#monitor-${event.monitorId}`,
      timestamp:
        event.eventType === "fired"
          ? event.triggeredAt
          : event.resolvedAt || event.triggeredAt,
    });
  }

  // Get incidents for dashboard
  const incidents = await getIncidents(dashboardId);
  for (const incident of incidents) {
    const latestUpdate = incident.updates[0];
    items.push({
      id: `incident-${incident.id}`,
      type: "incident",
      title: `[${incident.severity.toUpperCase()}] ${incident.title}`,
      description: latestUpdate?.message || incident.title,
      link: `${baseUrl}/dashboards/shared/${slug}#incident-${incident.id}`,
      timestamp: new Date(incident.resolvedAt || incident.createdAt),
    });
  }

  // Get announcements for dashboard
  const announcements = await getAnnouncements(dashboardId);
  for (const announcement of announcements) {
    items.push({
      id: `announcement-${announcement.id}`,
      type: "announcement",
      title: announcement.title,
      description: announcement.message,
      link: `${baseUrl}/dashboards/shared/${slug}#announcement-${announcement.id}`,
      timestamp: new Date(announcement.createdAt),
    });
  }

  // Sort by timestamp descending and limit
  return items
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

// ============================================
// Multi-region data functions
// ============================================

/**
 * Compute aggregate status from multiple regions
 * - all up = up
 * - all down = down
 * - mixed = degraded
 * - empty = pending
 */
export function aggregateStatus(statuses: MonitorStatus[]): MonitorStatus {
  if (statuses.length === 0) return "pending";
  const uniqueStatuses = [...new Set(statuses)];
  if (uniqueStatuses.length === 1) return uniqueStatuses[0];
  if (uniqueStatuses.every((s) => s === "down")) return "down";
  if (uniqueStatuses.every((s) => s === "up")) return "up";
  return "degraded";
}

/**
 * Get all regions that have reported results in the last hour
 */
export const getActiveRegions = cache(async (): Promise<string[]> => {
  const db = await getDb();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
  const results = await (db as any)
    .selectDistinct({ region: checkResults.region })
    .from(checkResults)
    .where(gte(checkResults.checkedAt, oneHourAgo));

  return results.map((r: { region: string }) => r.region);
});

/**
 * Get latest check result per region for a monitor
 */
export const getLatestCheckResultByRegion = cache(
  async (monitorId: string): Promise<Record<string, CheckResult | null>> => {
    const db = await getDb();
    const regions = await getActiveRegions();
    const result: Record<string, CheckResult | null> = {};

    for (const region of regions) {
      // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
      const [latest] = await (db as any)
        .select()
        .from(checkResults)
        .where(
          and(
            eq(checkResults.monitorId, monitorId),
            eq(checkResults.region, region),
          ),
        )
        .orderBy(desc(checkResults.checkedAt))
        .limit(1);

      if (latest) {
        result[region] = {
          id: latest.id,
          monitorId: latest.monitorId,
          status: latest.status as MonitorStatus,
          responseTimeMs: latest.responseTimeMs,
          statusCode: latest.statusCode,
          errorMessage: latest.message,
          checkedAt:
            latest.checkedAt instanceof Date
              ? latest.checkedAt.toISOString()
              : new Date(latest.checkedAt).toISOString(),
        };
      } else {
        result[region] = null;
      }
    }

    return result;
  },
);

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
    const db = await getDb();
    const regions = await getActiveRegions();
    const stats: RegionStats[] = [];

    for (const region of regions) {
      // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
      const results = await (db as any)
        .select()
        .from(checkResults)
        .where(
          and(
            eq(checkResults.monitorId, monitorId),
            eq(checkResults.region, region),
            gte(checkResults.checkedAt, timeRange.from),
            lte(checkResults.checkedAt, timeRange.to),
          ),
        )
        .orderBy(desc(checkResults.checkedAt));

      if (results.length === 0) continue;

      // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
      const upCount = results.filter((r: any) => r.status === "up").length;
      const uptime =
        results.length > 0 ? (upCount / results.length) * 100 : 100;
      const avgResponseTime =
        results.length > 0
          ? // biome-ignore lint/suspicious/noExplicitAny: Runtime db type
            results.reduce((sum: number, r: any) => sum + r.responseTimeMs, 0) /
            results.length
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
  },
);
