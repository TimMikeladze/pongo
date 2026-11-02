"use client";

import { format, formatDistanceStrict } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronDown } from "lucide-react";
import type { Incident, Monitor } from "@/lib/types";

interface IncidentCardProps {
  incident: Incident;
  monitors: Monitor[];
  showUpdates?: boolean;
}

export function IncidentCard({
  incident,
  monitors,
  showUpdates = true,
}: IncidentCardProps) {
  const affected = monitors.filter((monitor) =>
    incident.affectedMonitorIds.includes(monitor.id),
  );
  const created = new Date(incident.createdAt);
  const duration = incident.resolvedAt
    ? formatDistanceStrict(created, new Date(incident.resolvedAt))
    : "Ongoing";
  const status =
    incident.status === "resolved"
      ? "up"
      : incident.severity === "critical" || incident.severity === "major"
        ? "down"
        : "degraded";
  const summary = (
    <>
      <time
        dateTime={incident.createdAt}
        className="w-full text-xs text-muted-foreground sm:w-20 sm:shrink-0"
      >
        {formatInTimeZone(created, "UTC", "MMM d, yyyy")}
      </time>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium">{incident.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {affected.length
            ? affected.map((monitor) => monitor.name).join(", ")
            : "No affected services listed"}{" "}
          · {duration} · {formatInTimeZone(created, "UTC", "HH:mm")} UTC ·{" "}
          {incident.severity}
        </p>
      </div>
      <span className="status-pill capitalize" data-status={status}>
        {incident.status}
      </span>
    </>
  );
  if (!showUpdates)
    return (
      <article className="flex flex-wrap items-center gap-3 border-b border-border py-4">
        {summary}
      </article>
    );
  return (
    <details
      className="group border-b border-border first:border-t"
      open={incident.status !== "resolved"}
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 rounded-md px-1 py-4 hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
        {summary}
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-4 sm:pl-[96px]">
        {incident.updates.length ? (
          incident.updates.map((update) => (
            <div
              key={update.id}
              className="grid gap-2 border-t border-border py-3 sm:grid-cols-[140px_1fr]"
            >
              <time
                dateTime={update.createdAt}
                className="text-xs text-muted-foreground"
              >
                {formatInTimeZone(
                  new Date(update.createdAt),
                  "UTC",
                  "MMM d, HH:mm",
                )}{" "}
                UTC
                <br />
                {format(new Date(update.createdAt), "HH:mm")} local
              </time>
              <div>
                <p className="text-xs font-medium capitalize">
                  {update.status}
                </p>
                <p className="mt-1 max-w-prose whitespace-pre-wrap text-sm text-muted-foreground">
                  {update.message}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No updates posted yet.
          </p>
        )}
      </div>
    </details>
  );
}
