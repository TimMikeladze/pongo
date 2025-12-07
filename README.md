<p align="center">
  <a href="https://pongo.sh">
    <img src="https://pongo.sh/opengraph-image" alt="pongo.sh - Self-hosted uptime monitoring" width="600" />
  </a>
</p>
<p align="center">
  <strong>Self-hosted uptime monitoring and status pages — configured entirely in TypeScript</strong><br/>
  <sub>Next.js &middot; React &middot; Bun &middot; Drizzle ORM &middot; SQLite/PostgreSQL</sub>
</p>

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https://github.com/TimMikeladze/pongo&env=DATABASE_URL,CRON_SECRET&project-name=pongo&repository-name=pongo">
    <img src="https://vercel.com/button" alt="Deploy with Vercel"/>
  </a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#monitors">Monitors</a> &middot;
  <a href="#alerts">Alerts</a> &middot;
  <a href="#dashboards">Dashboards</a> &middot;
  <a href="#deployment">Deployment</a>
</p>

---

Define monitors, dashboards, alerts, incidents, and announcements as TypeScript files and Markdown — version-controlled alongside your code. No UI forms. Just code.

- ⚡ Uptime monitoring with configurable intervals and cron schedules
- 📊 Public status pages with RSS and Atom feeds
- 📉 Response time charts, uptime bars, and latency percentiles
- 📈 SLA tracking and status distribution
- 🕐 Incident timelines and announcements
- 🗄️ S3 archival to Parquet with day-based partitioning
- 🔔 Smart alerting with flap detection and auto-resolve
- 🌍 Multi-region monitoring with region-aware alert thresholds

## Quick Start

```bash
git clone https://github.com/TimMikeladze/pongo.git
cd pongo
cp .env.example .env        # configure environment variables
bun install
bun run db:sqlite:migrate   # create tables
bun dev
```

Open http://localhost:3000.

pongo.sh uses SQLite by default, but you can use PostgreSQL instead by setting the `DATABASE_URL` environment variable:

```bash
# .env
DATABASE_URL=postgres://user:password@localhost:5432/pongo
```

Then run the PostgreSQL migration and start the dev server:

```bash
bun run db:pg:migrate
bun dev
```

