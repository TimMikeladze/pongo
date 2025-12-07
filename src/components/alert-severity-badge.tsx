import { cn } from "@/lib/utils";
import type { AlertSeverity } from "@/scheduler/alerts/types";

interface AlertSeverityBadgeProps {
  severity: AlertSeverity;
}

const severityStyles: Record<AlertSeverity, string> = {
  critical: "bg-red-500/20 text-red-500",
  warning: "bg-yellow-500/20 text-yellow-500",
  info: "bg-blue-500/20 text-blue-500",
};

export function AlertSeverityBadge({ severity }: AlertSeverityBadgeProps) {
  return (
    <span
      className={cn(
        "text-[9px] px-1.5 py-0.5 rounded font-medium uppercase",
        severityStyles[severity],
      )}
    >
      {severity}
    </span>
  );
}
