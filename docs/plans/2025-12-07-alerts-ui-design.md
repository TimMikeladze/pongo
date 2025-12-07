# Alerts UI Design

## Overview

Add UI to display alert history, current firing alerts, and alert event details. Channels are code-defined and not shown in UI.

## Page Layout

Location: `/settings/notifications` (`src/app/settings/notifications/page.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│ 🔴 2 alerts currently firing                    [View] │  ← Conditional banner
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ alerts                                                  │
│ alert history                     [Timeline ▾] [24h ▾] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Timeline view OR Table view                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Banner:** Red/destructive style, only visible when alerts are firing. Hidden when all clear.

**Time Range:** Reuses existing `TimeRangeSelector` component.

**View Toggle:** Switch between Timeline and Table views.

## Timeline View

Groups alert events by incident (fired → resolved pairs):

```
┌─────────────────────────────────────────────────────────┐
│ ● github-down                                           │
│   GitHub is down                                        │
│   ├─ 🔴 Fired    Dec 7, 2:30 PM   3 consecutive fails  │
│   └─ 🟢 Resolved Dec 7, 2:45 PM   duration: 15m        │
├─────────────────────────────────────────────────────────┤
│ ● api-down                                    [FIRING]  │
│   API is down                                           │
│   └─ 🔴 Fired    Dec 7, 3:00 PM   5 consecutive fails  │
│       ongoing...                                        │
└─────────────────────────────────────────────────────────┘
```

Each card shows:
- Alert ID and name
- Fired timestamp + snapshot context
- Resolved timestamp + duration (if resolved)
- "FIRING" badge if still active

## Table View

Sortable columns for dense data view:

| Alert | Monitor | Status | Triggered | Resolved | Duration |
|-------|---------|--------|-----------|----------|----------|
| GitHub is down | github | Resolved | Dec 7, 2:30 PM | Dec 7, 2:45 PM | 15m |
| API is down | api | Firing | Dec 7, 3:00 PM | — | 45m+ |

Features:
- Sortable by any column
- Firing alerts highlighted
- Click row to expand snapshot details

## Data Fetching

Server Component pattern matching existing `src/lib/data.ts`:

```typescript
export const getFiringAlerts = cache(async () => {
  const db = await getDbAsync();
  return db.select()
    .from(alertState)
    .where(eq(alertState.status, "firing"));
});

export const getAlertEvents = cache(async (timeRange: TimeRange) => {
  const db = await getDbAsync();
  return db.select()
    .from(alertEvents)
    .where(between(alertEvents.triggeredAt, timeRange.from, timeRange.to))
    .orderBy(desc(alertEvents.triggeredAt));
});
```

## Components

- `AlertBanner` - Conditional firing alerts banner
- `AlertTimeline` - Timeline view of events
- `AlertTable` - Table view of events
- `AlertEventCard` - Individual event card in timeline

## Empty State

"No alert activity in this time range"
