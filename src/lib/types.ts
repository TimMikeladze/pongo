export type MonitorStatus = "up" | "down" | "degraded" | "pending";

export type IncidentStatus =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";
export type IncidentSeverity = "critical" | "major" | "minor" | "maintenance";

export interface MonitorResult {
  status: MonitorStatus;
  responseTime: number;
  message?: string;
  statusCode?: number;
}

export interface Monitor {
  id: string;
  name: string;
  intervalSeconds: number;
  cron?: string;
  timeoutMs: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonitorWithHandler extends Monitor {
  handler: () => Promise<MonitorResult>;
}

export interface CheckResult {
  id: string;
  monitorId: string;
  status: MonitorStatus;
  responseTimeMs: number;
  statusCode: number | null;
  errorMessage: string | null;
  checkedAt: string;
}

export interface Dashboard {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  monitorIds: string[];
  slaTarget?: number; // e.g., 99.9
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  dashboardId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "maintenance";
  createdAt: string;
  expiresAt?: string;
  archived?: boolean;
}

export interface IncidentUpdate {
  id: string;
  status: IncidentStatus;
  message: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  dashboardId: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedMonitorIds: string[];
  updates: IncidentUpdate[];
  createdAt: string;
  resolvedAt?: string;
  archived?: boolean;
}

export interface MaintenanceWindow {
  id: string;
  dashboardId: string;
  title: string;
  description?: string;
  affectedMonitorIds: string[];
  scheduledStart: string;
  scheduledEnd: string;
  createdAt: string;
}

export interface Subscriber {
  id: string;
  dashboardId: string;
  email: string;
  createdAt: string;
}

export interface NotificationChannel {
  id: string;
  type: "email" | "sms" | "webhook" | "slack";
  name: string;
  config: Record<string, string>;
  isActive: boolean;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  type: "alert" | "incident" | "announcement";
  title: string;
  description: string;
  link: string;
  timestamp: Date;
}
