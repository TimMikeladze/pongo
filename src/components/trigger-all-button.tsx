"use client";

import { useState } from "react";
import { Play, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerAllMonitors } from "@/app/dashboards/[id]/actions";

interface TriggerAllButtonProps {
  monitorIds: string[];
  dashboardId: string;
}

export function TriggerAllButton({ monitorIds, dashboardId }: TriggerAllButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    success?: number;
    failed?: number;
    error?: string;
  } | null>(null);

  async function handleTrigger() {
    setIsRunning(true);
    setResult(null);

    try {
      const res = await triggerAllMonitors(monitorIds, dashboardId);
      if (res.success && res.results) {
        const success = res.results.filter((r: { status?: string; error?: string }) => r.status === "up" || r.status === "degraded").length;
        const failed = res.results.filter((r: { status?: string; error?: string }) => r.status === "down" || r.error).length;
        setResult({ success, failed });
      } else {
        setResult({ error: res.error });
      }
    } catch (error) {
      setResult({ error: "Failed to trigger monitors" });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleTrigger}
        disabled={isRunning || monitorIds.length === 0}
        className="h-7 text-xs"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            Running {monitorIds.length}...
          </>
        ) : (
          <>
            <Play className="h-3 w-3 mr-1.5" />
            Run All ({monitorIds.length})
          </>
        )}
      </Button>
      {result && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
          {result.error ? (
            <span className="text-destructive">{result.error}</span>
          ) : (
            <>
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
            </>
          )}
        </span>
      )}
    </div>
  );
}
