// src/lib/data.ts
import { cache } from "react"
import {
  loadMonitors,
  loadDashboards,
  loadAnnouncements,
  loadIncidents,
  generateMockCheckResults,
} from "./loader"
import type {
  Monitor,
  Dashboard,
  Announcement,
  Incident,
  CheckResult,
  MonitorStatus,
  MaintenanceWindow,
} from "./types"

// Cache data loading per request
export const getMonitors = cache(async (): Promise<Monitor[]> => {
  return loadMonitors()
})

export const getMonitor = cache(async (id: string): Promise<Monitor | undefined> => {
  const monitors = await getMonitors()
  return monitors.find((m) => m.id === id)
})

export const getDashboards = cache(async (): Promise<Dashboard[]> => {
  return loadDashboards()
})

export const getDashboard = cache(async (id: string): Promise<Dashboard | undefined> => {
  const dashboards = await getDashboards()
  return dashboards.find((d) => d.id === id)
})

export const getDashboardBySlug = cache(async (slug: string): Promise<Dashboard | undefined> => {
  const dashboards = await getDashboards()
  return dashboards.find((d) => d.slug === slug)
})

export const getAnnouncements = cache(async (dashboardId?: string): Promise<Announcement[]> => {
  const all = await loadAnnouncements()
  const now = Date.now()

  return all
    .filter((a) => !dashboardId || a.dashboardId === dashboardId)
    .filter((a) => !a.expiresAt || new Date(a.expiresAt).getTime() > now)
})

export const getIncidents = cache(async (dashboardId?: string): Promise<Incident[]> => {
  const all = await loadIncidents()
  return all.filter((i) => !dashboardId || i.dashboardId === dashboardId)
})

export const getActiveIncidents = cache(async (dashboardId?: string): Promise<Incident[]> => {
  const incidents = await getIncidents(dashboardId)
  return incidents.filter((i) => i.status !== "resolved")
})

// Mock check results - cached per monitor
const checkResultsCache = new Map<string, CheckResult[]>()

export const getCheckResults = cache(async (monitorId: string, limit?: number): Promise<CheckResult[]> => {
  if (!checkResultsCache.has(monitorId)) {
    checkResultsCache.set(monitorId, generateMockCheckResults(monitorId))
  }

  const results = checkResultsCache.get(monitorId)!
  return limit ? results.slice(0, limit) : results
})

export const getLatestCheckResult = cache(async (monitorId: string): Promise<CheckResult | null> => {
  const results = await getCheckResults(monitorId, 1)
  return results[0] || null
})

// Stats helpers
export async function getUptimePercentage(monitorId: string, hours = 24): Promise<number> {
  const since = Date.now() - hours * 60 * 60 * 1000
  const results = await getCheckResults(monitorId)
  const filtered = results.filter((c) => new Date(c.checkedAt).getTime() >= since)

  if (filtered.length === 0) return 100
  const upCount = filtered.filter((r) => r.status === "up" || r.status === "degraded").length
  return Math.round((upCount / filtered.length) * 10000) / 100
}

export async function getAverageResponseTime(monitorId: string, hours = 24): Promise<number> {
  const since = Date.now() - hours * 60 * 60 * 1000
  const results = await getCheckResults(monitorId)
  const filtered = results.filter(
    (c) => new Date(c.checkedAt).getTime() >= since && c.status !== "down"
  )

  if (filtered.length === 0) return 0
  const sum = filtered.reduce((acc, r) => acc + r.responseTimeMs, 0)
  return Math.round(sum / filtered.length)
}

export async function getMonitorStats(monitorId: string, hours = 24) {
  const [uptime, avgResponseTime] = await Promise.all([
    getUptimePercentage(monitorId, hours),
    getAverageResponseTime(monitorId, hours),
  ])
  return { uptime, avgResponseTime }
}

export async function getDailyStatus(
  monitorId: string,
  days = 90
): Promise<Array<{ date: string; status: MonitorStatus; uptime: number; checks: number }>> {
  const results = await getCheckResults(monitorId)
  const result: Array<{ date: string; status: MonitorStatus; uptime: number; checks: number }> = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const dayStart = date.getTime()
    const dayEnd = dayStart + 24 * 60 * 60 * 1000

    const dayChecks = results.filter((c) => {
      const checkTime = new Date(c.checkedAt).getTime()
      return checkTime >= dayStart && checkTime < dayEnd
    })

    if (dayChecks.length === 0) {
      result.push({
        date: date.toISOString().split("T")[0],
        status: "pending",
        uptime: 100,
        checks: 0,
      })
      continue
    }

    const upCount = dayChecks.filter((c) => c.status === "up").length
    const degradedCount = dayChecks.filter((c) => c.status === "degraded").length
    const downCount = dayChecks.filter((c) => c.status === "down").length
    const uptime = Math.round(((upCount + degradedCount) / dayChecks.length) * 10000) / 100

    let status: MonitorStatus = "up"
    if (downCount > 0) status = "down"
    else if (degradedCount > 0) status = "degraded"

    result.push({
      date: date.toISOString().split("T")[0],
      status,
      uptime,
      checks: dayChecks.length,
    })
  }

  return result
}

export async function getSLAStatus(dashboardId: string, days = 30) {
  const dashboard = await getDashboard(dashboardId)
  if (!dashboard) return null

  const monitors = await getMonitors()
  const dashboardMonitors = monitors.filter((m) => dashboard.monitorIds.includes(m.id))
  if (dashboardMonitors.length === 0) return null

  const uptimes = await Promise.all(
    dashboardMonitors.map((m) => getUptimePercentage(m.id, days * 24))
  )
  const totalUptime = uptimes.reduce((a, b) => a + b, 0) / uptimes.length
  const target = dashboard.slaTarget || 99.9

  return {
    target,
    actual: Math.round(totalUptime * 100) / 100,
    met: totalUptime >= target,
    remaining: Math.max(0, target - totalUptime),
  }
}

// Maintenance windows - empty for now (to be added with orchestration)
export async function getMaintenanceWindows(dashboardId?: string): Promise<MaintenanceWindow[]> {
  return []
}

export async function getUpcomingMaintenance(dashboardId?: string): Promise<MaintenanceWindow[]> {
  return []
}
