<h1 align="center">
  <img src="/banner.png" alt="Pongo" width="50" height="50" style="vertical-align: middle; border-radius: 50%;" />
  Pongo.sh
</h1>
<p align="center">
  <strong>Self-hosted uptime monitoring and status pages</strong><br/>
  <sub>Built with Next.js 15, React 19, and Bun</sub>
</p>

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https://github.com/TimMikeladze/pongo&env=DATABASE_URL,CRON_SECRET&project-name=pongo&repository-name=pongo">
    <img src="https://vercel.com/button" alt="Deploy with Vercel"/>
  </a>
  <a href="https://fly.io/launch?org=personal">
    <img src="https://fly.io/static/images/launch-button.svg" alt="Launch on Fly.io" height="32px"/>
  </a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#features">Features</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#architecture">Architecture</a>
</p>

---

Define monitors, organize dashboards, manage alerts through webhooks, and serve public or private status pages with multi-region monitoring support.

## Quick Start

Choose your deployment method:

### Local Development

```bash
git clone https://github.com/TimMikeladze/pongo.git
cd pongo
bun install
bun dev
```

Visit http://localhost:3000 to view the dashboard.

### Deploy to Vercel (TypeScript monitors only)

1. Click the "Deploy with Vercel" button above
2. Set environment variables:
   - `DATABASE_URL` - Your database connection string
   - `CRON_SECRET` - Generate with `openssl rand -base64 32`
3. Deploy and access your status page

