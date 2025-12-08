"use client";

import { Loader2, Play } from "lucide-react";
import { useState } from "react";
import { triggerMonitor } from "@/app/monitors/[id]/actions";
import { Button } from "@/components/ui/button";

interface TriggerButtonProps {
  monitorId: string;
}

export function TriggerButton({ monitorId }: TriggerButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    status?: string;
    responseTime?: number;
    error?: string;
  } | null>(null);

  async function handleTrigger() {
    setIsRunning(true);
    setResult(null);

    try {
      const res = await triggerMonitor(monitorId);
      if (res.success) {
        setResult({
          status: res.status,
          responseTime: res.responseTime,
        });
      } else {
        setResult({ error: res.error });
      }
    } catch (_error) {
      setResult({ error: "Failed to trigger monitor" });
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
        disabled={isRunning}
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
            Run Now
          </>
        )}
      </Button>
      <span className="text-[10px] text-muted-foreground h-4">
        {result ? (
          result.error ? (
            <span className="text-destructive">{result.error}</span>
          ) : (
            <span>
              {result.status} - {result.responseTime}ms
            </span>
          )
        ) : (
          <span className="invisible">placeholder</span>
        )}
      </span>
    </div>
  );
}
