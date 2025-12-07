# File-System Driven Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Pongo into a file-system driven uptime monitor where monitors, dashboards, announcements, and incidents are defined as files, and the UI becomes entirely read-only.

**Architecture:** Create a loader module that reads TypeScript config files for monitors/dashboards and Markdown files for announcements/incidents from a `/data` directory. Replace the in-memory store with these file-based definitions while keeping mock check results for functional charts.

**Tech Stack:** Next.js server components, `gray-matter` for markdown frontmatter, `marked` for markdown-to-HTML conversion, TypeScript for type-safe configs.

---

## Task 1: Add Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install markdown parsing dependencies**

Run:
```bash
bun add gray-matter marked
bun add -d @types/marked
```

**Step 2: Verify installation**

Run: `bun install`
Expected: Dependencies installed successfully

**Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "feat: add gray-matter and marked for markdown parsing"
```

---

## Task 2: Create Data Directory Structure

**Files:**
- Create: `data/monitors/.gitkeep`
- Create: `data/dashboards/.gitkeep`
- Create: `data/announcements/.gitkeep`
- Create: `data/incidents/.gitkeep`

**Step 1: Create directories with placeholder files**

Run:
```bash
mkdir -p data/monitors data/dashboards data/announcements data/incidents
touch data/monitors/.gitkeep data/dashboards/.gitkeep data/announcements/.gitkeep data/incidents/.gitkeep
```

**Step 2: Commit**

```bash
git add data/
git commit -m "feat: add data directory structure for file-based config"
```

---

## Task 3: Define File Config Types

**Files:**
- Create: `src/lib/config-types.ts`

**Step 1: Create config type definitions**

```typescript
// src/lib/config-types.ts
import type { HttpMethod, IncidentSeverity, IncidentStatus } from "./types"

/**
 * Monitor configuration file schema
 * Filename becomes the monitor ID
 */
export interface MonitorConfig {
  name: string
  url: string
  method?: HttpMethod // defaults to GET
  headers?: Record<string, string>
  body?: string
  interval: string // human-readable: "30s", "5m", "1h"
  timeout?: string // human-readable, defaults to "30s"
  expectedStatus?: number // defaults to 200
  active?: boolean // defaults to true
}

/**
 * Dashboard configuration file schema
 * Filename becomes the dashboard ID
 */
export interface DashboardConfig {
  name: string
  slug: string
  public?: boolean // defaults to false
  monitors: string[] // array of monitor IDs (filenames without .ts)
  slaTarget?: number // percentage, e.g., 99.9
}

/**
 * Announcement frontmatter schema
 * Filename becomes the announcement ID
 */
export interface AnnouncementFrontmatter {
  dashboard: string // dashboard ID
  title: string
  type: "info" | "warning" | "success" | "maintenance"
  expiresAt?: string // ISO date
}

/**
 * Incident frontmatter schema
 * Filename becomes the incident ID
 */
export interface IncidentFrontmatter {
  dashboard: string // dashboard ID
  title: string
  severity: IncidentSeverity
  status: IncidentStatus
  affectedMonitors: string[] // monitor IDs
  resolvedAt?: string // ISO date
}

