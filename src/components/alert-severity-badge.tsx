import { cn } from "@/lib/utils";
import type { AlertSeverity } from "@/scheduler/alerts/types";

interface AlertSeverityBadgeProps {
  severity: AlertSeverity;
}

const severityStyles: Record<AlertSeverity, string> = {
  critical: "bg-red-500/20 text-red-700 dark:text-red-400",
  warning: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  info: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
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
