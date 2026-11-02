import { format, formatDistanceToNow } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { BellOff, Circle, PowerOff } from "lucide-react";
import Link from "next/link";
import type { AlertOverride } from "@/db";
import type { AlertEventWithMonitor } from "@/lib/data";
import type { AlertSeverity } from "@/scheduler/alerts/types";
import { AlertActions } from "./alert-actions";
import { AlertSeverityBadge } from "./alert-severity-badge";
import { EmptyState } from "./page-layout";

interface AlertTimelineProps {
  events: AlertEventWithMonitor[];
  overrides?: Record<string, AlertOverride>;
  alertSeverities?: Record<string, AlertSeverity>;
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
  if (
    snapshot.lastResponseTimeMs !== null &&
    snapshot.lastResponseTimeMs !== undefined
  ) {
    return `latency: ${snapshot.lastResponseTimeMs}ms`;
  }
  if (snapshot.lastMessage) {
    return String(snapshot.lastMessage);
  }
  return "";
}

export function AlertTimeline({
  events,
  overrides = {},
  alertSeverities = {},
}: AlertTimelineProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="No alert activity in this time range"
        description="Alert events appear here when a configured rule fires or resolves."
      />
    );
  }

  // Group events by alertId to show fired/resolved pairs
  const groupedEvents = events.reduce(
    (acc, event) => {
      const key = event.alertId;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(event);
      return acc;
    },
    {} as Record<string, AlertEventWithMonitor[]>,
  );

  return (
    <div className="space-y-3">
      {Object.entries(groupedEvents).map(([alertId, alertEvents]) => {
        const latestEvent = alertEvents[0];
        const isFiring =
          latestEvent.eventType === "fired" && !latestEvent.resolvedAt;
        const override = overrides[alertId];
        const severity = alertSeverities[alertId] ?? "warning";
        const isSilenced =
          override?.silencedUntil &&
          new Date(override.silencedUntil) > new Date();
        const isDisabled = override?.disabled;

        return (
          <div key={`${alertId}-${latestEvent.id}`} className="panel p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">
                    {latestEvent.alertName || alertId}
                  </span>
                  <AlertSeverityBadge severity={severity} />
                  {isFiring && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-500/10 text-red-700 dark:text-red-400 rounded">
                      Firing
                    </span>
                  )}
                  {isSilenced && (
                    <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded flex items-center gap-1">
                      <BellOff className="h-2.5 w-2.5" />
                      silenced
                    </span>
                  )}
                  {isDisabled && (
                    <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded flex items-center gap-1">
                      <PowerOff className="h-2.5 w-2.5" />
                      disabled
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <Link
                    href={`/monitors/${encodeURIComponent(latestEvent.monitorId)}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {latestEvent.monitorName}
                  </Link>
                </p>
              </div>
              <AlertActions alertId={alertId} override={override} />
            </div>

            <div className="mt-3 space-y-2">
              {alertEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-start gap-2 text-xs">
                  {event.eventType === "fired" ? (
                    <span className="text-red-700 dark:text-red-400 mt-0.5">
                      <Circle
                        className="h-2 w-2 fill-current"
                        aria-hidden="true"
                      />
                    </span>
                  ) : (
                    <span className="text-green-700 dark:text-green-400 mt-0.5">
                      <Circle
                        className="h-2 w-2 fill-current"
                        aria-hidden="true"
                      />
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          event.eventType === "fired"
                            ? "text-red-700 dark:text-red-400"
                            : "text-green-700 dark:text-green-400"
                        }
                      >
                        {event.eventType === "fired" ? "Fired" : "Resolved"}
                      </span>
                      <span className="text-muted-foreground">
                        {formatInTimeZone(
                          event.triggeredAt,
                          "UTC",
                          "MMM d, h:mm a",
                        )}{" "}
                        UTC
                        {" · "}
                        {format(event.triggeredAt, "h:mm a")} Local
                      </span>
                      {event.duration !== null && (
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">
                    <Circle
                      className="h-2 w-2 fill-current"
                      aria-hidden="true"
                    />
                  </span>
                  <span>
                    Ongoing ({formatDistanceToNow(latestEvent.triggeredAt)})
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
