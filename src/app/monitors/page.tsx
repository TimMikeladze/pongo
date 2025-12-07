import Link from "next/link";
import { Terminal, Zap } from "lucide-react";
import { MonitorCard } from "@/components/monitor-card";
import { getMonitors, getLatestCheckResult } from "@/lib/data";

export default async function MonitorsPage() {
  const monitors = await getMonitors();
  const activeCount = monitors.filter((m) => m.isActive).length;
  const pausedCount = monitors.length - activeCount;

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
        <p className="text-[10px] text-muted-foreground">
          defined in{" "}
          <code className="bg-secondary px-1 rounded">data/monitors/</code>
        </p>
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
          <p className="text-[10px] text-muted-foreground/70">
            add .ts files to{" "}
            <code className="bg-secondary px-1 rounded">data/monitors/</code>
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {monitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} />
          ))}
        </div>
      )}
    </div>
  );
}
