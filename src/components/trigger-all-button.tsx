"use client";

import { CheckCircle, Loader2, Play, XCircle } from "lucide-react";
import { useState } from "react";
import { triggerAllMonitors } from "@/app/dashboards/[id]/actions";
import { Button } from "@/components/ui/button";

interface TriggerAllButtonProps {
  monitorIds: string[];
  dashboardId: string;
  schedulerEnabled?: boolean;
  enabled?: boolean;
}

export function TriggerAllButton({
  monitorIds,
  dashboardId,
  enabled = true,
}: TriggerAllButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    success?: number;
    failed?: number;
    totalTime?: number;
    error?: string;
  } | null>(null);

  async function handleTrigger() {
    setIsRunning(true);
    setResult(null);

    try {
      const res = await triggerAllMonitors(monitorIds, dashboardId);
      if (res.success && res.results) {
        const success = res.results.filter(
          (r: { status?: string; error?: string; responseTime?: number }) =>
            r.status === "up" || r.status === "degraded",
        ).length;
        const failed = res.results.filter(
          (r: { status?: string; error?: string; responseTime?: number }) =>
            r.status === "down" || r.error,
        ).length;
        const totalTime = res.results.reduce(
          (sum: number, r: { responseTime?: number }) =>
            sum + (r.responseTime ?? 0),
          0,
        );
        setResult({ success, failed, totalTime });
      } else {
        setResult({ error: res.error });
      }
    } catch (_error) {
      setResult({ error: "Failed to trigger monitors" });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleTrigger}
        disabled={!enabled || isRunning || monitorIds.length === 0}
        className="h-7 text-xs"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play className="h-3 w-3 mr-1.5" />
            Run All
          </>
        )}
      </Button>
      <span className="text-[10px] text-muted-foreground h-4">
        {result ? (
          result.error ? (
            <span className="text-destructive">{result.error}</span>
          ) : (
            <span className="flex items-center gap-1.5">
              {result.success !== undefined && result.success > 0 && (
                <span className="flex items-center gap-0.5 text-green-500">
                  <CheckCircle className="h-3 w-3" />
                  {result.success}
                </span>
              )}
              {result.failed !== undefined && result.failed > 0 && (
                <span className="flex items-center gap-0.5 text-destructive">
                  <XCircle className="h-3 w-3" />
                  {result.failed}
                </span>
              )}
              {result.totalTime !== undefined && (
                <span>- {result.totalTime}ms</span>
              )}
            </span>
          )
        ) : (
          <span className="invisible">placeholder</span>
        )}
      </span>
    </div>
  );
}
