# Alert System Design

## Overview

Add alerting support to Pongo monitors. Alerts are defined inline with monitors, evaluated after every check, and can trigger webhooks. Alert state persists to the database for incident tracking and debugging.

## Alert Definition

Alerts are defined in the `alerts` array within each monitor:

```typescript
import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "GitHub Status",
  interval: "1m",

  alerts: [
    // Declarative: fires after 3 consecutive failures
    {
      id: "github-down",
      name: "GitHub is down",
      condition: { consecutiveFailures: 3 },
      channels: ["ops-team"]
    },

    // Declarative: fires when latency exceeds threshold
    {
      id: "github-slow",
      name: "GitHub is slow",
      condition: { latencyAboveMs: 2000, forChecks: 2 },
      channels: ["ops-team"]
    },

    // Callback: full custom logic
    {
      id: "github-degraded-pattern",
      name: "GitHub degradation pattern",
      condition: (result, history) => {
        const recent = history.slice(0, 5);
        const degradedCount = recent.filter(r => r.status === "degraded").length;
        return degradedCount >= 3;
      },
      channels: ["ops-team"]
    }
  ],

  async handler() {
    // ... existing handler
  }
});
```

## Declarative Condition Types

```typescript
type AlertCondition =
  // Consecutive failure threshold
  | { consecutiveFailures: number }

  // Consecutive successes (for recovery alerts)
  | { consecutiveSuccesses: number }

  // Latency threshold (must exceed for N checks)
  | { latencyAboveMs: number; forChecks?: number }

  // Status matches for N consecutive checks
  | { status: "down" | "degraded"; forChecks?: number }

  // Time-window based (down for X duration)
  | { downForMs: number }

  // Time-window recovery (up for X duration)
  | { upForMs: number }

  // Custom callback
  | ((result: CheckResult, history: CheckResult[]) => boolean);
```

**Defaults:**
- `forChecks` defaults to 1 (immediate)
- History passed to callbacks is last 20 checks

**Recovery:** Automatic when condition no longer matches.

**Suppression:** Fire once, suppress until recovered. One "down" alert, one "up" alert per incident.

## Database Schema

### `pongo_alert_events`

Immutable log of all alert activity:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `alert_id` | TEXT | e.g., "github-down" |
| `monitor_id` | TEXT | Which monitor triggered it |
| `event_type` | ENUM | "fired" \| "resolved" |
| `triggered_at` | TIMESTAMP | When the event occurred |
| `resolved_at` | TIMESTAMP | Null until resolved |
| `snapshot` | JSON | State at trigger time |
| `trigger_check_id` | UUID | FK to check_result that triggered |
| `resolve_check_id` | UUID | FK to check_result that resolved |

### `pongo_alert_state`

Current state of each alert:

| Column | Type | Description |
|--------|------|-------------|
| `alert_id` | TEXT | Primary key |
| `monitor_id` | TEXT | Which monitor owns it |
| `status` | ENUM | "ok" \| "firing" |
| `last_fired_at` | TIMESTAMP | When it last fired |
| `last_resolved_at` | TIMESTAMP | When it last resolved |
| `current_event_id` | UUID | FK to active event (null if ok) |

## Alert Evaluation Flow

After every monitor check:

```
1. Monitor executes → CheckResult saved to DB

2. For each alert defined on that monitor:
   ├─ Load current alert state (ok/firing)
   ├─ Fetch recent check history (last N results)
   ├─ Evaluate condition:
   │   ├─ Declarative: match against history
   │   └─ Callback: call with (result, history)
   │
   ├─ If condition=true AND state=ok:
   │   ├─ Create alert_event (type=fired)
   │   ├─ Update alert_state to firing
   │   ├─ Build snapshot
   │   └─ Dispatch to channels (webhooks)
   │
   └─ If condition=false AND state=firing:
       ├─ Update alert_event (set resolved_at, resolve_check_id)
       ├─ Update alert_state to ok
       └─ Dispatch recovery to channels
```

## Webhook Channels

Channels are defined in `pongo/channels.ts`:

```typescript
import { channels } from "../src/lib/config-types";

export default channels({
  "ops-team": {
    type: "webhook",
    url: process.env.OPS_WEBHOOK_URL!,
    headers: { "X-Source": "pongo" },
  },

  "on-call": {
    type: "webhook",
    url: process.env.PAGERDUTY_WEBHOOK_URL!,
  },
});
```

### Webhook Payload

```typescript
{
  event: "alert.fired" | "alert.resolved",
  alert: {
    id: "github-down",
    name: "GitHub is down",
    monitorId: "github",
    monitorName: "GitHub Status",
  },
  timestamp: "2025-12-07T10:30:00Z",
  snapshot: {
    consecutiveFailures: 3,
    lastStatus: "down",
    lastResponseTimeMs: null,
    lastMessage: "Connection timeout",
  },
  checkResult: {
    id: "uuid",
    status: "down",
    responseTimeMs: null,
    message: "Connection timeout",
    checkedAt: "2025-12-07T10:30:00Z",
  }
}
```

## File Structure

```
pongo/
├── monitors/
│   ├── github.ts        # add alerts array
│   └── example.ts       # add alerts array
├── channels.ts          # NEW: webhook channel definitions
└── dashboards/

src/
├── lib/
│   ├── config-types.ts  # add alert types, channels() helper
│   └── loader.ts        # add channel loading
├── db/
│   ├── schema.sqlite.ts # add alert_events, alert_state tables
│   └── schema.pg.ts     # same
├── scheduler/
│   ├── scheduler.ts     # call alert evaluator after each check
│   ├── alerts/
│   │   ├── evaluator.ts # NEW: evaluate conditions against history
│   │   ├── conditions.ts# NEW: declarative condition matchers
│   │   ├── dispatcher.ts# NEW: send to webhook channels
│   │   └── types.ts     # NEW: alert-specific types
```
