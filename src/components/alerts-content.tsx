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
