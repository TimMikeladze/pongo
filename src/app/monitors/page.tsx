import { Terminal, Zap } from "lucide-react";
import { MonitorCard } from "@/components/monitor-card";
import { getMonitors } from "@/lib/data";
import { timeRangeCache, getTimeRange } from "@/lib/time-range";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MonitorsPage({ searchParams }: Props) {
  const monitors = await getMonitors();
  const { preset, from, to } = await timeRangeCache.parse(searchParams);
  const timeRange = getTimeRange({ preset, from, to });
  const activeCount = monitors.filter((m) => m.isActive).length;
  const pausedCount = monitors.length - activeCount;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-4">
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
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {monitors.map((monitor) => (
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
