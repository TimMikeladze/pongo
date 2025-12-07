// src/lib/data.ts

import { desc, eq, and, gte, lte } from "drizzle-orm";
import { cache } from "react";
import { getDbAsync, getDbDriver, sqliteSchema, pgSchema } from "@/db";
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
  Incident,
  MaintenanceWindow,
  Monitor,
  MonitorStatus,
} from "./types";

export interface TimeRange {
  from: Date;
  to: Date;
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
    const db = await getDbAsync();
    const driver = getDbDriver();
    const checkResults =
      driver === "pg" ? pgSchema.checkResults : sqliteSchema.checkResults;

    const conditions = [eq(checkResults.monitorId, monitorId)];

    if (options?.timeRange) {
      conditions.push(gte(checkResults.checkedAt, options.timeRange.from));
      conditions.push(lte(checkResults.checkedAt, options.timeRange.to));
    }

    // biome-ignore lint/suspicious/noExplicitAny: dual-schema type union issue
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
    // biome-ignore lint/suspicious/noExplicitAny: dual-schema type union issue
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
    const results = await getCheckResults(monitorId, { limit: 1 });
    return results[0] || null;
  },
);

// Stats helpers
export async function getUptimePercentage(
  monitorId: string,
  timeRange: TimeRange,
): Promise<number> {
  const results = await getCheckResults(monitorId, { timeRange });

  if (results.length === 0) return 100;
  const upCount = results.filter(
    (r) => r.status === "up" || r.status === "degraded",
  ).length;
  return Math.round((upCount / results.length) * 10000) / 100;
}

export async function getAverageResponseTime(
  monitorId: string,
  timeRange: TimeRange,
): Promise<number> {
  const results = await getCheckResults(monitorId, { timeRange });
  const filtered = results.filter((c) => c.status !== "down");

  if (filtered.length === 0) return 0;
  const sum = filtered.reduce((acc, r) => acc + r.responseTimeMs, 0);
  return Math.round(sum / filtered.length);
}

export async function getMonitorStats(monitorId: string, timeRange: TimeRange) {
  const [uptime, avgResponseTime] = await Promise.all([
    getUptimePercentage(monitorId, timeRange),
    getAverageResponseTime(monitorId, timeRange),
  ]);
  return { uptime, avgResponseTime };
}

export async function getErrorRate(
  monitorId: string,
  timeRange: TimeRange,
): Promise<number> {
  const results = await getCheckResults(monitorId, { timeRange });

  if (results.length === 0) return 0;
  const errorCount = results.filter((r) => r.status === "down").length;
  return Math.round((errorCount / results.length) * 10000) / 100;
}

export async function getP95ResponseTime(
  monitorId: string,
  timeRange: TimeRange,
): Promise<number> {
  const results = await getCheckResults(monitorId, { timeRange });
  const responseTimes = results
    .filter((c) => c.status !== "down")
    .map((r) => r.responseTimeMs)
    .sort((a, b) => a - b);

  if (responseTimes.length === 0) return 0;
  const index = Math.floor(responseTimes.length * 0.95);
  return responseTimes[index] || responseTimes[responseTimes.length - 1];
}

export async function getP99ResponseTime(
  monitorId: string,
  timeRange: TimeRange,
): Promise<number> {
  const results = await getCheckResults(monitorId, { timeRange });
  const responseTimes = results
    .filter((c) => c.status !== "down")
    .map((r) => r.responseTimeMs)
    .sort((a, b) => a - b);

  if (responseTimes.length === 0) return 0;
  const index = Math.floor(responseTimes.length * 0.99);
  return responseTimes[index] || responseTimes[responseTimes.length - 1];
}

export async function getTotalChecks(
  monitorId: string,
  timeRange: TimeRange,
): Promise<number> {
  const results = await getCheckResults(monitorId, { timeRange });
  return results.length;
}

export interface StatusBucket {
  label: string;
  status: MonitorStatus | "pending";
  uptime: number;
  checks: number;
  timestamp: number;
}

