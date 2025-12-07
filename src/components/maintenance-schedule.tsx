import { getUpcomingMaintenance, getMonitors } from "@/lib/data";

interface MaintenanceScheduleProps {
  dashboardId?: string;
  showDelete?: boolean;
}

export async function MaintenanceSchedule({
  dashboardId,
  showDelete = false,
}: MaintenanceScheduleProps) {
  const maintenance = await getUpcomingMaintenance(dashboardId);

  if (maintenance.length === 0) {
    return null;
  }

  const monitors = await getMonitors();

  return (
    <div className="space-y-3">
      {maintenance.map((window) => {
        const affectedMonitors = monitors.filter((m) =>
          window.affectedMonitorIds.includes(m.id),
        );

        return (
          <div
            key={window.id}
            className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5"
          >
            <div className="flex items-start gap-3">
              <div>
                <p className="text-xs font-medium">{window.title}</p>
                {window.description && (
                  <p className="text-[11px] opacity-60 mt-1">
                    {window.description}
                  </p>
                )}
                {affectedMonitors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {affectedMonitors.map((m) => (
                      <span
                        key={m.id}
                        className="text-[10px] px-2 py-0.5 rounded bg-background/50 opacity-60"
                      >
                        {m.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
