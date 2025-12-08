import { Bell } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Configure email, SMS, and webhook alert notifications",
};

import { Suspense } from "react";
import { AlertBanner } from "@/components/alert-banner";
import { AlertViewToggle } from "@/components/alert-view-toggle";
import { AlertsContent } from "@/components/alerts-content";
import { TimeRangePicker } from "@/components/time-range-picker";
import { getAlertEvents, getFiringAlerts } from "@/lib/data";
import { getTimeRange, timeRangeCache } from "@/lib/time-range";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { preset, from, to } = timeRangeCache.parse(params);
  const timeRange = getTimeRange({ preset, from, to });

  const [firingAlerts, events] = await Promise.all([
    getFiringAlerts(),
    getAlertEvents(timeRange),
  ]);

  return (
    <div>
      {/* Firing alerts banner */}
      <AlertBanner firingAlerts={firingAlerts} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <div className="flex items-center gap-3">
          <Bell className="h-4 w-4 text-primary" />
          <div>
            <h1 className="text-sm">alerts</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              alert history
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Suspense>
            <AlertViewToggle />
          </Suspense>
          <TimeRangePicker />
        </div>
      </div>

      {/* Content */}
      <Suspense
        fallback={
          <div className="text-center py-8 text-sm text-muted-foreground">
            Loading alerts...
          </div>
        }
      >
        <AlertsContent events={events} />
      </Suspense>
    </div>
  );
}
