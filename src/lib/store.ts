import type {
  Monitor,
  CheckResult,
  Dashboard,
  NotificationChannel,
  MonitorStatus,
  Announcement,
  Incident,
  IncidentUpdate,
  MaintenanceWindow,
  Subscriber,
} from "./types"

// Generate mock check results for a monitor
function generateMockCheckResults(monitorId: string, count = 90 * 24): CheckResult[] {
  const results: CheckResult[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const isUp = Math.random() > 0.03 // 97% uptime
    const isDegraded = isUp && Math.random() > 0.95

    let status: MonitorStatus = "up"
    let responseTime = Math.floor(Math.random() * 200) + 50
    let statusCode: number | null = 200
    let errorMessage: string | null = null

    if (!isUp) {
      status = "down"
      responseTime = Math.floor(Math.random() * 5000) + 3000
      statusCode = Math.random() > 0.5 ? 500 : 503
      errorMessage = statusCode === 500 ? "Internal Server Error" : "Service Unavailable"
    } else if (isDegraded) {
      status = "degraded"
      responseTime = Math.floor(Math.random() * 1000) + 500
    }

    results.push({
      id: `check-${monitorId}-${i}`,
      monitorId,
      status,
      responseTimeMs: responseTime,
      statusCode,
      errorMessage,
      checkedAt: new Date(now - i * 60 * 60 * 1000).toISOString(),
    })
  }

  return results
}