/**
 * Parse human-readable duration to milliseconds
 * Supports: "30s", "5m", "1h", "1d"
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(s|m|h|d)$/)
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`)
  }
  const value = parseInt(match[1], 10)
  const unit = match[2]
  switch (unit) {
    case "s":
      return value * 1000
    case "m":
      return value * 60 * 1000
    case "h":
      return value * 60 * 60 * 1000
    case "d":
      return value * 24 * 60 * 60 * 1000
    default:
      throw new Error(`Unknown duration unit: ${unit}`)
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/config-types.ts
git commit -m "feat: add type definitions for file-based configs"
```

---

## Task 4: Create Example Monitor Files

**Files:**
- Create: `data/monitors/production-api.ts`
- Create: `data/monitors/marketing-website.ts`
- Create: `data/monitors/auth-service.ts`

**Step 1: Create production-api monitor**

```typescript
// data/monitors/production-api.ts
import type { MonitorConfig } from "@/lib/config-types"

export default {
  name: "Production API",
  url: "https://api.example.com/health",
  method: "GET",
  interval: "1m",
  timeout: "30s",
  expectedStatus: 200,
  active: true,
} satisfies MonitorConfig
```

**Step 2: Create marketing-website monitor**

```typescript
// data/monitors/marketing-website.ts
import type { MonitorConfig } from "@/lib/config-types"

export default {
  name: "Marketing Website",
  url: "https://www.example.com",
  method: "GET",
  interval: "5m",
  timeout: "30s",
  expectedStatus: 200,
  active: true,
} satisfies MonitorConfig
```

**Step 3: Create auth-service monitor**

```typescript
// data/monitors/auth-service.ts
import type { MonitorConfig } from "@/lib/config-types"

export default {
  name: "Auth Service",
  url: "https://auth.example.com/status",
  method: "GET",
  interval: "30s",
  timeout: "10s",
  expectedStatus: 200,
  active: true,
} satisfies MonitorConfig
```

**Step 4: Commit**

```bash
git add data/monitors/
git commit -m "feat: add example monitor config files"
```

---

## Task 5: Create Example Dashboard File

**Files:**
- Create: `data/dashboards/production-status.ts`

**Step 1: Create dashboard config**

```typescript
// data/dashboards/production-status.ts
import type { DashboardConfig } from "@/lib/config-types"

export default {
  name: "Production Status",
  slug: "production",
  public: true,
  monitors: ["production-api", "marketing-website", "auth-service"],
  slaTarget: 99.9,
} satisfies DashboardConfig
```

**Step 2: Commit**

```bash
git add data/dashboards/
git commit -m "feat: add example dashboard config file"
```

---

## Task 6: Create Example Announcement File

**Files:**
- Create: `data/announcements/scheduled-maintenance.md`

**Step 1: Create announcement markdown**

```markdown
---
dashboard: production-status
title: Scheduled Maintenance Complete
type: success
---

Database migration completed successfully. All systems are now operational.

We've also deployed performance optimizations - response times should be approximately **20% faster**.
```

**Step 2: Commit**

```bash
git add data/announcements/
git commit -m "feat: add example announcement markdown file"
```

---

## Task 7: Create Example Incident File

**Files:**
- Create: `data/incidents/api-latency-2024-12.md`

**Step 1: Create incident markdown**

```markdown
---
dashboard: production-status
title: API Latency Issues
severity: minor
status: resolved
affectedMonitors:
  - production-api
resolvedAt: 2024-12-05T14:30:00Z
---

## Investigating - Dec 5, 10:00 UTC

We are investigating reports of increased API latency.

## Identified - Dec 5, 11:15 UTC

Root cause identified: database connection pool exhaustion.

## Resolved - Dec 5, 14:30 UTC

Issue resolved. Connection pool limits have been increased.
```

**Step 2: Commit**

```bash
git add data/incidents/
git commit -m "feat: add example incident markdown file"
```

---

## Task 8: Create File Loader Module

**Files:**
- Create: `src/lib/loader.ts`

**Step 1: Create the loader module**

```typescript
// src/lib/loader.ts
import fs from "node:fs"
import path from "node:path"
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

/**
 * Load all monitor definitions from data/monitors/*.ts
 */