export async function getStatusBuckets(
  monitorId: string,
  timeRange: TimeRange,
  interval: IntervalOption,
): Promise<StatusBucket[]> {
  const results = await getCheckResults(monitorId, { timeRange });
  const intervalMs = getIntervalMs(interval);
  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();

  // Create buckets
  const buckets: Map<number, CheckResult[]> = new Map();
  const bucketTimestamps: number[] = [];

  for (let t = fromMs; t <= toMs; t += intervalMs) {
    const bucketStart = Math.floor(t / intervalMs) * intervalMs;
    if (!buckets.has(bucketStart)) {
      buckets.set(bucketStart, []);
      bucketTimestamps.push(bucketStart);
    }
  }

  // Assign results to buckets
  for (const r of results) {
    const checkTime = new Date(r.checkedAt).getTime();
    const bucketStart = Math.floor(checkTime / intervalMs) * intervalMs;
    const bucket = buckets.get(bucketStart);
    if (bucket) {
      bucket.push(r);
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
    const downCount = bucketChecks.filter((c) => c.status === "down").length;
    const uptime =
      Math.round(((upCount + degradedCount) / bucketChecks.length) * 10000) /
      100;

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
}

export async function getSLAStatus(dashboardId: string, timeRange: TimeRange) {
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
}

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

// ============================================
// Server-side aggregation for charts (SQL-based)
// ============================================

import { sql } from "drizzle-orm";

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
async function runAggregationQuery<T>(
  queryStr: string,
  // biome-ignore lint/suspicious/noExplicitAny: raw SQL result types
): Promise<T[]> {
  const db = await getDbAsync();
  const driver = getDbDriver();

  if (driver === "pg") {
    // biome-ignore lint/suspicious/noExplicitAny: dual-schema type
    const result = await (db as any).execute(sql.raw(queryStr));
    return result.rows as T[];
  }
  // SQLite via libsql
  // biome-ignore lint/suspicious/noExplicitAny: dual-schema type
  const result = await (db as any).run(sql.raw(queryStr));
  return result.rows as T[];
}

export async function getResponseTimeChartData(
  monitorId: string,
  timeRange: TimeRange,
  interval: IntervalOption,
): Promise<ResponseTimeDataPoint[]> {
  const intervalMs = getIntervalMs(interval);
  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();

  const query = `
    SELECT
      (checked_at / ${intervalMs}) * ${intervalMs} as bucket,
      ROUND(AVG(response_time_ms)) as avg_response_time,
      COUNT(*) as cnt
    FROM pongo_check_results
    WHERE monitor_id = '${monitorId}'
      AND checked_at >= ${fromMs}
      AND checked_at <= ${toMs}
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

  const query = `
    SELECT
      (checked_at / ${intervalMs}) * ${intervalMs} as bucket,
      SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as errors,
      COUNT(*) as total
    FROM pongo_check_results
    WHERE monitor_id = '${monitorId}'
      AND checked_at >= ${fromMs}
      AND checked_at <= ${toMs}
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
    errors: row.errors,
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

  const query = `
    SELECT
      (checked_at / ${intervalMs}) * ${intervalMs} as bucket,
      SUM(CASE WHEN status IN ('up', 'degraded') THEN 1 ELSE 0 END) as up_count,
      COUNT(*) as total
    FROM pongo_check_results
    WHERE monitor_id = '${monitorId}'
      AND checked_at >= ${fromMs}
      AND checked_at <= ${toMs}
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
    uptime: Math.round((row.up_count / row.total) * 100),
  }));
}

export async function getLatencyPercentilesChartData(
  monitorId: string,
  timeRange: TimeRange,
  interval: IntervalOption,
): Promise<LatencyPercentilesDataPoint[]> {
  // SQLite doesn't have built-in percentile functions, so we need to fetch
  // bucketed data and compute percentiles in JS
  const intervalMs = getIntervalMs(interval);
  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();

  const query = `
    SELECT
      (checked_at / ${intervalMs}) * ${intervalMs} as bucket,
      response_time_ms
    FROM pongo_check_results
    WHERE monitor_id = '${monitorId}'
      AND checked_at >= ${fromMs}
      AND checked_at <= ${toMs}
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

  const query = `
    SELECT
      (checked_at / ${intervalMs}) * ${intervalMs} as bucket,
      COUNT(*) as checks
    FROM pongo_check_results
    WHERE monitor_id = '${monitorId}'
      AND checked_at >= ${fromMs}
      AND checked_at <= ${toMs}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  const rows = await runAggregationQuery<{
    bucket: number;
    checks: number;
  }>(query);

  return rows.map((row) => ({
    time: formatBucketLabel(row.bucket, interval),
    checks: row.checks,
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

  const query = `
    SELECT
      (checked_at / ${intervalMs}) * ${intervalMs} as bucket,
      SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up_count,
      SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as down_count,
      SUM(CASE WHEN status = 'degraded' THEN 1 ELSE 0 END) as degraded_count,
      COUNT(*) as total,
      ROUND(AVG(response_time_ms)) as avg_response_time
    FROM pongo_check_results
    WHERE monitor_id = '${monitorId}'
      AND checked_at >= ${fromMs}
      AND checked_at <= ${toMs}
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
    if (row.down_count > 0) status = "down";
    else if (row.degraded_count > 0) status = "degraded";
    else if (row.up_count === 0) status = "pending";

    return {
      time: formatBucketLabel(row.bucket, interval),
      timestamp: row.bucket,
      status,
      up: row.up_count,
      down: row.down_count,
      degraded: row.degraded_count,
      total: row.total,
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

  const query = `
    SELECT
      SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up_count,
      SUM(CASE WHEN status = 'degraded' THEN 1 ELSE 0 END) as degraded_count,
      SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as down_count
    FROM pongo_check_results
    WHERE monitor_id = '${monitorId}'
      AND checked_at >= ${fromMs}
      AND checked_at <= ${toMs}
  `;

  const rows = await runAggregationQuery<{
    up_count: number;
    degraded_count: number;
    down_count: number;
  }>(query);

  const row = rows[0] || { up_count: 0, degraded_count: 0, down_count: 0 };
  return {
    up: row.up_count || 0,
    degraded: row.degraded_count || 0,
    down: row.down_count || 0,
  };
}

// Aggregated data for multiple monitors (for overview page)
export async function getAggregatedResponseTimeChartData(
  monitorIds: string[],
  timeRange: TimeRange,
  interval: IntervalOption,
): Promise<ResponseTimeDataPoint[]> {
  if (monitorIds.length === 0) return [];

  const intervalMs = getIntervalMs(interval);
  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();
  const idList = monitorIds.map((id) => `'${id}'`).join(",");

  const query = `
    SELECT
      (checked_at / ${intervalMs}) * ${intervalMs} as bucket,
      ROUND(AVG(response_time_ms)) as avg_response_time
    FROM pongo_check_results
    WHERE monitor_id IN (${idList})
      AND checked_at >= ${fromMs}
      AND checked_at <= ${toMs}
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
}

export async function getAggregatedErrorRateChartData(
  monitorIds: string[],
  timeRange: TimeRange,
  interval: IntervalOption,
): Promise<ErrorRateDataPoint[]> {
  if (monitorIds.length === 0) return [];

  const intervalMs = getIntervalMs(interval);
  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();
  const idList = monitorIds.map((id) => `'${id}'`).join(",");

  const query = `
    SELECT
      (checked_at / ${intervalMs}) * ${intervalMs} as bucket,
      SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as errors,
      COUNT(*) as total
    FROM pongo_check_results
    WHERE monitor_id IN (${idList})
      AND checked_at >= ${fromMs}
      AND checked_at <= ${toMs}
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
    errors: row.errors,
  }));
}