**Note:** Vercel deployment uses serverless cron. For custom scheduling, deploy the scheduler separately (see [Deployment Guide](#deployment)).

### Deploy to Fly.io (Full support)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Launch your app
fly launch

# Set secrets
fly secrets set DATABASE_URL="your-database-url"
fly secrets set ACCESS_CODE="your-access-code"

# Deploy
fly deploy
```

Fly.io supports persistent VMs with multi-region deployment using the included Dockerfile.

## Features

- **Multi-region monitoring** with intelligent alert thresholds (any, all, majority, or specific count)
- **Flexible scheduling** via interval (`30s`, `5m`) or cron expressions
- **Database agnostic** backend (SQLite for dev/self-hosted, PostgreSQL for scale)
- **Webhook-based alerting** with customizable channels
- **Long-term data archival** to S3 as Parquet files
- **Public/private status pages** with RSS/Atom feeds
- **Modern React UI** with dark mode, responsive design, and rich charts

## Deployment

Pongo offers flexible deployment options to match your infrastructure needs.

### Deployment Decision Matrix

| Scenario | Dashboard | Scheduler | Best For |
|----------|-----------|-----------|----------|
| **Vercel Only** | Vercel | Vercel Cron | Serverless, auto-scaling |
| **Fly.io** | Fly.io | Fly.io | Persistent VMs, multi-region |
| **Hybrid** | Vercel | VPS/Docker | Global dashboard + flexible monitoring |
| **Self-Hosted** | VPS/Docker | VPS/Docker | Complete control, on-premises |

### Option 1: Vercel (Serverless)

**Pros:** Zero server management, global CDN, auto-scaling
**Cons:** Cron runs every 15 minutes minimum
**Best for:** Simple monitoring setups

1. Click "Deploy with Vercel" button above
2. Connect your GitHub repository
3. Configure environment variables:
   ```bash
   DATABASE_URL=your-postgres-or-turso-url
   CRON_SECRET=$(openssl rand -base64 32)
   ACCESS_CODE=your-dashboard-password
   ```
4. Deploy

The built-in `/api/cron` endpoint runs every 15 minutes via Vercel Cron.

### Option 2: Fly.io (Persistent VMs)

**Pros:** Persistent VMs, multi-region deployment, flexible scheduling
**Cons:** Requires Fly.io account
**Best for:** Production deployments with custom intervals

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Clone and navigate
git clone https://github.com/TimMikeladze/pongo.git
cd pongo

# Launch (creates fly.toml)
fly launch

# Configure secrets
fly secrets set DATABASE_URL="postgres://..."
fly secrets set ACCESS_CODE="your-password"

# Deploy
fly deploy
```

### Option 3: Hybrid (Vercel Dashboard + VPS Scheduler)

**Pros:** Fast global dashboard with flexible scheduling
**Cons:** Requires managing a VPS
**Best for:** Best of both worlds

**Dashboard on Vercel:**
```bash
# Deploy to Vercel (no cron configuration)
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add ACCESS_CODE
```

**Scheduler on VPS/Docker:**
```bash
# On your VPS
git clone https://github.com/TimMikeladze/pongo.git
cd pongo
bun install

# Set environment variables
export DATABASE_URL="your-shared-database-url"
export PONGO_REGION="us-east"

# Run scheduler
bun scheduler
```

Both connect to the same database - scheduler writes results, dashboard displays them.

### Option 4: Docker (Self-Hosted)

**Pros:** Complete control, runs anywhere
**Cons:** You manage infrastructure
**Best for:** On-premises, complete control

```bash
# Clone repository
git clone https://github.com/TimMikeladze/pongo.git
cd pongo

# Build image
docker build -t pongo .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="sqlite:///app/pongo/pongo.db" \
  -e ACCESS_CODE="your-password" \
  pongo
```

For production, use Docker Compose with PostgreSQL:

```yaml
# docker-compose.yml
version: '3.8'
services:
  pongo:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:password@db:5432/pongo
      ACCESS_CODE: your-password
    depends_on:
      - db

  scheduler:
    build: .
    command: ["bun", "scheduler"]
    environment:
      DATABASE_URL: postgres://postgres:password@db:5432/pongo
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: pongo
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

### Database Options

Pongo supports multiple database backends:

**SQLite** (Development/Small deployments)
```bash
DATABASE_URL=file:./pongo/pongo.db
```

**PostgreSQL** (Production)
```bash
DATABASE_URL=postgres://user:pass@host:5432/pongo
```

**Turso** (Serverless SQLite)
```bash
DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
```

## Getting Started (Local Development)

```bash
# Clone repository
git clone https://github.com/TimMikeladze/pongo.git
cd pongo

# Install dependencies
bun install

# Start development server
bun dev

# In another terminal, start scheduler (optional)
bun scheduler
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

### Writing Monitors

Create TypeScript monitors in the `pongo/monitors/` directory:

```typescript
// pongo/monitors/example.ts
import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "Example API",
  interval: "15m",
  timeout: "30s",

  async handler() {
    const start = Date.now();
    const res = await fetch("https://api.example.com/health");
    const responseTime = Date.now() - start;

    return {
      status: res.ok ? "up" : "down",
      responseTime,
      statusCode: res.status,
    };
  },
});
```

See `pongo/monitors/README.md` for detailed monitor examples and patterns.

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

## Deployment Architecture

Pongo's scheduler can be deployed anywhere - it's a standalone service that only needs database connectivity and an HTTP endpoint.

### Flexible Deployment Model

The scheduler is completely decoupled from the Next.js application:

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   Database   │◀────│   Scheduler(s)  │
│  (Dashboard UI) │     │ (SQLite/PG)  │     │ (Monitor Runner)│
└─────────────────┘     └──────────────┘     └─────────────────┘
         │                                             ▲
         │                                             │
         └─────────────────────────────────────────────┘
              HTTP API (optional manual runs)
```

### Key Principles

1. **Database as Source of Truth**
   - All components read/write to the same database
   - Dashboard reads check results
   - Scheduler writes check results
   - No direct communication needed between services

2. **Deploy Anywhere**
   - Scheduler runs as a Bun process (`bun scheduler`)
   - Can run on any platform: VPS, Docker, Kubernetes, serverless
   - Multiple schedulers can run simultaneously (multi-region)

3. **HTTP API (Optional)**
   - Scheduler exposes HTTP API on port 3001
   - Used only for manual monitor runs from dashboard
   - Set `SCHEDULER_URL=http://scheduler-host:3001` to enable

### Deployment Scenarios

#### Serverless (Vercel/Netlify)

Use the built-in `/api/cron` endpoint instead of running a scheduler:

```bash
# Vercel cron calls /api/cron every minute
# Set CRON_SECRET for authentication
# No separate scheduler needed
```

#### Single Server

Run everything on one machine:

```bash
# Terminal 1: Next.js app
bun dev

# Terminal 2: Scheduler
bun scheduler

# Terminal 3: Archiver (optional)
bun archiver
```

#### Multi-Region

Deploy schedulers in different regions for geographic redundancy:

```bash
# Region 1 (us-east)
PONGO_REGION=us-east bun scheduler

# Region 2 (eu-west)
PONGO_REGION=eu-west bun scheduler

# All write to the same database
# Configure alerts to trigger based on region thresholds
```

#### Docker/Kubernetes

```yaml
# Separate pods/containers
services:
  app:
    image: pongo-app
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://...

  scheduler:
    image: pongo-scheduler
    ports: ["3001:3001"]
    environment:
      DATABASE_URL: postgres://...
      PONGO_REGION: us-east-1
```

#### Managed Database + Edge Schedulers

```bash
# Shared PostgreSQL/Turso database
DATABASE_URL=postgres://shared-db.example.com/pongo

# Deploy schedulers in multiple locations
# All write check results to the same database
# Dashboard can be deployed anywhere with database access
```

### Requirements

For the scheduler to work, you only need:

1. **Database access** - Read/write to `checkResults`, `alertState`, `alertEvents` tables
2. **Outbound HTTP** - Ability to make requests to monitored endpoints
3. **Environment variables** - Same config as the Next.js app (`DATABASE_URL`, etc.)

That's it. No message queues, no service mesh, no complex orchestration.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_DRIVER` | Database driver (`sqlite` or `pg`) |
| `DATABASE_URL` | Database connection string |
| `ACCESS_CODE` | Enable authentication with this code |
| `EXPIRY_DAYS` | Session TTL (default: 7) |
| `CRON_SECRET` | Secret for authenticating serverless cron requests |
| `SCHEDULER_MAX_CONCURRENCY` | Max concurrent monitor executions |
| `PONGO_REGION` | Region identifier for multi-region setups |

### Generating Secrets

For `CRON_SECRET` and other sensitive values, generate secure random strings:

```bash
# Generate a secure random secret (32 bytes, base64 encoded)
openssl rand -base64 32

# Example output: Kx8f2vJ9mN4pQ7rT6wY1zA3bC5dE8gH0iL2kM4nP6qR=
```

Copy the output and set it in your environment:

```bash
# Local development (.env.local)
CRON_SECRET=Kx8f2vJ9mN4pQ7rT6wY1zA3bC5dE8gH0iL2kM4nP6qR=

# Vercel deployment
vercel env add CRON_SECRET
# Paste the generated secret when prompted
```

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS, Radix UI
- **Runtime:** Bun
- **ORM:** Drizzle
- **Scheduling:** Croner
- **Auth:** iron-session
- **Charts:** Recharts
