import { getCheckResults } from "@/lib/data";
import { ResponseTimeChart } from "./response-time-chart";

interface MonitorResponseChartProps {
  monitorId: string;
  height?: number;
}

export async function MonitorResponseChart({
  monitorId,
  height = 80,
}: MonitorResponseChartProps) {
  const results = await getCheckResults(monitorId, 30);

  return <ResponseTimeChart results={results} height={height} />;
}
