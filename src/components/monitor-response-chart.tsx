import { getResponseTimeChartData, type TimeRange } from "@/lib/data";
import { ResponseTimeChart } from "./response-time-chart";
import type { IntervalOption } from "@/lib/time-range";

interface MonitorResponseChartProps {
  monitorId: string;
  height?: number;
  timeRange: TimeRange;
  interval?: IntervalOption;
}

export async function MonitorResponseChart({
  monitorId,
  height = 80,
  timeRange,
  interval = "1h",
}: MonitorResponseChartProps) {
  const data = await getResponseTimeChartData(monitorId, timeRange, interval);

  return <ResponseTimeChart data={data} height={height} />;
}
