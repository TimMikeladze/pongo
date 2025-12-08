![Pongo Banner](/public/banner.png)

# Pongo Source Directory

Pongo is a self-hosted uptime monitoring and status page application built with Next.js 15, React 19, and Bun.

## Directory Structure

```
src/
├── app/          # Next.js pages, layouts, and API routes
├── archiver/     # Background service for S3 data archival
├── components/   # React UI components
├── db/           # Database schemas and connections (SQLite/PostgreSQL)
├── hooks/        # React hooks
├── lib/          # Core business logic, types, and utilities
├── scheduler/    # Background service for running monitors
└── proxy.ts      # Authentication middleware
```

## Core Modules

### `/lib` - Business Logic

The heart of Pongo's functionality.

**Configuration Types** (`config-types.ts`):
```typescript
import { monitor, channels } from "@/lib/config-types";

// Define a monitor
export default monitor({
  name: "API Health",
  interval: "30s",        // or cron: "*/5 * * * *"
  timeout: "10s",
  alerts: [{
    id: "downtime",
    name: "API Down",
    condition: { consecutiveFailures: 3 },
    channels: ["slack"],
  }],
  async handler() {
    const res = await fetch("https://api.example.com/health");
    return {
      status: res.ok ? "up" : "down",
      responseTime: Date.now() - start,
      statusCode: res.status,
    };
  },
});
```

**Data Access** (`data.ts`):
```typescript
import {
  getMonitors,
  getCheckResults,
  getUptimePercentage,
  getAverageResponseTime,
  getErrorRate
} from "@/lib/data";

// All functions are React cache-wrapped for request deduplication
const monitors = await getMonitors();
const uptime = await getUptimePercentage("api-health", "24h");
```

**Loaders** (`loader.ts`):
```typescript
import { loadMonitors, loadDashboards, loadChannels } from "@/lib/loader";

// Load from pongo/ config directory
const monitors = await loadMonitors();    // pongo/monitors/*.ts
const dashboards = await loadDashboards(); // pongo/dashboards/*.ts
const channels = await loadChannels();     // pongo/channels.ts
```

### `/db` - Database Layer

Dual-database support with Drizzle ORM.

```typescript
import { getDb, getDbAsync } from "@/db";
import { checkResults, alertState, alertEvents } from "@/db/schema";

// Sync (for server components)
const db = getDb();

// Async (for edge/serverless)
const db = await getDbAsync();

// Query with Drizzle
const results = await db.select().from(checkResults).limit(100);
```

**Tables:**
- `checkResults` - Monitor check history
- `alertState` - Current alert status per monitor/region
- `alertEvents` - Alert fired/resolved event log

Set `DB_DRIVER=sqlite` (default) or `DB_DRIVER=pg` for PostgreSQL.

### `/scheduler` - Monitor Execution Service

Standalone Bun service that runs monitors on schedule.

```bash
bun run src/scheduler/index.ts
```

**HTTP API (default port 3001):**
- `GET /health` - Health check
- `GET /monitors` - List monitors with state
- `POST /monitors/:id/trigger` - Trigger single monitor
- `POST /monitors/trigger` - Trigger all monitors

**Alert Conditions:**
```typescript
// Declarative conditions
{ consecutiveFailures: 3 }
{ consecutiveSuccesses: 2 }
{ latencyAboveMs: 1000, forChecks: 5 }
{ status: "down", forChecks: 3 }
{ downForMs: 60000 }

// Custom callback
(result, history) => history.filter(r => r.status === "down").length >= 3
```

**Multi-region Thresholds:**
```typescript
alerts: [{
  id: "global-down",
  condition: { consecutiveFailures: 2 },
  regionThreshold: "majority",  // "any" | "all" | "majority" | number
  channels: ["pagerduty"],
}]
```

### `/archiver` - Data Archival Service

Standalone Bun service that archives old check results to S3 as Parquet files.

```bash
bun run src/archiver/index.ts
```

