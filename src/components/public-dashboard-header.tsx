import { SetPublicHeader } from "@/components/set-public-header";
import {
  getActiveIncidents,
  getLatestCheckResult,
  getMonitors,
} from "@/lib/data";
import { summarizeHealth } from "@/lib/health";
import type { Dashboard } from "@/lib/types";

export async function PublicDashboardHeader({
  dashboard,
}: {
  dashboard: Dashboard;
}) {
  const [incidents, monitors] = await Promise.all([
    getActiveIncidents(dashboard.id),
    getMonitors(),
  ]);
  const statuses = await Promise.all(
    monitors
      .filter((monitor) => dashboard.monitorIds.includes(monitor.id))
      .map(async (monitor) =>
        monitor.isActive
          ? (await getLatestCheckResult(monitor.id))?.status
          : ("pending" as const),
      ),
  );
  const health = summarizeHealth(statuses);
  return (
    <SetPublicHeader
      name={dashboard.name}
      description="Service status"
      hasIssues={
        incidents.length > 0 || health === "down" || health === "degraded"
      }
    />
  );
}
