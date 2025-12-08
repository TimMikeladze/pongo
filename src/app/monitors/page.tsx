import { Terminal, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monitors",
  description: "View and manage all your uptime monitors",
};

import { AutoRefresh } from "@/components/auto-refresh";
import { ListFilter } from "@/components/list-filter";
import { MonitorCard } from "@/components/monitor-card";
import { getMonitors } from "@/lib/data";
import { getTimeRange, timeRangeCache } from "@/lib/time-range";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MonitorsPage({ searchParams }: Props) {
  const params = await searchParams;
  const monitors = await getMonitors();
  const { preset, from, to } = await timeRangeCache.parse(searchParams);
  const timeRange = getTimeRange({ preset, from, to });
  const activeCount = monitors.filter((m) => m.isActive).length;
  const pausedCount = monitors.length - activeCount;
  const minRefreshInterval =
    monitors.length > 0
      ? Math.min(...monitors.map((m) => m.intervalSeconds))
      : 0;

  // Filter logic
  const filter = (params.filter as string) || "all";
  const search = (params.q as string) || "";

  const filteredMonitors = monitors.filter((monitor) => {
    // Status filter
    if (filter === "active" && !monitor.isActive) return false;
    if (filter === "paused" && monitor.isActive) return false;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        monitor.name.toLowerCase().includes(searchLower) ||
        monitor.id.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  return (
    <div>
      <AutoRefresh intervalSeconds={minRefreshInterval} />
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="h-4 w-4 text-primary" />
          <div>
            <h1 className="text-sm">monitors</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {monitors.length} total · {activeCount} active · {pausedCount}{" "}
              paused
            </p>
          </div>
        </div>
        <ListFilter
          filterOptions={[
            { value: "all", label: "all", count: monitors.length },
            { value: "active", label: "active", count: activeCount },
            { value: "paused", label: "paused", count: pausedCount },
          ]}
          placeholder="Search monitors..."
        />
      </div>

      {/* Monitors List */}
      {monitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded bg-card/50">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            no monitors configured
          </p>
        </div>
      ) : filteredMonitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded bg-card/50">
          <p className="text-xs text-muted-foreground">
            no monitors match your filters
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredMonitors.map((monitor) => (
            <MonitorCard
              key={monitor.id}
              monitor={monitor}
              timeRange={timeRange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
