# Alerts UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build alerts UI with firing banner, timeline view, table view, and time range filtering.

**Architecture:** Server components fetch from alert_state/alert_events tables. Client components handle view toggle. Reuses existing TimeRangePicker.

**Tech Stack:** Next.js 15, React 19, Drizzle ORM, shadcn/ui, Tailwind CSS

---

## Task 1: Add Alert Data Fetching Functions

**Files:**
- Modify: `src/lib/data.ts`

**Step 1: Add imports for alert schema**

Add at top of file after existing drizzle imports:

```typescript
import {
  alertState as sqliteAlertState,
  alertEvents as sqliteAlertEvents,
} from "@/db/schema.sqlite";
import {
  alertState as pgAlertState,
  alertEvents as pgAlertEvents,
} from "@/db/schema.pg";
```

**Step 2: Add AlertEvent type**

Add after other interfaces:

```typescript
export interface AlertEventWithMonitor {
  id: string;
  alertId: string;
  monitorId: string;
  monitorName: string;
  alertName: string;
  eventType: "fired" | "resolved";
  triggeredAt: Date;
  resolvedAt: Date | null;
  snapshot: Record<string, unknown> | null;
  duration: number | null; // milliseconds, null if still firing
}

export interface FiringAlert {
  alertId: string;
  monitorId: string;
  monitorName: string;
  alertName: string;
  lastFiredAt: Date;
  currentEventId: string | null;
}
```

**Step 3: Add getFiringAlerts function**

```typescript
export const getFiringAlerts = cache(async (): Promise<FiringAlert[]> => {
  const db = await getDbAsync();
  const driver = getDbDriver();
  const alertStateTable = driver === "pg" ? pgAlertState : sqliteAlertState;

  // biome-ignore lint/suspicious/noExplicitAny: dual-schema type union
  const rows = await (db as any)
    .select()
    .from(alertStateTable)
    .where(eq(alertStateTable.status, "firing"));

  const monitors = await getMonitors();
  const monitorMap = new Map(monitors.map((m) => [m.id, m.name]));

  // biome-ignore lint/suspicious/noExplicitAny: dual-schema type
  return rows.map((row: any) => ({
    alertId: row.alertId,
    monitorId: row.monitorId,
    monitorName: monitorMap.get(row.monitorId) || row.monitorId,
    alertName: row.alertId, // Will be enhanced when we have alert names in state
    lastFiredAt: row.lastFiredAt instanceof Date ? row.lastFiredAt : new Date(row.lastFiredAt),
    currentEventId: row.currentEventId,
  }));
});
```

**Step 4: Add getAlertEvents function**

```typescript
export const getAlertEvents = cache(
  async (timeRange: TimeRange): Promise<AlertEventWithMonitor[]> => {
    const db = await getDbAsync();
    const driver = getDbDriver();
    const alertEventsTable = driver === "pg" ? pgAlertEvents : sqliteAlertEvents;

    // biome-ignore lint/suspicious/noExplicitAny: dual-schema type union
    const rows = await (db as any)
      .select()
      .from(alertEventsTable)
      .where(
        and(
          gte(alertEventsTable.triggeredAt, timeRange.from),
          lte(alertEventsTable.triggeredAt, timeRange.to)
        )
      )
      .orderBy(desc(alertEventsTable.triggeredAt));

    const monitors = await getMonitors();
    const monitorMap = new Map(monitors.map((m) => [m.id, m.name]));

    // biome-ignore lint/suspicious/noExplicitAny: dual-schema type
    return rows.map((row: any) => {
      const triggeredAt = row.triggeredAt instanceof Date ? row.triggeredAt : new Date(row.triggeredAt);
      const resolvedAt = row.resolvedAt
        ? (row.resolvedAt instanceof Date ? row.resolvedAt : new Date(row.resolvedAt))
        : null;

      return {
        id: row.id,
        alertId: row.alertId,
        monitorId: row.monitorId,
        monitorName: monitorMap.get(row.monitorId) || row.monitorId,
        alertName: row.alertId,
        eventType: row.eventType,
        triggeredAt,
        resolvedAt,
        snapshot: row.snapshot,
        duration: resolvedAt ? resolvedAt.getTime() - triggeredAt.getTime() : null,
      };
    });
  }
);
```

