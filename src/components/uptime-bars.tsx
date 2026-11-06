import {
  getCheckResults,
  getLatestCheckResult,
  getMonitor,
  getStatusBuckets,
  type TimeRange,
} from "@/lib/data";
import type { IntervalOption } from "@/lib/time-range";
import { dashboardMeasurements } from "./dashboard-measurements";
import { UptimeDisplay } from "./uptime-display";

interface UptimeBarsProps {
  monitorId: string;
  monitorName: string;
  timeRange: TimeRange;
  interval: IntervalOption;
  showLabels?: boolean;
}

export async function UptimeBars({
  monitorId,
  monitorName,
  timeRange,
  interval,
  showLabels = true,
}: UptimeBarsProps) {
  const [statusBuckets, latest, monitor, checks] = await Promise.all([
    getStatusBuckets(monitorId, timeRange, interval),
    getLatestCheckResult(monitorId),
    getMonitor(monitorId),
    getCheckResults(monitorId, { timeRange }),
  ]);
  const measurements = dashboardMeasurements([checks]);

  return (
    <UptimeDisplay
      monitorName={monitorName}
      statusBuckets={statusBuckets}
      showLabels={showLabels}
      currentStatus={
        monitor?.isActive ? (latest?.status ?? "pending") : "pending"
      }
      paused={!monitor?.isActive}
      uptime={measurements.uptime}
      responseTime={measurements.responseTime}
    />
  );
}