The database driver is auto-detected from the connection string. See the [Database](#database) section for all supported backends.

Start the scheduler in a second terminal:

```bash
bun scheduler
```

## Project Structure

```
pongo/                   # Your configuration (version-controlled)
├── monitors/            # Monitor definitions (*.ts)
├── dashboards/          # Dashboard configs (*.ts)
├── channels.ts          # Webhook notification channels
├── announcements/       # Status announcements (*.md)
└── incidents/           # Incident reports (*.md)

src/
├── app/                 # Next.js App Router
├── scheduler/           # Standalone monitor runner (Hono HTTP API)
├── archiver/            # S3 data archival service
├── components/          # React UI (Radix UI + Tailwind + Recharts)
├── db/                  # Drizzle ORM schema (SQLite/PostgreSQL)
├── lib/                 # Core business logic, types, loaders
└── proxy.ts             # iron-session auth middleware
```

## Monitors

Create TypeScript files in `pongo/monitors/`. Each exports a `monitor()` config.

### HTTP health check

```typescript
// pongo/monitors/api.ts
import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "API Health",
  interval: "5m",
  timeout: "30s",

  async handler() {
    const start = Date.now();
    const res = await fetch("https://api.example.com/health");
    return {
      status: res.ok ? "up" : "down",
      responseTime: Date.now() - start,
      statusCode: res.status,
    };
  },
});
```

### Latency thresholds

```typescript
export default monitor({
  name: "Latency Sensitive",
  interval: "1m",
  timeout: "10s",

  async handler() {
    const start = Date.now();
    const res = await fetch("https://api.example.com");
    const responseTime = Date.now() - start;
    return {
      status: !res.ok ? "down" : responseTime > 2000 ? "degraded" : "up",
      responseTime,
      statusCode: res.status,
    };
  },
});
```

### Statuspage API integration

```typescript
export default monitor({
  name: "Vercel Status",
  interval: "15m",
  timeout: "30s",

  async handler() {
    const start = Date.now();
    const res = await fetch("https://www.vercelstatus.com/api/v2/status.json");
    const data = await res.json() as { status: { indicator: string } };
    const indicator = data.status.indicator;
    return {
      status: indicator === "none" ? "up" : indicator === "minor" ? "degraded" : "down",
      responseTime: Date.now() - start,
      statusCode: res.status,
    };
  },
});
```

Register monitors in `pongo/monitors/index.ts`:

```typescript
import api from "./api";
import vercel from "./vercel";
export default { api, vercel };
```

### Handler return values

| Field | Type | Required | Description |
|---|---|---|---|
| `status` | `"up" \| "down" \| "degraded"` | yes | Current service status |
| `responseTime` | `number` | yes | Milliseconds |
| `statusCode` | `number` | no | HTTP status code |
| `message` | `string` | no | Additional context |

### Scheduling

```typescript
interval: "30s"           // every 30 seconds
interval: "5m"            // every 5 minutes
interval: "1h"            // every hour
interval: "*/5 * * * *"  // cron expression
```

## Alerts

Attach alerts to any monitor. Alerts evaluate conditions, fire webhooks to channels, and auto-resolve.

```typescript
export default monitor({
  name: "API",
  interval: "1m",
  alerts: [
    {
      id: "api-down",
      name: "API Down",
      condition: { consecutiveFailures: 3 },
      channels: ["slack"],
      severity: "critical",             // "critical" | "warning" | "info"
      regionThreshold: "majority",      // "any" | "all" | "majority" | number
      escalateAfterMs: 300_000,         // re-notify after 5 min if still firing
    },
  ],
  async handler() { /* ... */ },
});
```

### Conditions

**Declarative:**

```typescript
{ consecutiveFailures: 3 }
{ consecutiveSuccesses: 2 }
{ latencyAboveMs: 1000, forChecks: 5 }
{ status: "down", forChecks: 3 }
{ downForMs: 60000 }
{ upForMs: 30000 }
```

**Callback** — full access to check history:

```typescript
condition: (result, history) =>
  history.filter(r => r.status === "down").length >= 3
```

### Flap detection

If an alert toggles 3+ times in 10 minutes, notifications are suppressed until the state stabilizes.

### Alert silencing

Silence alerts from the dashboard UI or programmatically via `silenceAlert(alertId, until)` / `unsilenceAlert(alertId)`.

### Webhook payload

```typescript
{
  event: "alert.fired" | "alert.resolved",
  alert: { id, name, monitorId, monitorName, severity },
  timestamp: string,                // ISO 8601
  snapshot: {
    consecutiveFailures: number,
    consecutiveSuccesses: number,
    lastStatus: string,
    lastResponseTimeMs: number | null,
    lastMessage: string | null,
  },
  checkResult: { id, status, responseTimeMs, message, checkedAt },
  region?: string,
  firingRegions?: string[],
  healthyRegions?: string[],
}
```

Webhooks retry with exponential backoff on failure.

## Channels

Define webhook endpoints in `pongo/channels.ts`:

```typescript
import { channels } from "../src/lib/config-types";

export default channels({
  slack: {
    type: "webhook",
    url: process.env.SLACK_WEBHOOK_URL!,
  },
  pagerduty: {
    type: "webhook",
    url: "https://events.pagerduty.com/v2/enqueue",
    headers: { Authorization: "Token token=..." },
  },
});
```

## Dashboards

Define dashboards in `pongo/dashboards/`. Group monitors, set SLA targets, and optionally expose as public status pages.

```typescript
// pongo/dashboards/production.ts
import type { DashboardConfig } from "@/lib/config-types";

export default {
  name: "Production",
  slug: "production",
  public: true,
  slaTarget: 99.9,
  monitors: ["api", "database", "cdn"],
} satisfies DashboardConfig;
```

Register in `pongo/dashboards/index.ts`:

```typescript
import production from "./production";
export default { production };
```

### Status pages

Public dashboards are accessible without authentication. Each includes:

- Response time, uptime, and error rate charts
- Latency percentiles (P50, P95, P99)
- Uptime bars and status distribution
- Incident timeline and announcements
- RSS (`/shared/[slug]/feed.xml`) and Atom (`/shared/[slug]/feed.atom`) feeds

### Announcements

Markdown files in `pongo/announcements/`:

```markdown
---
dashboard: production
title: Scheduled Maintenance
type: maintenance
expiresAt: 2025-12-08T15:00:00Z
---

Database maintenance from 2-3 PM UTC.
```

### Incidents

Markdown files in `pongo/incidents/`:

```markdown
---
title: Payment Gateway Outage
severity: critical
status: resolved
startedAt: 2025-12-01T10:00:00Z
resolvedAt: 2025-12-01T11:30:00Z
---

Root cause: upstream provider network partition.
```

### Routes

| Route | Description |
|---|---|
| `/` | Overview dashboard |
| `/monitors` | Monitor list with filters |
| `/alerts` | Alert management and history |
| `/dashboards/[id]` | Dashboard detail (monitors, incidents, announcements) |
| `/shared/[slug]` | Public status page (no auth) |
| `/shared/[slug]/feed.xml` | RSS feed |
| `/shared/[slug]/feed.atom` | Atom feed |
| `/settings` | Application settings |
| `/api/status.json` | System status JSON |
| `/api/cron` | Vercel cron endpoint |

## Deployment

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Next.js App   │────>│   Database   │<────│  Scheduler(s)   │
│  (Dashboard UI) │     │ (SQLite/PG)  │     │ (Monitor Runner) │
└─────────────────┘     └──────────────┘     └─────────────────┘
```

All services share one database. No message queues or service mesh required.

| Scenario | Dashboard | Scheduler | Best for |
|---|---|---|---|
| **Vercel** | Vercel | Vercel Cron | Serverless, auto-scaling |
| **Fly.io** | Fly.io | Fly.io | Persistent VMs, multi-region |
| **Hybrid** | Vercel | VPS/Docker | Global CDN + flexible scheduling |
| **Self-hosted** | Docker | Docker | Full control |

### Vercel

1. Click "Deploy with Vercel" above
2. Set `DATABASE_URL` and `CRON_SECRET` (`openssl rand -base64 32`)

### Fly.io

```bash
fly launch
fly secrets set DATABASE_URL="postgres://..." ACCESS_CODE="secret"
fly deploy
```

The included `Dockerfile` and `fly.toml` handle everything. The Docker entrypoint auto-starts the scheduler and archiver when `SCHEDULER_ENABLED=true` and `ARCHIVAL_ENABLED=true`.

### Docker Compose

```yaml
services:
  pongo:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://postgres:password@db:5432/pongo
      ACCESS_CODE: your-password
    depends_on: [db]

  scheduler:
    build: .
    command: ["bun", "scheduler"]
    environment:
      DATABASE_URL: postgres://postgres:password@db:5432/pongo
    depends_on: [db]

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: pongo
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Multi-region

Deploy schedulers in different regions pointing at the same database:

```bash
PONGO_REGION=us-east bun scheduler   # Region 1
PONGO_REGION=eu-west bun scheduler   # Region 2
```

Configure `regionThreshold` on alerts to control when they fire across regions.

## Scheduler

Standalone Bun process. Runs monitors on schedule, evaluates alert conditions, dispatches webhooks with retry logic.

```bash
bun scheduler
```

**HTTP API** (default port 3001):

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check with region info |
| `/monitors` | GET | List monitors with state |
| `/monitors/:id` | GET | Single monitor state |
| `/monitors/:id/trigger` | POST | Trigger single monitor |
| `/monitors/trigger` | POST | Trigger all monitors |

Retries failed checks with exponential backoff (configurable via `SCHEDULER_MAX_RETRIES`, `SCHEDULER_RETRY_DELAY_MS`).

## Archiver

Archives old check results to S3 as Parquet files with day-based partitioning (`year=YYYY/month=MM/day=DD/`).

```bash
bun archiver
```

Configure with `ARCHIVAL_RETENTION_DAYS` (default 30), `ARCHIVAL_CRON` (default `0 3 * * *`), `ARCHIVAL_BATCH_SIZE` (default 10000).

## Database

Auto-detected from `DATABASE_URL`:

| Backend | `DATABASE_URL` | Notes |
|---|---|---|
| SQLite | `file:./pongo/pongo.db` (default) | WAL mode, zero config |
| PostgreSQL | `postgres://user:pass@host:5432/pongo` | Production recommended |

Migrations run automatically on build. Manual:

```bash
bun run db:pg:migrate     # PostgreSQL
bun run db:sqlite:migrate # SQLite
bun run db:pg:studio      # Open Drizzle Studio
```

## Authentication

By default, the dashboard is open to anyone who can reach it. To password-protect it, set the `ACCESS_CODE` environment variable:

```bash
# .env or your hosting provider's environment settings
ACCESS_CODE=your-secret-password
```

When `ACCESS_CODE` is set:

- All dashboard routes require authentication
- Visitors are redirected to `/login` and must enter the access code
- Sessions are stored as encrypted cookies (iron-session) and last 7 days by default
- Adjust session duration with `EXPIRY_DAYS`

**Public routes** (always accessible, even with auth enabled): `/`, `/shared/*`, `/login`, `/api/*`

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | Database connection string | `file:./pongo/pongo.db` |
| `DB_DRIVER` | `sqlite` or `pg` (auto-detected) | `sqlite` |
| `ACCESS_CODE` | Dashboard login password | - (no auth) |
| `EXPIRY_DAYS` | Session TTL in days | `7` |
| `PONGO_REGION` | Region identifier | `default` |
| `SCHEDULER_PORT` | Scheduler API port | `3001` |
| `SCHEDULER_MAX_CONCURRENCY` | Parallel monitor executions | `10` |
| `SCHEDULER_MAX_RETRIES` | Retries on check failure | `3` |
| `SCHEDULER_RETRY_DELAY_MS` | Base retry delay (ms) | `5000` |
| `SCHEDULER_URL` | Scheduler URL (enables manual runs from UI) | - |
| `SCHEDULER_ENABLED` | Auto-start scheduler in Docker | `false` |
| `ENABLE_MANUAL_RUN` | Show manual run button in dashboard | `false` |
| `CRON_SECRET` | Auth token for Vercel cron endpoint | - |
| `ARCHIVAL_ENABLED` | Enable data archival | `false` |
| `ARCHIVAL_RETENTION_DAYS` | Days before archiving | `30` |
| `ARCHIVAL_CRON` | Archival schedule | `0 3 * * *` |
| `ARCHIVAL_BATCH_SIZE` | Rows per batch | `10000` |
| `ARCHIVAL_LOCAL_PATH` | Local archive path | `./archives` |
| `ARCHIVER_PORT` | Archiver API port | `3002` |
| `S3_BUCKET` | S3 bucket for archives | - |
| `S3_REGION` | S3 region | - |
| `S3_ACCESS_KEY_ID` | S3 access key | - |
| `S3_SECRET_ACCESS_KEY` | S3 secret key | - |
| `S3_PREFIX` | S3 key prefix | - |
| `NEXT_PUBLIC_URL` | Public URL for SEO/metadata | - |

## Scripts

| Command | Description |
|---|---|
| `bun dev` | Start Next.js dev server |
| `bun run build` | Build for production (auto-runs migrations) |
| `bun start` | Start production server |
| `bun scheduler` | Start scheduler service |
| `bun archiver` | Start archiver service |
| `bun test` | Run tests |
| `bun test:watch` | Run tests in watch mode |
| `bun run lint` | Lint with Biome |
| `bun run lint:fix` | Lint and auto-fix |
| `bun run check` | Lint + typecheck + test |
| `bun run db:pg:studio` | Open Drizzle Studio (PostgreSQL) |
| `bun run db:sqlite:studio` | Open Drizzle Studio (SQLite) |

## Tech Stack

Next.js, React, Bun, Drizzle ORM, Tailwind CSS, Radix UI, Recharts, Croner, Hono, iron-session, Zod, Biome.