**Step 5: Verify it compiles**

Run: `bunx tsc --noEmit --skipLibCheck`
Expected: No new errors

**Step 6: Commit**

```bash
git add src/lib/data.ts
git commit -m "feat(alerts-ui): add alert data fetching functions"
```

---

## Task 2: Create Alert Banner Component

**Files:**
- Create: `src/components/alert-banner.tsx`

**Step 1: Create the banner component**

```typescript
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { FiringAlert } from "@/lib/data";

interface AlertBannerProps {
  firingAlerts: FiringAlert[];
}

export function AlertBanner({ firingAlerts }: AlertBannerProps) {
  if (firingAlerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-500 font-medium">
            {firingAlerts.length} alert{firingAlerts.length > 1 ? "s" : ""} currently firing
          </span>
        </div>
        <Link
          href="#firing"
          className="text-xs text-red-500 hover:text-red-400 transition-colors"
        >
          View
        </Link>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {firingAlerts.slice(0, 3).map((alert) => (
          <span
            key={alert.alertId}
            className="text-[10px] px-2 py-0.5 bg-red-500/20 rounded text-red-500"
          >
            {alert.alertId}
          </span>
        ))}
        {firingAlerts.length > 3 && (
          <span className="text-[10px] text-red-500/70">
            +{firingAlerts.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/alert-banner.tsx
git commit -m "feat(alerts-ui): add alert banner component"
```

---

## Task 3: Create Alert Timeline Component

**Files:**
- Create: `src/components/alert-timeline.tsx`

**Step 1: Create the timeline component**

```typescript
import { formatDistanceToNow, format } from "date-fns";
import { Bell, CheckCircle } from "lucide-react";
import type { AlertEventWithMonitor } from "@/lib/data";

interface AlertTimelineProps {
  events: AlertEventWithMonitor[];
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function formatSnapshot(snapshot: Record<string, unknown> | null): string {
  if (!snapshot) return "";
  if (snapshot.consecutiveFailures) {
    return `${snapshot.consecutiveFailures} consecutive failures`;
  }
  if (snapshot.lastResponseTimeMs) {
    return `latency: ${snapshot.lastResponseTimeMs}ms`;
  }
  if (snapshot.lastMessage) {
    return String(snapshot.lastMessage);
  }
  return "";
}

export function AlertTimeline({ events }: AlertTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded">
        <Bell className="h-6 w-6 text-muted-foreground mb-3" />
        <p className="text-xs text-muted-foreground">
          no alert activity in this time range
        </p>
      </div>
    );
  }

  // Group events by alertId to show fired/resolved pairs
  const groupedEvents = events.reduce((acc, event) => {
    const key = event.alertId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(event);
    return acc;
  }, {} as Record<string, AlertEventWithMonitor[]>);

  return (
    <div className="space-y-3">
      {Object.entries(groupedEvents).map(([alertId, alertEvents]) => {
        const latestEvent = alertEvents[0];
        const isFiring = latestEvent.eventType === "fired" && !latestEvent.resolvedAt;

        return (
          <div
            key={`${alertId}-${latestEvent.id}`}
            className="border border-border rounded bg-card p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{alertId}</span>
                  {isFiring && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded">
                      FIRING
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {latestEvent.monitorName}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {alertEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-start gap-2 text-[10px]">
                  {event.eventType === "fired" ? (
                    <span className="text-red-500 mt-0.5">●</span>
                  ) : (
                    <span className="text-green-500 mt-0.5">●</span>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={event.eventType === "fired" ? "text-red-500" : "text-green-500"}>
                        {event.eventType === "fired" ? "Fired" : "Resolved"}
                      </span>
                      <span className="text-muted-foreground">
                        {format(event.triggeredAt, "MMM d, h:mm a")}
                      </span>
                      {event.duration && (
                        <span className="text-muted-foreground">
                          duration: {formatDuration(event.duration)}
                        </span>
                      )}
                    </div>
                    {event.eventType === "fired" && event.snapshot && (
                      <p className="text-muted-foreground mt-0.5">
                        {formatSnapshot(event.snapshot)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {!latestEvent.resolvedAt && latestEvent.eventType === "fired" && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="text-yellow-500 mt-0.5">●</span>
                  <span>ongoing... ({formatDistanceToNow(latestEvent.triggeredAt)})</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/alert-timeline.tsx
git commit -m "feat(alerts-ui): add alert timeline component"
```

