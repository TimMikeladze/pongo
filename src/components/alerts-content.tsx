"use client";

import { useQueryState } from "nuqs";
import type { AlertEventWithMonitor } from "@/lib/data";
import { AlertTable } from "./alert-table";
import { AlertTimeline } from "./alert-timeline";

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
