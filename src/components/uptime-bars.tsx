import { getStatusBuckets, type TimeRange } from "@/lib/data";
import type { IntervalOption } from "@/lib/time-range";
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
  const statusBuckets = await getStatusBuckets(monitorId, timeRange, interval);

  return (
    <UptimeDisplay
      monitorName={monitorName}
      statusBuckets={statusBuckets}
      showLabels={showLabels}
    />
  );
}
