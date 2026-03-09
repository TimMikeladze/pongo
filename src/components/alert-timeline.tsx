import { format, formatDistanceToNow } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Bell, BellOff, PowerOff } from "lucide-react";
import type { AlertOverride } from "@/db";
import type { AlertEventWithMonitor } from "@/lib/data";
import type { AlertSeverity } from "@/scheduler/alerts/types";
import { AlertActions } from "./alert-actions";
import { AlertSeverityBadge } from "./alert-severity-badge";

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
  if (snapshot.lastResponseTimeMs) {
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
      <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded">
        <Bell className="h-6 w-6 text-muted-foreground mb-3" />
        <p className="text-xs text-muted-foreground">
          no alert activity in this time range
        </p>
      </div>
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
          <div
            key={`${alertId}-${latestEvent.id}`}
            className="border border-border rounded bg-card p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{alertId}</span>
                  <AlertSeverityBadge severity={severity} />
                  {isFiring && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-700 dark:text-red-400 rounded">
                      FIRING
                    </span>
                  )}
                  {isSilenced && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded flex items-center gap-1">
                      <BellOff className="h-2.5 w-2.5" />
                      silenced
                    </span>
                  )}
                  {isDisabled && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded flex items-center gap-1">
                      <PowerOff className="h-2.5 w-2.5" />
                      disabled
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {latestEvent.monitorName}
                </p>
              </div>
              <AlertActions alertId={alertId} override={override} />
            </div>

            <div className="mt-3 space-y-2">
              {alertEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-2 text-[10px]"
                >
                  {event.eventType === "fired" ? (
                    <span className="text-red-700 dark:text-red-400 mt-0.5">
                      ●
                    </span>
                  ) : (
                    <span className="text-green-700 dark:text-green-400 mt-0.5">
                      ●
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
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
                  <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">
                    ●
                  </span>
                  <span>
                    ongoing... ({formatDistanceToNow(latestEvent.triggeredAt)})
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
