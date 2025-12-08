import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "./status-badge";
import type { RegionStats } from "@/lib/data";

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
    <div className="border border-border rounded bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">
          regions
        </h3>
        <span className="text-xs text-muted-foreground">
          {healthyCount}/{totalCount} healthy
        </span>
      </div>
      <div className="space-y-2">
        {stats.map((stat) => (
          <div
            key={stat.region}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <StatusBadge status={stat.status} size="sm" />
              <span className="text-xs font-mono">{stat.region}</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span>{stat.avgResponseTime}ms</span>
              <span>{stat.uptime}%</span>
              <span>
                {stat.lastCheck
                  ? formatDistanceToNow(stat.lastCheck, { addSuffix: true })
                  : "never"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
