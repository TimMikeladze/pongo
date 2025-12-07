"use client";

import { useQueryState } from "nuqs";
import type { AlertOverride } from "@/db";
import type { AlertEventWithMonitor } from "@/lib/data";
import type { AlertSeverity } from "@/scheduler/alerts/types";
import { AlertTable } from "./alert-table";
import { AlertTimeline } from "./alert-timeline";

interface AlertsContentProps {
  events: AlertEventWithMonitor[];
  overrides?: Record<string, AlertOverride>;
  alertSeverities?: Record<string, AlertSeverity>;
}

export function AlertsContent({
  events,
  overrides,
  alertSeverities,
}: AlertsContentProps) {
  const [view] = useQueryState("view", {
    defaultValue: "timeline",
    parse: (v) => (v === "table" ? "table" : "timeline"),
  });

  if (view === "table") {
    return (
      <AlertTable
        events={events}
        overrides={overrides}
        alertSeverities={alertSeverities}
      />
    );
  }

  return (
    <AlertTimeline
      events={events}
      overrides={overrides}
      alertSeverities={alertSeverities}
    />
  );
}
