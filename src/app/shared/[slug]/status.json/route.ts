import { NextResponse } from "next/server";
import {
  getActiveIncidents,
  getDashboardBySlug,
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

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);

  if (!dashboard || !dashboard.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const indicators: StatusIndicator[] = [];

  // Check active incidents for this dashboard
  const activeIncidents = await getActiveIncidents(dashboard.id);
  for (const incident of activeIncidents) {
    indicators.push(getIndicatorFromIncidentSeverity(incident.severity));
  }

  // Check latest monitor statuses for this dashboard's monitors
  const allMonitors = await getMonitors();
  const dashboardMonitors = allMonitors.filter((m) =>
    dashboard.monitorIds.includes(m.id),
  );

  for (const monitor of dashboardMonitors) {
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
      id: dashboard.id,
      name: dashboard.name,
      url: `${baseUrl}/shared/${slug}`,
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
