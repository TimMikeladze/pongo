import { getCheckResults } from "@/lib/data";
import { StatusTimeline } from "./status-timeline";

interface MonitorStatusTimelineProps {
  monitorId: string;
  limit?: number;
}

export async function MonitorStatusTimeline({
  monitorId,
  limit = 50,
}: MonitorStatusTimelineProps) {
  const results = await getCheckResults(monitorId, limit);

  return <StatusTimeline results={results} limit={limit} />;
}
