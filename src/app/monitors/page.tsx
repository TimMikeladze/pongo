import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { MonitorTable } from "@/components/monitor-table";
import { EmptyState, PageHeading } from "@/components/page-layout";
import { getMonitors } from "@/lib/data";
import { getTimeRange, timeRangeCache } from "@/lib/time-range";

export const metadata: Metadata = {
  title: "Monitors",
  description: "Current health and measurements for your monitors",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MonitorsPage({ searchParams }: Props) {
  const monitors = await getMonitors();
  const { preset, from, to } = await timeRangeCache.parse(searchParams);
  const timeRange = getTimeRange({ preset, from, to });
  const activeCount = monitors.filter((monitor) => monitor.isActive).length;
  const activeIntervals = monitors
    .filter((monitor) => monitor.isActive)
    .map((monitor) => monitor.intervalSeconds);

  return (
    <div className="page-stack">
      <AutoRefresh
        intervalSeconds={
          activeIntervals.length ? Math.min(...activeIntervals) : 0
        }
      />
      <PageHeading
        title="Monitors"
        description={`${monitors.length} total · ${activeCount} active · ${monitors.length - activeCount} paused`}
        actions={
          <Link
            href="/settings"
            className="text-sm underline underline-offset-4"
          >
            Configuration
          </Link>
        }
      />
      {monitors.length ? (
        <MonitorTable monitors={monitors} timeRange={timeRange} />
      ) : (
        <EmptyState
          title="No monitors configured"
          description="Define a monitor in pongo/monitors/ and start the scheduler to collect checks."
        >
          <code className="text-xs">bun run scheduler</code>
        </EmptyState>
      )}
    </div>
  );
}
