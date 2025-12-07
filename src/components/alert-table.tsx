"use client";

import { format } from "date-fns";
import { BellOff, ChevronDown, ChevronRight, PowerOff } from "lucide-react";
import { useState } from "react";
import type { AlertOverride } from "@/db";
import type { AlertEventWithMonitor } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { AlertSeverity } from "@/scheduler/alerts/types";
import { AlertActions } from "./alert-actions";
import { AlertSeverityBadge } from "./alert-severity-badge";

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
            <th className="text-left p-2 font-medium w-8" />
          </tr>
        </thead>
        <tbody>
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
              <>
                <tr
                  key={event.id}
                  className={cn(
                    "border-t border-border hover:bg-secondary/30 cursor-pointer",
                    isFiring && "bg-red-500/5",
                    isDisabled && "opacity-50",
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
                  <td className="p-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{event.alertId}</span>
                      <AlertSeverityBadge severity={severity} />
                      {isSilenced && (
                        <BellOff className="h-3 w-3 text-muted-foreground" />
                      )}
                      {isDisabled && (
                        <PowerOff className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-muted-foreground">
                    {event.monitorName}
                  </td>
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
                    {event.resolvedAt
                      ? format(event.resolvedAt, "MMM d, h:mm a")
                      : "—"}
                  </td>
                  <td className="p-2 text-muted-foreground">
                    {isFiring
                      ? formatOngoingDuration(event.triggeredAt)
                      : formatDuration(event.duration)}
                  </td>
                  <td className="p-2">
                    <AlertActions alertId={event.alertId} override={override} />
                  </td>
                </tr>
                {isExpanded && event.snapshot && (
                  <tr key={`${event.id}-details`} className="bg-secondary/20">
                    <td />
                    <td colSpan={7} className="p-2">
                      <div className="text-[10px] text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">
                          Snapshot at trigger:
                        </p>
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