export async function getAggregatedUptimeChartData(
  monitorIds: string[],
  timeRange: TimeRange,
  interval: IntervalOption,
): Promise<UptimeDataPoint[]> {
  if (monitorIds.length === 0) return [];

  const intervalMs = getIntervalMs(interval);
  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();
  const idList = monitorIds.map((id) => `'${id}'`).join(",");

  const query = `
    SELECT
      (checked_at / ${intervalMs}) * ${intervalMs} as bucket,
      SUM(CASE WHEN status IN ('up', 'degraded') THEN 1 ELSE 0 END) as up_count,
      COUNT(*) as total
    FROM pongo_check_results
    WHERE monitor_id IN (${idList})
      AND checked_at >= ${fromMs}
      AND checked_at <= ${toMs}
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
    uptime: Math.round((row.up_count / row.total) * 100),
  }));
}

export async function getAggregatedLatencyPercentilesChartData(
  monitorIds: string[],
  timeRange: TimeRange,
  interval: IntervalOption,
): Promise<LatencyPercentilesDataPoint[]> {
  if (monitorIds.length === 0) return [];

  const intervalMs = getIntervalMs(interval);
  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();
  const idList = monitorIds.map((id) => `'${id}'`).join(",");

  const query = `
    SELECT
      (checked_at / ${intervalMs}) * ${intervalMs} as bucket,
      response_time_ms
    FROM pongo_check_results
    WHERE monitor_id IN (${idList})
      AND checked_at >= ${fromMs}
      AND checked_at <= ${toMs}
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
}

export async function getAggregatedThroughputChartData(
  monitorIds: string[],
  timeRange: TimeRange,
  interval: IntervalOption,
): Promise<ThroughputDataPoint[]> {
  if (monitorIds.length === 0) return [];

  const intervalMs = getIntervalMs(interval);
  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();
  const idList = monitorIds.map((id) => `'${id}'`).join(",");

  const query = `
    SELECT
      (checked_at / ${intervalMs}) * ${intervalMs} as bucket,
      COUNT(*) as checks
    FROM pongo_check_results
    WHERE monitor_id IN (${idList})
      AND checked_at >= ${fromMs}
      AND checked_at <= ${toMs}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  const rows = await runAggregationQuery<{
    bucket: number;
    checks: number;
  }>(query);

  return rows.map((row) => ({
    time: formatBucketLabel(row.bucket, interval),
    checks: row.checks,
  }));
}

export async function getAggregatedStatusDistributionData(
  monitorIds: string[],
  timeRange: TimeRange,
): Promise<StatusDistributionData> {
  if (monitorIds.length === 0) return { up: 0, degraded: 0, down: 0 };

  const fromMs = timeRange.from.getTime();
  const toMs = timeRange.to.getTime();
  const idList = monitorIds.map((id) => `'${id}'`).join(",");

  const query = `
    SELECT
      SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up_count,
      SUM(CASE WHEN status = 'degraded' THEN 1 ELSE 0 END) as degraded_count,
      SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as down_count
    FROM pongo_check_results
    WHERE monitor_id IN (${idList})
      AND checked_at >= ${fromMs}
      AND checked_at <= ${toMs}
  `;

  const rows = await runAggregationQuery<{
    up_count: number;
    degraded_count: number;
    down_count: number;
  }>(query);

  const row = rows[0] || { up_count: 0, degraded_count: 0, down_count: 0 };
  return {
    up: row.up_count || 0,
    degraded: row.degraded_count || 0,
    down: row.down_count || 0,
  };
}
