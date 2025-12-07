import { getErrorRateChartData, type TimeRange } from "@/lib/data";
import type { IntervalOption } from "@/lib/time-range";
import { ErrorRateChart } from "./error-rate-chart";

interface MonitorErrorRateChartProps {
  monitorId: string;
  height?: number;
  timeRange: TimeRange;
  interval?: IntervalOption;
}

export async function MonitorErrorRateChart({
  monitorId,
  height = 100,
  timeRange,
  interval = "1h",
}: MonitorErrorRateChartProps) {
  const data = await getErrorRateChartData(monitorId, timeRange, interval);

  return <ErrorRateChart data={data} height={height} />;
}
