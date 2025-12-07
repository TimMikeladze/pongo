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