---

## Task 4: Create Alert Table Component

**Files:**
- Create: `src/components/alert-table.tsx`

**Step 1: Create the table component**

```typescript
"use client";

import { format } from "date-fns";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AlertEventWithMonitor } from "@/lib/data";
import { cn } from "@/lib/utils";

interface AlertTableProps {
  events: AlertEventWithMonitor[];
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function formatOngoingDuration(triggeredAt: Date): string {
  const ms = Date.now() - triggeredAt.getTime();
  return formatDuration(ms) + "+";
}

export function AlertTable({ events }: AlertTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No alert events in this time range
      </div>
    );
  }

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedRows(next);
  };

  return (
    <div className="border border-border rounded overflow-hidden">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="bg-secondary/50 text-muted-foreground">
            <th className="text-left p-2 font-medium w-8" />
            <th className="text-left p-2 font-medium">Alert</th>
            <th className="text-left p-2 font-medium">Monitor</th>
            <th className="text-left p-2 font-medium">Status</th>
            <th className="text-left p-2 font-medium">Triggered</th>
            <th className="text-left p-2 font-medium">Resolved</th>
            <th className="text-left p-2 font-medium">Duration</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const isFiring = event.eventType === "fired" && !event.resolvedAt;
            const isExpanded = expandedRows.has(event.id);

            return (
              <>
                <tr
                  key={event.id}
                  className={cn(
                    "border-t border-border hover:bg-secondary/30 cursor-pointer",
                    isFiring && "bg-red-500/5"
                  )}
                  onClick={() => toggleRow(event.id)}
                >
                  <td className="p-2">
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </td>
                  <td className="p-2 font-medium">{event.alertId}</td>
                  <td className="p-2 text-muted-foreground">{event.monitorName}</td>
                  <td className="p-2">
                    {isFiring ? (
                      <span className="text-red-500 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        Firing
                      </span>
                    ) : (
                      <span className="text-green-500 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Resolved
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-muted-foreground">
                    {format(event.triggeredAt, "MMM d, h:mm a")}
                  </td>
                  <td className="p-2 text-muted-foreground">
                    {event.resolvedAt ? format(event.resolvedAt, "MMM d, h:mm a") : "—"}
                  </td>
                  <td className="p-2 text-muted-foreground">
                    {isFiring ? formatOngoingDuration(event.triggeredAt) : formatDuration(event.duration)}
                  </td>
                </tr>
                {isExpanded && event.snapshot && (
                  <tr key={`${event.id}-details`} className="bg-secondary/20">
                    <td />
                    <td colSpan={6} className="p-2">
                      <div className="text-[10px] text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">Snapshot at trigger:</p>
                        <pre className="bg-secondary/50 p-2 rounded overflow-auto">
                          {JSON.stringify(event.snapshot, null, 2)}
                        </pre>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/alert-table.tsx
git commit -m "feat(alerts-ui): add alert table component"
```

---

## Task 5: Create View Toggle Component

**Files:**
- Create: `src/components/alert-view-toggle.tsx`

**Step 1: Create the toggle component**