export async function loadMonitors(): Promise<Monitor[]> {
  const monitorsDir = path.join(DATA_DIR, "monitors")

  if (!fs.existsSync(monitorsDir)) {
    return []
  }

  const files = fs.readdirSync(monitorsDir).filter((f) => f.endsWith(".ts") && !f.startsWith("."))
  const monitors: Monitor[] = []

  for (const file of files) {
    const id = file.replace(/\.ts$/, "")
    const filePath = path.join(monitorsDir, file)

    try {
      // Dynamic import of TypeScript config
      const module = await import(filePath)
      const config: MonitorConfig = module.default

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

  const files = fs.readdirSync(dashboardsDir).filter((f) => f.endsWith(".ts") && !f.startsWith("."))
  const dashboards: Dashboard[] = []

  for (const file of files) {
    const id = file.replace(/\.ts$/, "")
    const filePath = path.join(dashboardsDir, file)

    try {
      const module = await import(filePath)
      const config: DashboardConfig = module.default

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
```

**Step 2: Commit**

```bash
git add src/lib/loader.ts
git commit -m "feat: add file loader module for monitors, dashboards, announcements, incidents"
```

---

## Task 9: Update tsconfig for Data Directory

**Files:**
- Modify: `tsconfig.json`

**Step 1: Add data path alias**

Add to `compilerOptions.paths`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@data/*": ["./data/*"]
    }
  }
}
```

**Step 2: Commit**

```bash
git add tsconfig.json
git commit -m "feat: add @data path alias for data directory"
```

---

## Task 10: Replace Store with Data Service

**Files:**
- Create: `src/lib/data.ts`

**Step 1: Create server-side data service**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/lib/data.ts
git commit -m "feat: add server-side data service using file loader"
```

---

## Task 11: Delete Form Components

**Files:**
- Delete: `src/components/monitor-form.tsx`
- Delete: `src/components/dashboard-form.tsx`
- Delete: `src/components/announcement-form.tsx`
- Delete: `src/components/subscribe-form.tsx`

**Step 1: Remove form components**

Run:
```bash
rm src/components/monitor-form.tsx
rm src/components/dashboard-form.tsx
rm src/components/announcement-form.tsx
rm src/components/subscribe-form.tsx
```

**Step 2: Commit**

```bash
git add -A
git commit -m "refactor: remove CRUD form components (UI is now read-only)"
```

---

## Task 12: Delete Create Pages

**Files:**
- Delete: `src/app/monitors/new/page.tsx`
- Delete: `src/app/dashboards/new/page.tsx`

**Step 1: Remove create pages**

Run:
```bash
rm -rf src/app/monitors/new
rm -rf src/app/dashboards/new
```

**Step 2: Commit**

```bash
git add -A
git commit -m "refactor: remove create pages (monitors and dashboards defined via files)"
```

---

## Task 13: Update Monitors List Page

**Files:**
- Modify: `src/app/monitors/page.tsx`

**Step 1: Convert to server component using file-based data**

```typescript
// src/app/monitors/page.tsx
import Link from "next/link"
import { Terminal, Zap } from "lucide-react"
import { MonitorCard } from "@/components/monitor-card"
import { getMonitors, getLatestCheckResult } from "@/lib/data"

export default async function MonitorsPage() {
  const monitors = await getMonitors()
  const activeCount = monitors.filter((m) => m.isActive).length
  const pausedCount = monitors.length - activeCount

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center gap-3">
          <Terminal className="h-4 w-4 text-primary" />
          <div>
            <h1 className="text-sm">monitors</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {monitors.length} total · {activeCount} active · {pausedCount} paused
            </p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          defined in <code className="bg-secondary px-1 rounded">data/monitors/</code>
        </p>
      </div>

      {/* Monitors List */}
      {monitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded bg-card/50">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">no monitors configured</p>
          <p className="text-[10px] text-muted-foreground/70">
            add .ts files to <code className="bg-secondary px-1 rounded">data/monitors/</code>
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {monitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/monitors/page.tsx
git commit -m "refactor: convert monitors page to server component with file-based data"
```

---

## Task 14: Update Monitor Card Component

**Files:**
- Modify: `src/components/monitor-card.tsx`

**Step 1: Read current monitor-card.tsx**

Read the file to understand its current implementation.

**Step 2: Update to work with server data**

The MonitorCard needs to receive check result data as a prop instead of using hooks. Update to accept `latestResult` and `stats` as props, and make it a presentational component.

**Step 3: Commit**

```bash
git add src/components/monitor-card.tsx
git commit -m "refactor: update MonitorCard to work with server-side data"
```

---

## Task 15: Update Monitor Detail Page

**Files:**
- Modify: `src/app/monitors/[id]/page.tsx`

**Step 1: Convert to server component, remove edit/delete functionality**

```typescript
// src/app/monitors/[id]/page.tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { StatusTimeline } from "@/components/status-timeline"
import { StatsCard } from "@/components/stats-card"
import { ResponseTimeChart } from "@/components/response-time-chart"
import {
  getMonitor,
  getCheckResults,
  getMonitorStats,
  getLatestCheckResult,
} from "@/lib/data"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface Props {
  params: Promise<{ id: string }>
}

export default async function MonitorDetailPage({ params }: Props) {
  const { id } = await params
  const monitor = await getMonitor(id)

  if (!monitor) {
    notFound()
  }

  const [latestResult, results, stats24h, stats7d] = await Promise.all([
    getLatestCheckResult(id),
    getCheckResults(id, 50),
    getMonitorStats(id, 24),
    getMonitorStats(id, 168),
  ])

  const status = latestResult?.status ?? "pending"

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pt-4">
        <Button variant="ghost" size="icon" asChild className="h-7 w-7">
          <Link href="/monitors">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <StatusBadge status={monitor.isActive ? status : "pending"} size="lg" pulse={status === "up"} />
            <h1 className="text-sm">{monitor.name}</h1>
            {!monitor.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">paused</span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {monitor.method} {monitor.url}
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground">
          <code className="bg-secondary px-1 rounded">data/monitors/{id}.ts</code>
        </p>
      </div>

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            title="uptime 24h"
            value={`${stats24h.uptime}%`}
            trend={stats24h.uptime >= 99.9 ? "up" : stats24h.uptime >= 99 ? "neutral" : "down"}
          />
          <StatsCard
            title="uptime 7d"
            value={`${stats7d.uptime}%`}
            trend={stats7d.uptime >= 99.9 ? "up" : stats7d.uptime >= 99 ? "neutral" : "down"}
          />
          <StatsCard title="avg latency" value={`${stats24h.avgResponseTime}ms`} description="24h" />
          <StatsCard
            title="last check"
            value={
              latestResult ? formatDistanceToNow(new Date(latestResult.checkedAt), { addSuffix: true }) : "never"
            }
            description={latestResult ? `${latestResult.responseTimeMs}ms` : undefined}
          />
        </div>

        <div className="border border-border rounded bg-card p-4">
          <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">response time</h3>
          <ResponseTimeChart results={results} height={160} />
        </div>

        {/* Timeline */}
        <div className="border border-border rounded bg-card p-4">
          <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">status history</h3>
          <StatusTimeline results={results} limit={50} />
        </div>

        {/* Recent Checks */}
        <div className="border border-border rounded bg-card p-4">
          <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">recent checks</h3>
          <div className="space-y-1">
            {results.slice(0, 10).map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={result.status} size="sm" />
                  <span
                    className={cn(
                      "text-xs",
                      result.status === "up" && "text-primary",
                      result.status === "down" && "text-destructive",
                      result.status === "degraded" && "text-yellow-500",
                    )}
                  >
                    {result.statusCode || "err"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{result.errorMessage || "ok"}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span>{result.responseTimeMs}ms</span>
                  <span>{formatDistanceToNow(new Date(result.checkedAt), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Config display */}
        <div className="border border-border rounded bg-card p-4">
          <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">configuration</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">interval</span>
              <p className="font-mono">{monitor.intervalSeconds}s</p>
            </div>
            <div>
              <span className="text-muted-foreground">timeout</span>
              <p className="font-mono">{monitor.timeoutMs}ms</p>
            </div>
            <div>
              <span className="text-muted-foreground">expected status</span>
              <p className="font-mono">{monitor.expectedStatus}</p>
            </div>
            <div>
              <span className="text-muted-foreground">method</span>
              <p className="font-mono">{monitor.method}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/monitors/[id]/page.tsx
git commit -m "refactor: convert monitor detail page to read-only server component"
```

---

## Task 16: Update Dashboards List Page

**Files:**
- Modify: `src/app/dashboards/page.tsx`

**Step 1: Convert to server component**

```typescript
// src/app/dashboards/page.tsx
import Link from "next/link"
import { ExternalLink, Globe, Lock, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDashboards, getMonitors, getLatestCheckResult } from "@/lib/data"

export default async function DashboardsPage() {
  const dashboards = await getDashboards()
  const monitors = await getMonitors()

  // Get status for each dashboard's monitors
  const dashboardsWithStatus = await Promise.all(
    dashboards.map(async (dashboard) => {
      const dashboardMonitors = monitors.filter((m) => dashboard.monitorIds.includes(m.id))
      const results = await Promise.all(
        dashboardMonitors.map((m) => getLatestCheckResult(m.id))
      )
      const upCount = results.filter((r) => r?.status === "up").length
      return {
        dashboard,
        monitorCount: dashboardMonitors.length,
        upCount,
      }
    })
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          <div>
            <h1 className="text-sm">dashboards</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">status pages with multiple monitors</p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          defined in <code className="bg-secondary px-1 rounded">data/dashboards/</code>
        </p>
      </div>

      {/* Dashboards List */}
      {dashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded">
          <LayoutDashboard className="h-6 w-6 text-muted-foreground mb-3" />
          <p className="text-xs text-muted-foreground mb-2">no dashboards configured</p>
          <p className="text-[10px] text-muted-foreground/70">
            add .ts files to <code className="bg-secondary px-1 rounded">data/dashboards/</code>
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {dashboardsWithStatus.map(({ dashboard, monitorCount, upCount }) => (
            <div
              key={dashboard.id}
              className="group border border-border rounded bg-card p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link href={`/dashboards/${dashboard.id}`} className="text-sm hover:text-primary transition-colors">
                    {dashboard.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    {dashboard.isPublic ? (
                      <span className="flex items-center gap-1 text-[10px] text-primary">
                        <Globe className="h-3 w-3" />
                        public
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        private
                      </span>
                    )}
                  </div>
                </div>
                {dashboard.isPublic && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    asChild
                  >
                    <Link href={`/public/${dashboard.slug}`} target="_blank">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{monitorCount} monitors</span>
                <span className="text-status-up">
                  {upCount}/{monitorCount} up
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/dashboards/page.tsx
git commit -m "refactor: convert dashboards page to server component"
```

---

## Task 17: Update Dashboard Detail Page

**Files:**
- Modify: `src/app/dashboards/[id]/page.tsx`

**Step 1: Convert to read-only server component**

```typescript
// src/app/dashboards/[id]/page.tsx
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardView } from "@/components/dashboard-view"
import { AnnouncementsList } from "@/components/announcements-list"
import { IncidentsTimeline } from "@/components/incidents-timeline"
import { MaintenanceSchedule } from "@/components/maintenance-schedule"
import { getDashboard, getMonitors } from "@/lib/data"

interface Props {
  params: Promise<{ id: string }>
}

export default async function DashboardDetailPage({ params }: Props) {
  const { id } = await params
  const dashboard = await getDashboard(id)

  if (!dashboard) {
    notFound()
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/dashboards">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-sm font-medium">{dashboard.name}</h1>
          <p className="text-muted-foreground text-[10px] font-mono">/public/{dashboard.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          {dashboard.isPublic && (
            <Button variant="outline" size="sm" asChild className="text-xs h-8 bg-transparent">
              <Link href={`/public/${dashboard.slug}`} target="_blank">
                <ExternalLink className="mr-2 h-3 w-3" />
                View Public
              </Link>
            </Button>
          )}
          <span className="text-[10px] text-muted-foreground">
            <code className="bg-secondary px-1 rounded">data/dashboards/{id}.ts</code>
          </span>
        </div>
      </div>

      <Tabs defaultValue="preview" className="space-y-6">
        <TabsList className="text-xs">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <DashboardView dashboardId={dashboard.id} />
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">All Announcements</h3>
            <span className="text-[10px] text-muted-foreground">
              from <code className="bg-secondary px-1 rounded">data/announcements/</code>
            </span>
          </div>
          <AnnouncementsList dashboardId={dashboard.id} />
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">Incident History</h3>
            <span className="text-[10px] text-muted-foreground">
              from <code className="bg-secondary px-1 rounded">data/incidents/</code>
            </span>
          </div>
          <IncidentsTimeline dashboardId={dashboard.id} />

          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">Scheduled Maintenance</h3>
            <MaintenanceSchedule dashboardId={dashboard.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/dashboards/[id]/page.tsx
git commit -m "refactor: convert dashboard detail page to read-only server component"
```

---

## Task 18: Update DashboardView Component

**Files:**
- Modify: `src/components/dashboard-view.tsx`

**Step 1: Read current implementation**

Read the file to understand its current structure.

**Step 2: Update to use server data fetching**

Convert to accept `dashboardId` prop and fetch data internally, or convert to server component. Remove any edit/delete functionality.

**Step 3: Commit**

```bash
git add src/components/dashboard-view.tsx
git commit -m "refactor: update DashboardView to use server-side data"
```

---

## Task 19: Update AnnouncementsList Component

**Files:**
- Modify: `src/components/announcements-list.tsx`

**Step 1: Read and update**

Remove `showDelete` prop and delete functionality. Convert to work with server-fetched data.

**Step 2: Commit**

```bash
git add src/components/announcements-list.tsx
git commit -m "refactor: update AnnouncementsList for read-only file-based data"
```

---

## Task 20: Update IncidentsTimeline Component

**Files:**
- Modify: `src/components/incidents-timeline.tsx`

**Step 1: Update to use server data**

Convert to accept incidents as props or fetch internally. Remove any edit functionality.

**Step 2: Commit**

```bash
git add src/components/incidents-timeline.tsx
git commit -m "refactor: update IncidentsTimeline for file-based incidents"
```

---

## Task 21: Update Public Status Page

**Files:**
- Modify: `src/app/public/[slug]/page.tsx`

**Step 1: Read current implementation and update**

Convert to server component using file-based data. Remove subscribe form.

**Step 2: Commit**

```bash
git add src/app/public/[slug]/page.tsx
git commit -m "refactor: convert public status page to server component"
```

---

## Task 22: Update Overview Page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Read and update main overview page**

Convert to server component using file-based data.

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "refactor: convert overview page to server component"
```

---

## Task 23: Clean Up Unused Store and Hooks

**Files:**
- Delete: `src/lib/store.ts`
- Modify: `src/lib/hooks.ts`

**Step 1: Remove old store**

Run: `rm src/lib/store.ts`

**Step 2: Update hooks.ts**

Keep only client-side hooks that might still be needed, or delete if fully replaced by server components.

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove old in-memory store, clean up hooks"
```

---

## Task 24: Remove Unused Gitkeep Files

**Files:**
- Delete: `data/*/.gitkeep`

**Step 1: Remove gitkeep files now that real files exist**

Run:
```bash
rm data/monitors/.gitkeep data/dashboards/.gitkeep data/announcements/.gitkeep data/incidents/.gitkeep
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove .gitkeep files"
```

---

## Task 25: Test and Verify

**Step 1: Run the development server**

Run: `bun dev`

**Step 2: Verify all pages load correctly**

- Visit `/` - Overview should show monitors from files
- Visit `/monitors` - Should list monitors from `data/monitors/`
- Visit `/monitors/production-api` - Should show monitor details
- Visit `/dashboards` - Should list dashboards from `data/dashboards/`
- Visit `/dashboards/production-status` - Should show dashboard
- Visit `/public/production` - Should show public status page

**Step 3: Verify no create/edit buttons exist**

Confirm the UI is entirely read-only.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete file-system driven architecture migration"
```

---

## Summary

This plan converts Pongo from an in-memory CRUD app to a file-system driven read-only UI:

1. **Tasks 1-2**: Setup dependencies and directory structure
2. **Tasks 3-7**: Define types and create example config files
3. **Tasks 8-10**: Create loader and data service
4. **Tasks 11-12**: Remove CRUD forms and pages
5. **Tasks 13-22**: Update all pages and components to use server-side data
6. **Tasks 23-25**: Clean up and verify
