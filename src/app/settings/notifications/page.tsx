import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertBanner } from "@/components/alert-banner";
import { AlertViewToggle } from "@/components/alert-view-toggle";
import { AlertsContent } from "@/components/alerts-content";
import {
  EmptyState,
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
import { loadChannels } from "@/lib/loader";
import { getTimeRange, timeRangeCache } from "@/lib/time-range";
import type { AlertSeverity } from "@/scheduler/alerts/types";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Webhook channels and alert history",
  robots: { index: false, follow: false },
};
interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const { preset, from, to } = await timeRangeCache.parse(searchParams);
  const timeRange = getTimeRange({ preset, from, to });
  const [firingAlerts, events, overrides, monitors, channels] =
    await Promise.all([
      getFiringAlerts(),
      getAlertEvents(timeRange),
      getAlertOverrides(),
      getMonitors(),
      loadChannels(),
    ]);
  const alertSeverities: Record<string, AlertSeverity> = {};
  for (const monitor of monitors)
    for (const alert of monitor.alerts ?? [])
      alertSeverities[alert.id] = alert.severity ?? "warning";

  return (
    <div className="page-stack">
      <PageHeading
        title="Notifications"
        description="Webhook delivery is configured in code. Alert events below show when rules fired or resolved."
        back={{ href: "/settings", label: "Settings" }}
      />
      <AlertBanner firingAlerts={firingAlerts} />
      <section>
        <SectionHeading
          title="Webhook channels"
          description="Define destinations in pongo/channels.ts and reference channel names in each monitor’s alerts."
        />
        {Object.keys(channels).length ? (
          <div className="panel divide-y divide-border">
            {Object.entries(channels).map(([name, channel]) => (
              <div
                key={name}
                className="flex items-center justify-between gap-3 px-3 py-2.5"
              >
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs text-muted-foreground">
                  {channel.type}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No channels configured"
            description="Add a webhook destination to pongo/channels.ts, then attach its name to an alert rule."
          />
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Pongo sends webhook payloads for firing and resolved alerts. Endpoint
          URLs and credentials remain in your configuration.{" "}
          <Link
            href="/monitors"
            className="text-foreground underline underline-offset-4"
          >
            View monitor rules
          </Link>
        </p>
      </section>
      <section>
        <SectionHeading
          title="Alert history"
          description="Events in the selected time range. This is alert activity, not a delivery receipt."
          actions={
            <Suspense>
              <AlertViewToggle />
              <TimeRangePicker />
            </Suspense>
          }
        />
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">
              Loading alert history…
            </p>
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
