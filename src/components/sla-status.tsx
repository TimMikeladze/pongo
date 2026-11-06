import { dashboardMeasurements } from "@/components/dashboard-measurements";
import {
  getCheckResults,
  getDashboard,
  getMonitors,
  type TimeRange,
} from "@/lib/data";

interface SLAStatusProps {
  dashboardId: string;
  timeRange: TimeRange;
}

export async function SLAStatus({ dashboardId, timeRange }: SLAStatusProps) {
  const [dashboard, monitors] = await Promise.all([
    getDashboard(dashboardId),
    getMonitors(),
  ]);
  if (!dashboard?.slaTarget) return null;
  const checks = await Promise.all(
    monitors
      .filter((monitor) => dashboard.monitorIds.includes(monitor.id))
      .map((monitor) => getCheckResults(monitor.id, { timeRange })),
  );
  const { uptime } = dashboardMeasurements(checks);
  const met = uptime !== null && uptime >= dashboard.slaTarget;
  return (
    <section
      className="panel flex flex-wrap items-center justify-between gap-3 p-3"
      aria-label="SLA status"
    >
      <div>
        <h2 className="text-sm font-medium">Availability target</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {dashboard.slaTarget}% target over the selected period
        </p>
      </div>
      <div className="text-right">
        <p className="font-mono text-sm tabular-nums">
          {uptime === null ? "—" : `${uptime.toFixed(2)}%`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {uptime === null
            ? "Awaiting measurements"
            : met
              ? "Target met"
              : `${(dashboard.slaTarget - uptime).toFixed(2)}% below target`}
        </p>
      </div>
    </section>
  );
}
