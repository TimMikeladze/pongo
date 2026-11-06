import { formatDistanceStrict } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";
import { EmptyState, SectionHeading } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { getMonitors, getUpcomingMaintenance } from "@/lib/data";

interface MaintenanceScheduleProps {
  dashboardId?: string;
  showEmpty?: boolean;
  feedHref?: string;
}

export async function MaintenanceSchedule({
  dashboardId,
  showEmpty = false,
  feedHref,
}: MaintenanceScheduleProps) {
  const maintenance = await getUpcomingMaintenance(dashboardId);
  if (maintenance.length === 0)
    return showEmpty ? (
      <EmptyState
        title="No maintenance scheduled"
        description="There are no upcoming maintenance windows. Follow the status feed for future announcements."
      >
        {feedHref && (
          <Link
            href={feedHref}
            className="inline-flex min-h-8 items-center rounded-md border border-border px-3 text-sm hover:bg-muted"
          >
            Get maintenance updates
          </Link>
        )}
      </EmptyState>
    ) : null;
  const monitors = await getMonitors();
  return (
    <section className="space-y-3">
      <SectionHeading title="Upcoming maintenance" />
      <div className="space-y-3">
        {maintenance.map((window) => {
          const affected = monitors.filter((monitor) =>
            window.affectedMonitorIds.includes(monitor.id),
          );
          const start = new Date(window.scheduledStart);
          const end = new Date(window.scheduledEnd);
          return (
            <article key={window.id} className="panel space-y-3 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium">{window.title}</h3>
                <Badge
                  variant="status"
                  className="status-pill"
                  data-status="pending"
                >
                  {start.getTime() <= Date.now() ? "In progress" : "Scheduled"}
                </Badge>
              </div>
              <dl className="flex flex-wrap gap-x-8 gap-y-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="mt-1">
                    {formatInTimeZone(start, "UTC", "EEEE, MMMM d, yyyy")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Window</dt>
                  <dd className="mt-1 font-mono">
                    <time dateTime={window.scheduledStart}>
                      {formatInTimeZone(start, "UTC", "MMM d, HH:mm")}
                    </time>{" "}
                    –{" "}
                    <time dateTime={window.scheduledEnd}>
                      {formatInTimeZone(end, "UTC", "MMM d, HH:mm")}
                    </time>{" "}
                    UTC
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd className="mt-1">{formatDistanceStrict(start, end)}</dd>
                </div>
              </dl>
              {window.description && (
                <p className="max-w-prose text-sm text-muted-foreground">
                  {window.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Affected services:{" "}
                {affected.length
                  ? affected.map((monitor) => monitor.name).join(", ")
                  : "None listed"}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
