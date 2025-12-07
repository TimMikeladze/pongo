// src/lib/loader.ts
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import matter from "gray-matter"
import { marked } from "marked"
import type {
  MonitorConfig,
  DashboardConfig,
  AnnouncementFrontmatter,
  IncidentFrontmatter,
  parseDuration,
} from "./config-types"
import { parseDuration as parseDur } from "./config-types"
import type {
  Monitor,
  Dashboard,
  Announcement,
  Incident,
  IncidentUpdate,
  CheckResult,
  MonitorStatus,
} from "./types"

const DATA_DIR = path.join(process.cwd(), "data")

// Create a require function to bypass Turbopack's static analysis
const requireModule = createRequire(import.meta.url || __filename)

/**
 * Load all monitor definitions from data/monitors/*.ts
 */
export async function loadMonitors(): Promise<Monitor[]> {
  const monitorsDir = path.join(DATA_DIR, "monitors")

  if (!fs.existsSync(monitorsDir)) {
    return []
  }

  const files = fs.readdirSync(monitorsDir).filter((f) => (f.endsWith(".ts") || f.endsWith(".js")) && !f.startsWith("."))
  const monitors: Monitor[] = []

  for (const file of files) {
    const id = file.replace(/\.(ts|js)$/, "")
    const filePath = path.join(monitorsDir, file)

    try {
      // Use createRequire to bypass Turbopack's static analysis
      // Clear the require cache to ensure fresh loads
      delete requireModule.cache[requireModule.resolve(filePath)]
      const module = requireModule(filePath)
      // Support both CommonJS (module.exports) and ES modules (export default)
      const config: MonitorConfig = module.default || module

      monitors.push({
        id,
        name: config.name,
        url: config.url,
        method: config.method ?? "GET",
        headers: config.headers,
        body: config.body,
        intervalSeconds: parseDur(config.interval) / 1000,
        timeoutMs: config.timeout ? parseDur(config.timeout) : 30000,
        expectedStatus: config.expectedStatus ?? 200,
        isActive: config.active ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error(`Failed to load monitor ${file}:`, error)
    }
  }

  return monitors
}

/**
 * Load all dashboard definitions from data/dashboards/*.ts
 */
export async function loadDashboards(): Promise<Dashboard[]> {
  const dashboardsDir = path.join(DATA_DIR, "dashboards")

  if (!fs.existsSync(dashboardsDir)) {
    return []
  }

  const files = fs.readdirSync(dashboardsDir).filter((f) => (f.endsWith(".ts") || f.endsWith(".js")) && !f.startsWith("."))
  const dashboards: Dashboard[] = []

  for (const file of files) {
    const id = file.replace(/\.(ts|js)$/, "")
    const filePath = path.join(dashboardsDir, file)

    try {
      // Use createRequire to bypass Turbopack's static analysis
      // Clear the require cache to ensure fresh loads
      delete requireModule.cache[requireModule.resolve(filePath)]
      const module = requireModule(filePath)
      // Support both CommonJS (module.exports) and ES modules (export default)
      const config: DashboardConfig = module.default || module

      dashboards.push({
        id,
        name: config.name,
        slug: config.slug,
        isPublic: config.public ?? false,
        monitorIds: config.monitors,
        slaTarget: config.slaTarget,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error(`Failed to load dashboard ${file}:`, error)
    }
  }

  return dashboards
}

/**
 * Load all announcements from data/announcements/*.md
 */
export async function loadAnnouncements(): Promise<Announcement[]> {
  const announcementsDir = path.join(DATA_DIR, "announcements")

  if (!fs.existsSync(announcementsDir)) {
    return []
  }

  const files = fs.readdirSync(announcementsDir).filter((f) => f.endsWith(".md") && !f.startsWith("."))
  const announcements: Announcement[] = []

  for (const file of files) {
    const id = file.replace(/\.md$/, "")
    const filePath = path.join(announcementsDir, file)

    try {
      const content = fs.readFileSync(filePath, "utf-8")
      const { data, content: body } = matter(content)
      const frontmatter = data as AnnouncementFrontmatter
      const stats = fs.statSync(filePath)

      announcements.push({
        id,
        dashboardId: frontmatter.dashboard,
        title: frontmatter.title,
        message: await marked(body),
        type: frontmatter.type,
        createdAt: stats.birthtime.toISOString(),
        expiresAt: frontmatter.expiresAt,
      })
    } catch (error) {
      console.error(`Failed to load announcement ${file}:`, error)
    }
  }

  // Sort by creation date, newest first
  return announcements.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * Load all incidents from data/incidents/*.md
 */
export async function loadIncidents(): Promise<Incident[]> {
  const incidentsDir = path.join(DATA_DIR, "incidents")

  if (!fs.existsSync(incidentsDir)) {
    return []
  }

  const files = fs.readdirSync(incidentsDir).filter((f) => f.endsWith(".md") && !f.startsWith("."))
  const incidents: Incident[] = []

  for (const file of files) {
    const id = file.replace(/\.md$/, "")
    const filePath = path.join(incidentsDir, file)

    try {
      const content = fs.readFileSync(filePath, "utf-8")
      const { data, content: body } = matter(content)
      const frontmatter = data as IncidentFrontmatter
      const stats = fs.statSync(filePath)

      // Parse markdown body into updates (split by ## headers)
      const updates = parseIncidentUpdates(body)

      incidents.push({
        id,
        dashboardId: frontmatter.dashboard,
        title: frontmatter.title,
        severity: frontmatter.severity,
        status: frontmatter.status,
        affectedMonitorIds: frontmatter.affectedMonitors,
        updates,
        createdAt: stats.birthtime.toISOString(),
        resolvedAt: frontmatter.resolvedAt,
      })
    } catch (error) {
      console.error(`Failed to load incident ${file}:`, error)
    }
  }

  // Sort by creation date, newest first
  return incidents.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * Parse incident markdown body into structured updates
 * Expects format: ## Status - Date\n\nMessage
 */
function parseIncidentUpdates(body: string): IncidentUpdate[] {
  const updates: IncidentUpdate[] = []
  const sections = body.split(/^## /m).filter(Boolean)

  for (const section of sections) {
    const lines = section.trim().split("\n")
    const headerLine = lines[0]
    const message = lines.slice(1).join("\n").trim()

    // Parse header: "Investigating - Dec 5, 10:00 UTC"
    const match = headerLine.match(/^(\w+)\s*-\s*(.+)$/)
    if (match) {
      const statusStr = match[1].toLowerCase()
      const dateStr = match[2]

      let status: IncidentUpdate["status"] = "investigating"
      if (statusStr === "identified") status = "identified"
      else if (statusStr === "monitoring") status = "monitoring"
      else if (statusStr === "resolved") status = "resolved"

      updates.push({
        id: `update-${updates.length}`,
        status,
        message,
        createdAt: new Date().toISOString(), // Could parse dateStr for real dates
      })
    }
  }

  return updates
}

/**
 * Generate mock check results for a monitor (for chart display)
 */
export function generateMockCheckResults(monitorId: string, count = 90 * 24): CheckResult[] {
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
