import { dashboardMeasurements } from "@/components/dashboard-measurements";
import { MonitorTableView } from "@/components/monitor-table-view";
import {
  getCheckResults,
  getLatestCheckResult,
  type TimeRange,
} from "@/lib/data";
import type { Monitor } from "@/lib/types";

export async function MonitorTable({
  monitors,
  timeRange,
  showFilters = true,
}: {
  monitors: Monitor[];
  timeRange: TimeRange;
  showFilters?: boolean;
}) {
  const rows = await Promise.all(
    monitors.map(async (monitor) => {
      const [latest, checks] = await Promise.all([
        getLatestCheckResult(monitor.id),
        getCheckResults(monitor.id, { timeRange }),
      ]);
      const measurements = dashboardMeasurements([checks]);
      return {
        id: monitor.id,
        name: monitor.name,
        active: monitor.isActive,
        status: monitor.isActive
          ? (latest?.status ?? ("pending" as const))
          : ("pending" as const),
        uptime: measurements.uptime,
        responseTime: measurements.responseTime,
        interval: monitor.cron ?? `${monitor.intervalSeconds}s`,
        checkedAt: latest?.checkedAt ?? null,
      };
    }),
  );
  return <MonitorTableView rows={rows} showFilters={showFilters} />;
}