**Environment Variables:**
```bash
ARCHIVAL_ENABLED=true
ARCHIVAL_RETENTION_DAYS=30
ARCHIVAL_CRON="0 3 * * *"
S3_BUCKET=my-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

### `/app` - Next.js Application

**Key Routes:**
- `/` - Main dashboard overview
- `/dashboards/[id]` - Individual dashboard view
- `/monitors/[id]` - Monitor detail page
- `/alerts` - Alert management
- `/settings` - Configuration
- `/public/[slug]` - Public status page (no auth)
- `/shared/[slug]` - Shared dashboard (optional auth)

**API Routes:**
- `/api/cron` - Vercel Cron endpoint for serverless monitoring

### `/components` - UI Components

Built with Radix UI primitives and Tailwind CSS.

**Status Components:**
- `status-badge` - Up/down/degraded indicator
- `uptime-bars` - Grid visualization of uptime
- `status-timeline` - Historical status changes

**Charts:**
- `response-time-chart` - P50/P95/P99 latency
- `error-rate-chart` - Error percentage over time
- `throughput-chart` - Requests per second
- `latency-percentiles-chart` - Distribution view

**Layout:**
- `app-shell` - Main navigation and layout
- `time-range-picker` - Date range selector
- `auto-refresh` - Configurable refresh interval

### `/hooks` - React Hooks

```typescript
import { useIsMobile } from "@/hooks/use-mobile";

const isMobile = useIsMobile(); // true if viewport < 768px
```

### `/proxy.ts` - Authentication Middleware

Cookie-based session authentication using iron-session.

**Public Routes (no auth):**
- `/public/*`
- `/dashboards/shared/*`
- `/login`
- `/_next/*`
- `/api/*`

Set `ACCESS_CODE` environment variable to enable authentication.

## Configuration Files

All configuration lives in the `pongo/` directory at project root:

```
pongo/
├── monitors/           # Monitor definitions (*.ts)
├── dashboards/         # Dashboard configs (*.ts)
├── announcements/      # Status announcements (*.md)
├── incidents/          # Incident reports (*.md)
└── channels.ts         # Notification channels
```

**Dashboard Config:**
```typescript
// pongo/dashboards/production.ts
export default {
  name: "Production Services",
  slug: "production",
  public: true,
  slaTarget: 99.9,
  monitors: ["api-health", "database", "cdn"],
};
```

**Announcement (Markdown + Frontmatter):**
```markdown
---
dashboard: production
title: Scheduled Maintenance
type: maintenance
expiresAt: 2025-12-08T15:00:00Z
---

Database maintenance from 2-3 PM UTC.
```

**Webhook Channels:**
```typescript
// pongo/channels.ts
import { channels } from "@/lib/config-types";

export default channels({
  slack: {
    type: "webhook",
    url: "https://hooks.slack.com/services/...",
  },
  pagerduty: {
    type: "webhook",
    url: "https://events.pagerduty.com/...",
    headers: { Authorization: "Token token=..." },
  },
});
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | - |
| `DB_DRIVER` | `sqlite` or `pg` | `sqlite` |
| `ACCESS_CODE` | UI password (optional) | - |
| `REGION` | Region identifier | `default` |
| `SCHEDULER_PORT` | Scheduler API port | `3001` |
| `SCHEDULER_MAX_CONCURRENCY` | Parallel monitors | `10` |
| `CRON_SECRET` | Vercel Cron auth token | - |

## Running Services

```bash
# Development
bun run dev           # Next.js app
bun run scheduler     # Scheduler service
bun run archiver      # Archiver service

# Production
bun run build && bun run start
```

## Types Reference

```typescript
type MonitorStatus = "up" | "down" | "degraded" | "pending";
type IncidentSeverity = "critical" | "major" | "minor" | "maintenance";
type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";

interface MonitorResult {
  status: MonitorStatus;
  responseTime?: number;
  statusCode?: number;
  message?: string;
}

interface WebhookPayload {
  event: "alert.fired" | "alert.resolved";
  alert: { id: string; name: string; monitorId: string };
  snapshot: { consecutiveFailures: number; lastStatus: string };
  checkResult: { status: string; responseTimeMs: number };
  region?: string;
  firingRegions?: string[];
  healthyRegions?: string[];
}
```
