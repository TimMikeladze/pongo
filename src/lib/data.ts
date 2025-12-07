// src/lib/data.ts

import { desc, eq } from "drizzle-orm";
import { cache } from "react";
import { getDbAsync, getDbDriver, sqliteSchema, pgSchema } from "@/db";
import {
  loadAnnouncements,
  loadDashboards,
  loadIncidents,
  loadMonitors,
} from "./loader";
import type {
  Announcement,
  CheckResult,
  Dashboard,
  Incident,
  MaintenanceWindow,
  Monitor,
  MonitorStatus,
} from "./types";

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
  async (monitorId: string, limit?: number): Promise<CheckResult[]> => {
    const db = await getDbAsync();
    const driver = getDbDriver();
    const checkResults =
      driver === "pg" ? pgSchema.checkResults : sqliteSchema.checkResults;

    // biome-ignore lint/suspicious/noExplicitAny: dual-schema type union issue
    let query = (db as any)
      .select()
      .from(checkResults)
      .where(eq(checkResults.monitorId, monitorId))
      .orderBy(desc(checkResults.checkedAt));

    if (limit) {
      query = query.limit(limit);
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
    const results = await getCheckResults(monitorId, 1);
    return results[0] || null;
  },
);

// Stats helpers
export async function getUptimePercentage(
  monitorId: string,
  hours = 24,
): Promise<number> {
  const since = Date.now() - hours * 60 * 60 * 1000;
  const results = await getCheckResults(monitorId);
  const filtered = results.filter(
    (c) => new Date(c.checkedAt).getTime() >= since,
  );

  if (filtered.length === 0) return 100;
  const upCount = filtered.filter(
    (r) => r.status === "up" || r.status === "degraded",
  ).length;
  return Math.round((upCount / filtered.length) * 10000) / 100;
}

export async function getAverageResponseTime(
  monitorId: string,
  hours = 24,
): Promise<number> {
  const since = Date.now() - hours * 60 * 60 * 1000;
  const results = await getCheckResults(monitorId);
  const filtered = results.filter(
    (c) => new Date(c.checkedAt).getTime() >= since && c.status !== "down",
  );

  if (filtered.length === 0) return 0;
  const sum = filtered.reduce((acc, r) => acc + r.responseTimeMs, 0);
  return Math.round(sum / filtered.length);
}

export async function getMonitorStats(monitorId: string, hours = 24) {
  const [uptime, avgResponseTime] = await Promise.all([
    getUptimePercentage(monitorId, hours),
    getAverageResponseTime(monitorId, hours),
  ]);
  return { uptime, avgResponseTime };
}

export async function getErrorRate(
  monitorId: string,
  hours = 24,
): Promise<number> {
  const since = Date.now() - hours * 60 * 60 * 1000;
  const results = await getCheckResults(monitorId);
  const filtered = results.filter(
    (c) => new Date(c.checkedAt).getTime() >= since,
  );

  if (filtered.length === 0) return 0;
  const errorCount = filtered.filter((r) => r.status === "down").length;
  return Math.round((errorCount / filtered.length) * 10000) / 100;
}

export async function getP95ResponseTime(
  monitorId: string,
  hours = 24,
): Promise<number> {
  const since = Date.now() - hours * 60 * 60 * 1000;
  const results = await getCheckResults(monitorId);
  const responseTimes = results
    .filter(
      (c) => new Date(c.checkedAt).getTime() >= since && c.status !== "down",
    )
    .map((r) => r.responseTimeMs)
    .sort((a, b) => a - b);

  if (responseTimes.length === 0) return 0;
  const index = Math.floor(responseTimes.length * 0.95);
  return responseTimes[index] || responseTimes[responseTimes.length - 1];
}

export async function getP99ResponseTime(
  monitorId: string,
  hours = 24,
): Promise<number> {
  const since = Date.now() - hours * 60 * 60 * 1000;
  const results = await getCheckResults(monitorId);
  const responseTimes = results
    .filter(
      (c) => new Date(c.checkedAt).getTime() >= since && c.status !== "down",
    )
    .map((r) => r.responseTimeMs)
    .sort((a, b) => a - b);

  if (responseTimes.length === 0) return 0;
  const index = Math.floor(responseTimes.length * 0.99);
  return responseTimes[index] || responseTimes[responseTimes.length - 1];
}

export async function getTotalChecks(
  monitorId: string,
  hours = 24,
): Promise<number> {
  const since = Date.now() - hours * 60 * 60 * 1000;
  const results = await getCheckResults(monitorId);
  return results.filter((c) => new Date(c.checkedAt).getTime() >= since).length;
}

export async function getDailyStatus(
  monitorId: string,
  days = 90,
): Promise<
  Array<{ date: string; status: MonitorStatus; uptime: number; checks: number }>
> {
  const results = await getCheckResults(monitorId);
  const result: Array<{
    date: string;
    status: MonitorStatus;
    uptime: number;
    checks: number;
  }> = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dayStart = date.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const dayChecks = results.filter((c) => {
      const checkTime = new Date(c.checkedAt).getTime();
      return checkTime >= dayStart && checkTime < dayEnd;
    });

    if (dayChecks.length === 0) {
      result.push({
        date: date.toISOString().split("T")[0],
        status: "pending",
        uptime: 100,
        checks: 0,
      });
      continue;
    }

    const upCount = dayChecks.filter((c) => c.status === "up").length;
    const degradedCount = dayChecks.filter(
      (c) => c.status === "degraded",
    ).length;
    const downCount = dayChecks.filter((c) => c.status === "down").length;
    const uptime =
      Math.round(((upCount + degradedCount) / dayChecks.length) * 10000) / 100;

    let status: MonitorStatus = "up";
    if (downCount > 0) status = "down";
    else if (degradedCount > 0) status = "degraded";

    result.push({
      date: date.toISOString().split("T")[0],
      status,
      uptime,
      checks: dayChecks.length,
    });
  }

  return result;
}

export async function getSLAStatus(dashboardId: string, days = 30) {
  const dashboard = await getDashboard(dashboardId);
  if (!dashboard) return null;

  const monitors = await getMonitors();
  const dashboardMonitors = monitors.filter((m) =>
    dashboard.monitorIds.includes(m.id),
  );
  if (dashboardMonitors.length === 0) return null;

  const uptimes = await Promise.all(
    dashboardMonitors.map((m) => getUptimePercentage(m.id, days * 24)),
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
