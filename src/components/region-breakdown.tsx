import { formatDistanceToNow } from "date-fns";
import type { RegionStats } from "@/lib/data";
import { SectionHeading } from "./page-layout";
import { StatusBadge } from "./status-badge";

interface RegionBreakdownProps {
  stats: RegionStats[];
}

export function RegionBreakdown({ stats }: RegionBreakdownProps) {
  if (stats.length <= 1) {
    return null; // Don't show if only one region
  }

  const healthyCount = stats.filter((s) => s.status === "up").length;
  const totalCount = stats.length;

  return (
    <section>
      <SectionHeading
        title="Regions"
        description={`${healthyCount} of ${totalCount} regions operational`}
      />
      <div className="panel px-3">
        {stats.map((stat) => (
          <div
            key={stat.region}
            className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <StatusBadge status={stat.status} size="sm" showLabel />
              <span className="text-sm">{stat.region}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="tabular-nums">
                {stat.lastCheck ? `${stat.avgResponseTime} ms` : "—"}
              </span>
              <span className="tabular-nums">
                {stat.lastCheck ? `${stat.uptime}%` : "—"}
              </span>
              <span>
                {stat.lastCheck
                  ? formatDistanceToNow(stat.lastCheck, { addSuffix: true })
                  : "never"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
