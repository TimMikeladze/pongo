import { getStatusTimelineData, type TimeRange } from "@/lib/data";
import type { IntervalOption } from "@/lib/time-range";
import { StatusTimeline } from "./status-timeline";

interface MonitorStatusTimelineProps {
  monitorId: string;
  timeRange: TimeRange;
  interval?: IntervalOption;
  limit?: number;
}

export async function MonitorStatusTimeline({
  monitorId,
  timeRange,
  interval = "1h",
  limit = 50,
}: MonitorStatusTimelineProps) {
  const data = await getStatusTimelineData(
    monitorId,
    timeRange,
    interval,
    limit,
  );

  return <StatusTimeline data={data} limit={limit} />;
}
