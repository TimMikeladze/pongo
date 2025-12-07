import { getCheckResults } from "@/lib/data";
import { ErrorRateChart } from "./error-rate-chart";

interface MonitorErrorRateChartProps {
  monitorId: string;
  height?: number;
}

export async function MonitorErrorRateChart({
  monitorId,
  height = 100,
}: MonitorErrorRateChartProps) {
  const results = await getCheckResults(monitorId, 100);

  return <ErrorRateChart results={results} height={height} />;
}
