import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertBanner } from "@/components/alert-banner";
import { AlertViewToggle } from "@/components/alert-view-toggle";
import { AlertsContent } from "@/components/alerts-content";
import {
  MetricStrip,
  PageHeading,
  SectionHeading,
} from "@/components/page-layout";
import { TimeRangePicker } from "@/components/time-range-picker";
import {
  getAlertEvents,
  getAlertOverrides,
  getFiringAlerts,
  getMonitors,
} from "@/lib/data";
import { getTimeRange, timeRangeCache } from "@/lib/time-range";
import type { AlertSeverity } from "@/scheduler/alerts/types";

export const metadata: Metadata = {
  title: "Alerts",
  description: "Firing alerts, history, and notification overrides",
  robots: { index: false, follow: false },
};
interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AlertsPage({ searchParams }: PageProps) {
  const { preset, from, to } = await timeRangeCache.parse(searchParams);
  const timeRange = getTimeRange({ preset, from, to });
  const [firingAlerts, events, overrides, monitors] = await Promise.all([
    getFiringAlerts(),
    getAlertEvents(timeRange),
    getAlertOverrides(),
    getMonitors(),
  ]);
  const alertSeverities: Record<string, AlertSeverity> = {};
  for (const monitor of monitors)
    for (const alert of monitor.alerts ?? [])
      alertSeverities[alert.id] = alert.severity ?? "warning";
  const silenced = Object.values(overrides).filter(
    (override) =>
      override.silencedUntil && new Date(override.silencedUntil) > new Date(),
  ).length;
  const disabled = Object.values(overrides).filter(
    (override) => override.disabled,
  ).length;

  return (
    <div className="page-stack">
      <PageHeading
        title="Alerts"
        description="Investigate firing rules and review alert activity."
        actions={
          <>
            <TimeRangePicker />
            <Link
              href="/settings/notifications"
              className="text-sm underline underline-offset-4"
            >
              Notification channels
            </Link>
          </>
        }
      />
      <AlertBanner firingAlerts={firingAlerts} />
      <MetricStrip>
        <div>
          <span className="text-xs text-muted-foreground">Firing now</span>
          <p className="mt-1 text-2xl font-medium tabular-nums">
            {firingAlerts.length}
          </p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Events in range</span>
          <p className="mt-1 text-2xl font-medium tabular-nums">
            {events.length}
          </p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Silenced rules</span>
          <p className="mt-1 text-2xl font-medium tabular-nums">{silenced}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Disabled rules</span>
          <p className="mt-1 text-2xl font-medium tabular-nums">{disabled}</p>
        </div>
      </MetricStrip>
      <section id="alert-history">
        <SectionHeading
          title="Alert history"
          description="Use Table view to inspect event snapshots. Each event’s action menu can silence or disable its rule."
          actions={
            <Suspense>
              <AlertViewToggle />
            </Suspense>
          }
        />
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">Loading alerts…</p>
          }
        >
          <AlertsContent
            events={events}
            overrides={overrides}
            alertSeverities={alertSeverities}
          />
        </Suspense>
      </section>
    </div>
  );
}