// Initial mock data
const initialMonitors: Monitor[] = [
  {
    id: "mon-1",
    name: "Production API",
    url: "https://api.example.com/health",
    method: "GET",
    intervalSeconds: 60,
    timeoutMs: 30000,
    expectedStatus: 200,
    isActive: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mon-2",
    name: "Marketing Website",
    url: "https://www.example.com",
    method: "GET",
    intervalSeconds: 300,
    timeoutMs: 30000,
    expectedStatus: 200,
    isActive: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mon-3",
    name: "Auth Service",
    url: "https://auth.example.com/status",
    method: "GET",
    intervalSeconds: 30,
    timeoutMs: 10000,
    expectedStatus: 200,
    isActive: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mon-4",
    name: "Database Backup",
    url: "https://backup.example.com/ping",
    method: "POST",
    intervalSeconds: 3600,
    timeoutMs: 60000,
    expectedStatus: 200,
    isActive: false,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const initialDashboards: Dashboard[] = [
  {
    id: "dash-1",
    name: "Production Status",
    slug: "production-status",
    isPublic: true,
    monitorIds: ["mon-1", "mon-2", "mon-3"],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const initialNotificationChannels: NotificationChannel[] = [
  {
    id: "notif-1",
    type: "email",
    name: "Team Email",
    config: { email: "team@example.com" },
    isActive: true,
    createdAt: new Date().toISOString(),
  },
]

const initialAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    dashboardId: "dash-1",
    title: "Scheduled Maintenance Complete",
    message: "Database migration completed successfully. All systems are now operational.",
    type: "success",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ann-2",
    dashboardId: "dash-1",
    title: "API Performance Improvements",
    message: "We've deployed performance optimizations. Response times should be 20% faster.",
    type: "info",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
]

const initialIncidents: Incident[] = [
  {
    id: "inc-1",
    dashboardId: "dash-1",
    title: "API Latency Issues",
    severity: "minor",
    status: "resolved",
    affectedMonitorIds: ["mon-1"],
    updates: [
      {
        id: "upd-1",
        status: "investigating",
        message: "We are investigating reports of increased API latency.",
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "upd-2",
        status: "identified",
        message: "Root cause identified: database connection pool exhaustion.",
        createdAt: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "upd-3",
        status: "resolved",
        message: "Issue resolved. Connection pool limits have been increased.",
        createdAt: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
  },
]

const initialMaintenanceWindows: MaintenanceWindow[] = [
  {
    id: "maint-1",
    dashboardId: "dash-1",
    title: "Database Upgrade",
    description: "Upgrading database to latest version. Brief interruptions may occur.",
    affectedMonitorIds: ["mon-1", "mon-3"],
    scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    scheduledEnd: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
]

const initialCheckResults: CheckResult[] = initialMonitors.flatMap((m) => generateMockCheckResults(m.id))

class Store {
  private monitors: Monitor[] = initialMonitors
  private checkResults: CheckResult[] = initialCheckResults
  private dashboards: Dashboard[] = initialDashboards
  private notificationChannels: NotificationChannel[] = initialNotificationChannels
  private announcements: Announcement[] = initialAnnouncements
  private incidents: Incident[] = initialIncidents
  private maintenanceWindows: MaintenanceWindow[] = initialMaintenanceWindows
  private subscribers: Subscriber[] = []

  private listeners: Set<() => void> = new Set()

  // Cached snapshots
  private _monitorsSnapshot: Monitor[] = initialMonitors
  private _dashboardsSnapshot: Dashboard[] = initialDashboards
  private _notificationChannelsSnapshot: NotificationChannel[] = initialNotificationChannels
  private _announcementsSnapshot: Announcement[] = initialAnnouncements
  private _incidentsSnapshot: Incident[] = initialIncidents
  private _maintenanceWindowsSnapshot: MaintenanceWindow[] = initialMaintenanceWindows
  private _subscribersSnapshot: Subscriber[] = []
  private _checkResultsCache: Map<string, CheckResult[]> = new Map()
  private _version = 0

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this._version++
    this._monitorsSnapshot = [...this.monitors]
    this._dashboardsSnapshot = [...this.dashboards]
    this._notificationChannelsSnapshot = [...this.notificationChannels]
    this._announcementsSnapshot = [...this.announcements]
    this._incidentsSnapshot = [...this.incidents]
    this._maintenanceWindowsSnapshot = [...this.maintenanceWindows]
    this._subscribersSnapshot = [...this.subscribers]
    this._checkResultsCache.clear()
    this.listeners.forEach((l) => l())
  }

  getVersion() {
    return this._version
  }

  // Monitors - return cached snapshot
  getMonitors() {
    return this._monitorsSnapshot
  }

  getMonitor(id: string) {
    return this._monitorsSnapshot.find((m) => m.id === id)
  }

  createMonitor(data: Omit<Monitor, "id" | "createdAt" | "updatedAt">) {
    const monitor: Monitor = {
      ...data,
      id: `mon-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.monitors.push(monitor)
    this.checkResults.push(...generateMockCheckResults(monitor.id, 10))
    this.notify()
    return monitor
  }

  updateMonitor(id: string, data: Partial<Monitor>) {
    const index = this.monitors.findIndex((m) => m.id === id)
    if (index !== -1) {
      this.monitors[index] = {
        ...this.monitors[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      this.notify()
      return this.monitors[index]
    }
    return null
  }

  deleteMonitor(id: string) {
    this.monitors = this.monitors.filter((m) => m.id !== id)
    this.checkResults = this.checkResults.filter((c) => c.monitorId !== id)
    this.dashboards = this.dashboards.map((d) => ({
      ...d,
      monitorIds: d.monitorIds.filter((mId) => mId !== id),
    }))
    this.notify()
  }

  // Check Results - with caching
  getCheckResults(monitorId: string, limit?: number) {
    const cacheKey = `${monitorId}-${limit ?? "all"}`
    if (this._checkResultsCache.has(cacheKey)) {
      return this._checkResultsCache.get(cacheKey)!
    }

    const results = this.checkResults
      .filter((c) => c.monitorId === monitorId)
      .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime())
    const sliced = limit ? results.slice(0, limit) : results
    this._checkResultsCache.set(cacheKey, sliced)
    return sliced
  }

  getLatestCheckResult(monitorId: string) {
    return this.getCheckResults(monitorId, 1)[0] || null
  }

  // Dashboards - return cached snapshot
  getDashboards() {
    return this._dashboardsSnapshot
  }

  getDashboard(id: string) {
    return this._dashboardsSnapshot.find((d) => d.id === id)
  }

  getDashboardBySlug(slug: string) {
    return this._dashboardsSnapshot.find((d) => d.slug === slug)
  }

  createDashboard(data: Omit<Dashboard, "id" | "createdAt" | "updatedAt">) {
    const dashboard: Dashboard = {
      ...data,
      id: `dash-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.dashboards.push(dashboard)
    this.notify()
    return dashboard
  }

  updateDashboard(id: string, data: Partial<Dashboard>) {
    const index = this.dashboards.findIndex((d) => d.id === id)
    if (index !== -1) {
      this.dashboards[index] = {
        ...this.dashboards[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      this.notify()
      return this.dashboards[index]
    }
    return null
  }

  deleteDashboard(id: string) {
    this.dashboards = this.dashboards.filter((d) => d.id !== id)
    this.notify()
  }

  // Notification Channels - return cached snapshot
  getNotificationChannels() {
    return this._notificationChannelsSnapshot
  }

  createNotificationChannel(data: Omit<NotificationChannel, "id" | "createdAt">) {
    const channel: NotificationChannel = {
      ...data,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    this.notificationChannels.push(channel)
    this.notify()
    return channel
  }

  updateNotificationChannel(id: string, data: Partial<NotificationChannel>) {
    const index = this.notificationChannels.findIndex((n) => n.id === id)
    if (index !== -1) {
      this.notificationChannels[index] = {
        ...this.notificationChannels[index],
        ...data,
      }
      this.notify()
      return this.notificationChannels[index]
    }
    return null
  }

  deleteNotificationChannel(id: string) {
    this.notificationChannels = this.notificationChannels.filter((n) => n.id !== id)
    this.notify()
  }

  getAnnouncements(dashboardId?: string) {
    const announcements = this._announcementsSnapshot
      .filter((a) => !dashboardId || a.dashboardId === dashboardId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Filter out expired announcements
    const now = Date.now()
    return announcements.filter((a) => !a.expiresAt || new Date(a.expiresAt).getTime() > now)
  }

  createAnnouncement(data: Omit<Announcement, "id" | "createdAt">) {
    const announcement: Announcement = {
      ...data,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    this.announcements.push(announcement)
    this.notify()
    return announcement
  }

  deleteAnnouncement(id: string) {
    this.announcements = this.announcements.filter((a) => a.id !== id)
    this.notify()
  }

  getIncidents(dashboardId?: string) {
    return this._incidentsSnapshot
      .filter((i) => !dashboardId || i.dashboardId === dashboardId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  getActiveIncidents(dashboardId?: string) {
    return this.getIncidents(dashboardId).filter((i) => i.status !== "resolved")
  }

  createIncident(data: Omit<Incident, "id" | "createdAt" | "updates">) {
    const incident: Incident = {
      ...data,
      id: `inc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updates: [
        {
          id: `upd-${Date.now()}`,
          status: data.status,
          message: `Incident created: ${data.title}`,
          createdAt: new Date().toISOString(),
        },
      ],
    }
    this.incidents.push(incident)
    this.notify()
    return incident
  }

  addIncidentUpdate(incidentId: string, update: Omit<IncidentUpdate, "id" | "createdAt">) {
    const index = this.incidents.findIndex((i) => i.id === incidentId)
    if (index !== -1) {
      const newUpdate: IncidentUpdate = {
        ...update,
        id: `upd-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      this.incidents[index].updates.push(newUpdate)
      this.incidents[index].status = update.status
      if (update.status === "resolved") {
        this.incidents[index].resolvedAt = new Date().toISOString()
      }
      this.notify()
      return newUpdate
    }
    return null
  }

  getMaintenanceWindows(dashboardId?: string) {
    return this._maintenanceWindowsSnapshot
      .filter((m) => !dashboardId || m.dashboardId === dashboardId)
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
  }

  getUpcomingMaintenance(dashboardId?: string) {
    const now = Date.now()
    return this.getMaintenanceWindows(dashboardId).filter((m) => new Date(m.scheduledEnd).getTime() > now)
  }

  createMaintenanceWindow(data: Omit<MaintenanceWindow, "id" | "createdAt">) {
    const window: MaintenanceWindow = {
      ...data,
      id: `maint-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    this.maintenanceWindows.push(window)
    this.notify()
    return window
  }

  deleteMaintenanceWindow(id: string) {
    this.maintenanceWindows = this.maintenanceWindows.filter((m) => m.id !== id)
    this.notify()
  }

  getSubscribers(dashboardId: string) {
    return this._subscribersSnapshot.filter((s) => s.dashboardId === dashboardId)
  }

  addSubscriber(dashboardId: string, email: string) {
    // Check if already subscribed
    const existing = this.subscribers.find((s) => s.dashboardId === dashboardId && s.email === email)
    if (existing) return existing

    const subscriber: Subscriber = {
      id: `sub-${Date.now()}`,
      dashboardId,
      email,
      createdAt: new Date().toISOString(),
    }
    this.subscribers.push(subscriber)
    this.notify()
    return subscriber
  }

  removeSubscriber(id: string) {
    this.subscribers = this.subscribers.filter((s) => s.id !== id)
    this.notify()
  }

  getSLAStatus(dashboardId: string, days = 30) {
    const dashboard = this.getDashboard(dashboardId)
    if (!dashboard) return null

    const monitors = this._monitorsSnapshot.filter((m) => dashboard.monitorIds.includes(m.id))
    if (monitors.length === 0) return null

    const totalUptime =
      monitors.reduce((acc, m) => acc + this.getUptimePercentage(m.id, days * 24), 0) / monitors.length
    const target = dashboard.slaTarget || 99.9

    return {
      target,
      actual: Math.round(totalUptime * 100) / 100,
      met: totalUptime >= target,
      remaining: Math.max(0, target - totalUptime),
    }
  }

  // Stats helpers
  getUptimePercentage(monitorId: string, hours = 24) {
    const since = Date.now() - hours * 60 * 60 * 1000
    const results = this.checkResults.filter(
      (c) => c.monitorId === monitorId && new Date(c.checkedAt).getTime() >= since,
    )
    if (results.length === 0) return 100
    const upCount = results.filter((r) => r.status === "up" || r.status === "degraded").length
    return Math.round((upCount / results.length) * 10000) / 100
  }

  getAverageResponseTime(monitorId: string, hours = 24) {
    const since = Date.now() - hours * 60 * 60 * 1000
    const results = this.checkResults.filter(
      (c) => c.monitorId === monitorId && new Date(c.checkedAt).getTime() >= since && c.status !== "down",
    )
    if (results.length === 0) return 0
    const sum = results.reduce((acc, r) => acc + r.responseTimeMs, 0)
    return Math.round(sum / results.length)
  }

  getErrorRate(monitorId: string, hours = 24) {
    const since = Date.now() - hours * 60 * 60 * 1000
    const results = this.checkResults.filter(
      (c) => c.monitorId === monitorId && new Date(c.checkedAt).getTime() >= since,
    )
    if (results.length === 0) return 0
    const errorCount = results.filter((r) => r.status === "down").length
    return Math.round((errorCount / results.length) * 10000) / 100
  }

  getP95ResponseTime(monitorId: string, hours = 24) {
    const since = Date.now() - hours * 60 * 60 * 1000
    const results = this.checkResults
      .filter((c) => c.monitorId === monitorId && new Date(c.checkedAt).getTime() >= since && c.status !== "down")
      .map((r) => r.responseTimeMs)
      .sort((a, b) => a - b)
    if (results.length === 0) return 0
    const index = Math.floor(results.length * 0.95)
    return results[index] || results[results.length - 1]
  }

  getP99ResponseTime(monitorId: string, hours = 24) {
    const since = Date.now() - hours * 60 * 60 * 1000
    const results = this.checkResults
      .filter((c) => c.monitorId === monitorId && new Date(c.checkedAt).getTime() >= since && c.status !== "down")
      .map((r) => r.responseTimeMs)
      .sort((a, b) => a - b)
    if (results.length === 0) return 0
    const index = Math.floor(results.length * 0.99)
    return results[index] || results[results.length - 1]
  }

  getTotalChecks(monitorId: string, hours = 24) {
    const since = Date.now() - hours * 60 * 60 * 1000
    return this.checkResults.filter((c) => c.monitorId === monitorId && new Date(c.checkedAt).getTime() >= since).length
  }

  getStatusDistribution(monitorId: string, hours = 24) {
    const since = Date.now() - hours * 60 * 60 * 1000
    const results = this.checkResults.filter(
      (c) => c.monitorId === monitorId && new Date(c.checkedAt).getTime() >= since,
    )
    const distribution = { up: 0, down: 0, degraded: 0 }
    results.forEach((r) => {
      if (r.status === "up") distribution.up++
      else if (r.status === "down") distribution.down++
      else if (r.status === "degraded") distribution.degraded++
    })
    return distribution
  }

  getAllCheckResults(hours = 24) {
    const since = Date.now() - hours * 60 * 60 * 1000
    return this.checkResults.filter((c) => new Date(c.checkedAt).getTime() >= since)
  }

  getDailyStatus(
    monitorId: string,
    days = 90,
  ): Array<{ date: string; status: MonitorStatus; uptime: number; checks: number }> {
    const result: Array<{ date: string; status: MonitorStatus; uptime: number; checks: number }> = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const dayStart = date.getTime()
      const dayEnd = dayStart + 24 * 60 * 60 * 1000

      const dayChecks = this.checkResults.filter((c) => {
        const checkTime = new Date(c.checkedAt).getTime()
        return c.monitorId === monitorId && checkTime >= dayStart && checkTime < dayEnd
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
}

export const store = new Store()
