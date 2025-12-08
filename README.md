<h1 align="center">
  <img src="public/banner.png" alt="Pongo" width="50" height="50" style="vertical-align: middle; border-radius: 50%;" />
  Pongo.sh
</h1>
<p align="center">
  <strong>Self-hosted uptime monitoring and status pages</strong><br/>
  <sub>Built with Next.js 15, React 19, and Bun</sub>
</p>
<p align="center">
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#architecture">Architecture</a>
</p>

---

Define monitors, organize dashboards, manage alerts through webhooks, and serve public or private status pages with multi-region monitoring support.

## Features

- **Multi-region monitoring** with intelligent alert thresholds (any, all, majority, or specific count)
- **Flexible scheduling** via interval (`30s`, `5m`) or cron expressions
- **Database agnostic** backend (SQLite for dev/self-hosted, PostgreSQL for scale)
- **Webhook-based alerting** with customizable channels
- **Long-term data archival** to S3 as Parquet files
- **Public/private status pages** with RSS/Atom feeds
- **Modern React UI** with dark mode, responsive design, and rich charts

## Getting Started

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Configuration

All user configuration lives in the `pongo/` directory:

```
pongo/
├── monitors/           # Monitor definitions (*.ts)
├── dashboards/         # Dashboard configs (*.ts)
├── announcements/      # Status announcements (*.md)
├── incidents/          # Incident reports (*.md)
└── channels.ts         # Webhook notification channels
```

## Architecture

### `/src/app` - Next.js Application

Frontend and API routes using Next.js 15 App Router.

| Route | Purpose |
|-------|---------|
| `/` | Main dashboard overview |
| `/dashboards/[id]` | Individual dashboard view |
| `/dashboards/shared/[slug]` | Public shared dashboard with RSS feeds |
| `/monitors/[id]` | Monitor detail page with analytics |
| `/alerts` | Alert management and history |
| `/settings` | Application configuration |
| `/public/[slug]` | Public status pages (no auth required) |
| `/api/cron` | Vercel Cron endpoint for serverless monitoring |

### `/src/scheduler` - Monitor Execution Service

Standalone Bun service that runs monitors on schedule and evaluates alerts.

- **scheduler.ts** - Core orchestration using Croner
- **runner.ts** - Executes monitor handlers with timeout management
- **server.ts** - HTTP API server (port 3001)
- **alerts/** - Alert condition evaluation and webhook dispatching

### `/src/archiver` - Data Archival Service

Archives old check results to S3 as Parquet files.

- Configurable retention period (default 30 days)
- Batch processing with partitioned storage (year/month/day)
- Cron-based scheduling (default: 3 AM UTC)

### `/src/db` - Database Layer

Dual-database support using Drizzle ORM.

- `DB_DRIVER=sqlite` for SQLite (WAL mode enabled)
- `DB_DRIVER=pg` for PostgreSQL

**Tables:** `checkResults`, `alertState`, `alertEvents`

### `/src/lib` - Core Business Logic

- **config-types.ts** - Monitor, dashboard, announcement, and channel interfaces
- **data.ts** - Data access layer with React cache wrapping
- **loader.ts** - Loads configs from `pongo/` directory
- **types.ts** - Core type definitions
- **feed.ts** - RSS/Atom feed generation

### `/src/components` - React UI Components

47 components using Radix UI primitives and Tailwind CSS.

**Status & Charts:** `status-badge`, `uptime-bars`, `response-time-chart`, `error-rate-chart`, `sparkline`

**Dashboard:** `dashboard-view`, `monitor-card`, `monitor-response-chart`

**Alerts:** `alert-table`, `alert-timeline`, `alert-banner`, `incident-card`

### `/src/hooks` - React Hooks

- **use-mobile.ts** - Viewport breakpoint detection

### `/src/proxy.ts` - Authentication Middleware

Cookie-based session authentication using iron-session. Set `ACCESS_CODE` env var to enable authentication.

Public routes bypass auth: `/public/*`, `/dashboards/shared/*`, `/login`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_DRIVER` | Database driver (`sqlite` or `pg`) |
| `ACCESS_CODE` | Enable authentication with this code |
| `EXPIRY_DAYS` | Session TTL (default: 7) |
| `SCHEDULER_MAX_CONCURRENCY` | Max concurrent monitor executions |
| `PONGO_REGION` | Region identifier for multi-region setups |

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS, Radix UI
- **Runtime:** Bun
- **ORM:** Drizzle
- **Scheduling:** Croner
- **Auth:** iron-session
- **Charts:** Recharts
