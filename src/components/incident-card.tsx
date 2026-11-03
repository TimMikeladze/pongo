"use client";

import { format, formatDistanceStrict } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{incident.title}</span>
        <span className="mt-1 block text-xs font-normal text-muted-foreground">
          {affected.length
            ? affected.map((monitor) => monitor.name).join(", ")
            : "No affected services listed"}{" "}
          · {duration} · {formatInTimeZone(created, "UTC", "HH:mm")} UTC ·{" "}
          {incident.severity}
        </span>
      </span>
      <Badge
        variant="status"
        className="status-pill capitalize"
        data-status={status}
      >
        {incident.status}
      </Badge>
    </>
  );
  if (!showUpdates)
    return (
      <article className="flex flex-wrap items-center gap-3 border-b border-border py-4">
        {summary}
      </article>
    );
  return (
    <Collapsible
      className="group border-b border-border first:border-t"
      defaultOpen={incident.status !== "resolved"}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start whitespace-normal flex-wrap gap-3 px-1 py-4 text-left"
        >
          {summary}
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4 sm:pl-[96px]">
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
      </CollapsibleContent>
    </Collapsible>
  );
}
