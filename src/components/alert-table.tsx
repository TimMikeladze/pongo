/* biome-ignore-all lint/a11y/noRedundantRoles: Explicit roles preserve table semantics when mobile rows use grid. */

"use client";

import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { BellOff, ChevronDown, ChevronRight, PowerOff } from "lucide-react";
import Link from "next/link";
import { Fragment, useState } from "react";
import type { AlertOverride } from "@/db";
import type { AlertEventWithMonitor } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { AlertSeverity } from "@/scheduler/alerts/types";
import { AlertActions } from "./alert-actions";
import { AlertSeverityBadge } from "./alert-severity-badge";
import { EmptyState } from "./page-layout";

interface AlertTableProps {
  events: AlertEventWithMonitor[];
  overrides?: Record<string, AlertOverride>;
  alertSeverities?: Record<string, AlertSeverity>;
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
  return `${formatDuration(ms)}+`;
}

export function AlertTable({
  events,
  overrides = {},
  alertSeverities = {},
}: AlertTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  if (events.length === 0) {
    return (
      <EmptyState
        title="No alert events in this time range"
        description="Select a wider range to review previous alert activity."
      />
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
    <div className="panel overflow-x-auto alert-table-container">
      <table className="data-table alert-table w-full text-xs" role="table">
        <caption className="sr-only">
          Alert events, monitor, state, trigger time, resolution, and duration
        </caption>
        <thead role="rowgroup">
          <tr className="bg-secondary/50 text-muted-foreground" role="row">
            <th scope="col" className="text-left px-3 py-3 font-medium w-10">
              <span className="sr-only">Snapshot</span>
            </th>
            <th scope="col" className="text-left px-3 py-3 font-medium">
              Alert
            </th>
            <th scope="col" className="text-left px-3 py-3 font-medium">
              Monitor
            </th>
            <th scope="col" className="text-left px-3 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="text-left px-3 py-3 font-medium">
              Triggered
            </th>
            <th scope="col" className="text-left px-3 py-3 font-medium">
              Resolved
            </th>
            <th scope="col" className="text-left px-3 py-3 font-medium">
              Duration
            </th>
            <th scope="col" className="text-left px-3 py-3 font-medium w-10">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {events.map((event) => {
            const isFiring = event.eventType === "fired" && !event.resolvedAt;
            const isExpanded = expandedRows.has(event.id);
            const override = overrides[event.alertId];
            const severity = alertSeverities[event.alertId] ?? "warning";
            const isSilenced =
              override?.silencedUntil &&
              new Date(override.silencedUntil) > new Date();
            const isDisabled = override?.disabled;

            return (
              <Fragment key={event.id}>
                <tr
                  role="row"
                  className={cn(
                    "alert-event-row border-t border-border hover:bg-secondary/30",
                    isFiring && "bg-red-500/5",
                  )}
                >
                  <td
                    role="cell"
                    className="alert-snapshot-toggle"
                    data-empty={!event.snapshot}
                  >
                    {event.snapshot ? (
                      <button
                        type="button"
                        className="alert-snapshot-button flex items-center justify-center rounded hover:bg-secondary"
                        aria-label={`${isExpanded ? "Hide" : "Show"} snapshot for ${event.alertName}`}
                        aria-expanded={isExpanded}
                        aria-controls={`alert-snapshot-${event.id}`}
                        onClick={() => toggleRow(event.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="alert-snapshot-label">
                          {isExpanded ? "Hide snapshot" : "Show snapshot"}
                        </span>
                      </button>
                    ) : null}
                  </td>
                  <td role="cell" className="alert-name">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">
                        {event.alertName || event.alertId}
                      </span>
                      <AlertSeverityBadge severity={severity} />
                      {isSilenced && (
                        <BellOff
                          className="h-3.5 w-3.5 text-muted-foreground"
                          aria-label="Silenced"
                        />
                      )}
                      {isDisabled && (
                        <PowerOff
                          className="h-3.5 w-3.5 text-muted-foreground"
                          aria-label="Disabled"
                        />
                      )}
                    </div>
                  </td>
                  <td
                    role="cell"
                    className="alert-monitor text-muted-foreground"
                    data-label="Monitor"
                  >
                    <Link
                      href={`/monitors/${encodeURIComponent(event.monitorId)}`}
                      className="text-foreground underline-offset-4 hover:underline"
                    >
                      {event.monitorName}
                    </Link>
                  </td>
                  <td role="cell" className="alert-state" data-label="Status">
                    {isFiring ? (
                      <span className="text-red-700 dark:text-red-400 flex items-center gap-1">
                        Firing
                      </span>
                    ) : (
                      <span className="text-green-700 dark:text-green-400 flex items-center gap-1">
                        Resolved
                      </span>
                    )}
                  </td>
                  <td
                    role="cell"
                    className="alert-triggered text-muted-foreground"
                    data-label="Triggered"
                  >
                    <span
                      title={`Local ${format(event.triggeredAt, "MMM d, h:mm a")}`}
                    >
                      {formatInTimeZone(
                        event.triggeredAt,
                        "UTC",
                        "MMM d, h:mm a",
                      )}{" "}
                      UTC
                    </span>
                    <br />
                    <span className="text-muted-foreground">
                      {format(event.triggeredAt, "h:mm a")} Local
                    </span>
                  </td>
                  <td
                    role="cell"
                    className="alert-resolved text-muted-foreground"
                    data-label="Resolved"
                    data-empty={!event.resolvedAt}
                  >
                    {event.resolvedAt ? (
                      <>
                        <span
                          title={`Local ${format(event.resolvedAt, "MMM d, h:mm a")}`}
                        >
                          {formatInTimeZone(
                            event.resolvedAt,
                            "UTC",
                            "MMM d, h:mm a",
                          )}{" "}
                          UTC
                        </span>
                        <br />
                        <span className="text-muted-foreground">
                          {format(event.resolvedAt, "h:mm a")} Local
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    role="cell"
                    className="alert-duration text-muted-foreground"
                    data-label="Duration"
                  >
                    {isFiring
                      ? formatOngoingDuration(event.triggeredAt)
                      : formatDuration(event.duration)}
                  </td>
                  <td role="cell" className="alert-actions">
                    <AlertActions alertId={event.alertId} override={override} />
                  </td>
                </tr>
                {isExpanded && event.snapshot && (
                  <tr
                    role="row"
                    id={`alert-snapshot-${event.id}`}
                    className="alert-snapshot-row bg-secondary/20"
                  >
                    <td role="cell" className="alert-snapshot-spacer" />
                    <td
                      role="cell"
                      colSpan={7}
                      className="alert-snapshot-content"
                    >
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">
                          Snapshot at trigger:
                        </p>
                        <pre className="bg-secondary/50 px-3 py-3 rounded overflow-auto">
                          {JSON.stringify(event.snapshot, null, 2)}
                        </pre>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
