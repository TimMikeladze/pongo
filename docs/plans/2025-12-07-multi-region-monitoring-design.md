# Multi-Region Monitoring Design

## Overview

Enable monitors to run from multiple geographic locations with:
- **Latency visibility** - See response times from different regions
- **Smarter alerting** - Alert based on multi-region consensus (avoid false positives from regional network issues)

## Architecture

Fully independent schedulers per region, all writing to a shared PostgreSQL database. No coordination between schedulers - each runs its own cron/interval schedule independently.

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Scheduler  │  │  Scheduler  │  │  Scheduler  │
│  us-east    │  │  eu-west    │  │  singapore  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
              ┌─────────────────┐
              │    PostgreSQL   │
              │  (shared DB)    │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │     Web UI      │
              │  (aggregated)   │
              └─────────────────┘
```

## Data Model Changes

### checkResults table

Add `region` column:

```sql
ALTER TABLE "checkResults" ADD COLUMN "region" TEXT NOT NULL DEFAULT 'default';
CREATE INDEX "checkResults_region_idx" ON "checkResults" ("region");
CREATE INDEX "checkResults_monitor_region_checkedAt_idx" ON "checkResults" ("monitorId", "region", "checkedAt" DESC);
```

### alertState table

Add `region` column to track per-region alert state:

```sql
ALTER TABLE "alertState" ADD COLUMN "region" TEXT NOT NULL DEFAULT 'default';
```

Each (monitorId, alertId, region) combo has its own firing state.

### Monitor config

Add optional `regionThreshold` to alert configs:

```typescript
alerts: [{
  type: 'downtime',
  threshold: 3,  // consecutive failures
  channels: ['webhook'],
  regionThreshold: 'majority' | 'all' | 'any' | number
}]
```

- `'any'` - fire if any region triggers (default, preserves current behavior)
- `'majority'` - fire if >50% of active regions trigger
- `'all'` - fire only if all regions trigger
- `number` (e.g., `2`) - fire if N or more regions trigger

Active regions discovered dynamically from recent check results.

## Scheduler Changes

### Environment variable

Read `PONGO_REGION` from environment:

```typescript
const region = process.env.PONGO_REGION || 'default'
```

### Logger

Include region when writing check results:

```typescript
await db.insert(checkResults).values({
  id: crypto.randomUUID(),
  monitorId,
  status: result.status,
  responseTimeMs: result.responseTime,
  statusCode: result.statusCode,
  message: result.message,
  region,  // <-- new
  checkedAt: new Date(),
})
```

### Health endpoint

Include region in `/health` response:

```json
{ "status": "ok", "region": "us-east", "uptime": 3600 }
```

## Alert Evaluator Changes

### Per-region evaluation

Each scheduler evaluates alerts for its own region after each check. Alert state is tracked per (monitorId, alertId, region).

### Global aggregation

Before dispatching a webhook, check the `regionThreshold`:

```typescript
async function shouldDispatchAlert(monitorId: string, alert: AlertConfig): Promise<boolean> {
  const threshold = alert.regionThreshold || 'any'

  // Get all regions that have reported recently (last hour)
  const activeRegions = await getActiveRegions(monitorId)

  // Get regions currently firing for this alert
  const firingRegions = await getFiringRegions(monitorId, alert.id)

  const total = activeRegions.length
  const firing = firingRegions.length

  if (threshold === 'any') return firing >= 1
  if (threshold === 'all') return firing === total
  if (threshold === 'majority') return firing > total / 2
  if (typeof threshold === 'number') return firing >= threshold

  return false
}
```

### Webhook payload

Include region breakdown:

```json
{
  "monitor": "api-health",
  "status": "down",
  "firingRegions": ["us-east", "eu-west"],
  "healthyRegions": ["singapore"],
  "message": "Down from 2 of 3 regions"
}
```

## UI Changes

### Monitor list page

- Show aggregated status: `up` if all regions up, `degraded` if some down, `down` if all down
- Badge showing "3/3 regions" or "2/3 regions up"
- Response time shows average (or worst-case) across regions

### Monitor detail page

Region breakdown table:

```
Region      Status    Latency    Last Check
us-east     Up        45ms       10s ago
eu-west     Up        120ms      8s ago
singapore   Down      --         12s ago
```

Response time chart with option for one line per region.

## Deployment

### Environment

All schedulers need:
- `PONGO_REGION` - identifier for this region (e.g., `us-east`, `eu-west`)
- `DATABASE_URL` - shared PostgreSQL connection string

### Fly.io

```bash
fly scale count scheduler=1 --region iad
fly scale count scheduler=1 --region lhr
fly scale count scheduler=1 --region sin
```

Fly.io sets `FLY_REGION` automatically. The scheduler can use this if `PONGO_REGION` is not set.

### Generic (EC2, etc.)

```bash
# us-east-1 instance
PONGO_REGION=us-east DATABASE_URL=postgres://... bun run src/scheduler/index.ts

# eu-west-1 instance
PONGO_REGION=eu-west DATABASE_URL=postgres://... bun run src/scheduler/index.ts
```

## Scripts

Add migration script in `scripts/`:
- `migrate-multi-region.ts` - Adds region columns to existing tables

## Out of Scope

- Scheduler coordination/leader election
- Per-region monitor configs (all regions run all monitors)
- Region-specific alerting channels
- Historical region comparison dashboards