```typescript
"use client";

import { useQueryState } from "nuqs";
import { List, Table } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertView = "timeline" | "table";

export function AlertViewToggle() {
  const [view, setView] = useQueryState("view", {
    defaultValue: "timeline" as AlertView,
    parse: (v) => (v === "table" ? "table" : "timeline") as AlertView,
  });

  return (
    <div className="flex items-center border border-border rounded overflow-hidden">
      <button
        type="button"
        onClick={() => setView("timeline")}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 text-[10px]",
          view === "timeline"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        <List className="h-3 w-3" />
        Timeline
      </button>
      <button
        type="button"
        onClick={() => setView("table")}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 text-[10px]",
          view === "table"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        <Table className="h-3 w-3" />
        Table
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/alert-view-toggle.tsx
git commit -m "feat(alerts-ui): add alert view toggle component"
```

---

## Task 6: Create Alerts Content Component

**Files:**
- Create: `src/components/alerts-content.tsx`

**Step 1: Create the content component (client component that switches views)**

```typescript
"use client";

import { useQueryState } from "nuqs";
import { AlertTimeline } from "./alert-timeline";
import { AlertTable } from "./alert-table";
import type { AlertEventWithMonitor } from "@/lib/data";

interface AlertsContentProps {
  events: AlertEventWithMonitor[];
}

export function AlertsContent({ events }: AlertsContentProps) {
  const [view] = useQueryState("view", {
    defaultValue: "timeline",
    parse: (v) => (v === "table" ? "table" : "timeline"),
  });

  if (view === "table") {
    return <AlertTable events={events} />;
  }

  return <AlertTimeline events={events} />;
}
```

**Step 2: Commit**

```bash
git add src/components/alerts-content.tsx
git commit -m "feat(alerts-ui): add alerts content component"
```

---

## Task 7: Update Notifications Page

**Files:**
- Modify: `src/app/settings/notifications/page.tsx`

**Step 1: Rewrite the page**

```typescript
import { Bell } from "lucide-react";
import { Suspense } from "react";
import { AlertBanner } from "@/components/alert-banner";
import { AlertViewToggle } from "@/components/alert-view-toggle";
import { AlertsContent } from "@/components/alerts-content";
import { TimeRangePicker } from "@/components/time-range-picker";
import { getAlertEvents, getFiringAlerts } from "@/lib/data";
import { getTimeRange, timeRangeCache } from "@/lib/time-range";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { preset, from, to } = timeRangeCache.parse(params);
  const timeRange = getTimeRange({ preset, from, to });

  const [firingAlerts, events] = await Promise.all([
    getFiringAlerts(),
    getAlertEvents(timeRange),
  ]);

  return (
    <div>
      {/* Firing alerts banner */}
      <AlertBanner firingAlerts={firingAlerts} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <div className="flex items-center gap-3">
          <Bell className="h-4 w-4 text-primary" />
          <div>
            <h1 className="text-sm">alerts</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              alert history
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Suspense>
            <AlertViewToggle />
          </Suspense>
          <TimeRangePicker />
        </div>
      </div>

      {/* Content */}
      <Suspense
        fallback={
          <div className="text-center py-8 text-sm text-muted-foreground">
            Loading alerts...
          </div>
        }
      >
        <AlertsContent events={events} />
      </Suspense>
    </div>
  );
}
```

**Step 2: Verify it builds**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/settings/notifications/page.tsx
git commit -m "feat(alerts-ui): update notifications page with alert views"
```

---

## Task 8: Test the UI

**Step 1: Start dev server**

Run: `bun run dev`

**Step 2: Navigate to alerts page**

Open: http://localhost:3000/settings/notifications

**Step 3: Verify:**
- Page loads without errors
- Time range picker works
- View toggle switches between timeline and table
- Empty state shows if no alerts

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(alerts-ui): address any UI issues"
```

---

## Summary

After completing all tasks:

**New files created:**
- `src/components/alert-banner.tsx`
- `src/components/alert-timeline.tsx`
- `src/components/alert-table.tsx`
- `src/components/alert-view-toggle.tsx`
- `src/components/alerts-content.tsx`

**Files modified:**
- `src/lib/data.ts` - Added alert data fetching functions
- `src/app/settings/notifications/page.tsx` - Complete rewrite with alert UI
