import { NextResponse } from "next/server";
import {
  getActiveIncidents,
  getFiringAlerts,
  getLatestCheckResult,
  getMonitors,
} from "@/lib/data";
import type { IncidentSeverity, MonitorStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type StatusIndicator = "none" | "minor" | "major" | "critical";

interface StatusResponse {
  page: {
    id: string;
    name: string;
    url: string;
    time_zone: string;
    updated_at: string;
  };
  status: {
    indicator: StatusIndicator;
    description: string;
  };
}

function getIndicatorFromIncidentSeverity(
  severity: IncidentSeverity,
): StatusIndicator {
  switch (severity) {
    case "critical":
      return "critical";
    case "major":
      return "major";
    case "minor":
    case "maintenance":
      return "minor";
    default:
      return "none";
  }
}

function getIndicatorFromMonitorStatus(status: MonitorStatus): StatusIndicator {
  switch (status) {
    case "down":
      return "major";
    case "degraded":
      return "minor";
    default:
      return "none";
  }
}

function getWorstIndicator(indicators: StatusIndicator[]): StatusIndicator {
  const priority: Record<StatusIndicator, number> = {
    critical: 3,
    major: 2,
    minor: 1,
    none: 0,
  };

  let worst: StatusIndicator = "none";
  for (const indicator of indicators) {
    if (priority[indicator] > priority[worst]) {
      worst = indicator;
    }
  }
  return worst;
}

function getDescription(indicator: StatusIndicator): string {
  switch (indicator) {
    case "critical":
      return "Critical System Outage";
    case "major":
      return "Major Service Outage";
    case "minor":
      return "Minor Service Outage";
    default:
      return "All Systems Operational";
  }
}

export async function GET(request: Request) {
  const indicators: StatusIndicator[] = [];

  // Check active incidents
  const activeIncidents = await getActiveIncidents();
  for (const incident of activeIncidents) {
    indicators.push(getIndicatorFromIncidentSeverity(incident.severity));
  }

  // Check firing alerts
  const firingAlerts = await getFiringAlerts();
  if (firingAlerts.length > 0) {
    // Firing alerts indicate at least minor issues
    indicators.push("minor");
  }

  // Check latest monitor statuses
  const monitors = await getMonitors();
  for (const monitor of monitors) {
    if (!monitor.isActive) continue;
    const latest = await getLatestCheckResult(monitor.id);
    if (latest) {
      indicators.push(getIndicatorFromMonitorStatus(latest.status));
    }
  }

  const indicator = getWorstIndicator(indicators);
  const description = getDescription(indicator);

  // Get base URL from request
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const response: StatusResponse = {
    page: {
      id: "pongo",
      name: "pongo.sh",
      url: baseUrl,
      time_zone: "Etc/UTC",
      updated_at: new Date().toISOString(),
    },
    status: {
      indicator,
      description,
    },
  };

  return NextResponse.json(response);
}
