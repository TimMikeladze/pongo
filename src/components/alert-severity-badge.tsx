import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AlertSeverity } from "@/scheduler/alerts/types";

interface AlertSeverityBadgeProps {
  severity: AlertSeverity;
}

const severityStyles: Record<AlertSeverity, string> = {
  critical: "bg-red-500/10 text-red-700 dark:text-red-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  info: "bg-muted text-muted-foreground",
};

export function AlertSeverityBadge({ severity }: AlertSeverityBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs px-2 py-0.5 rounded font-medium border-transparent",
        severityStyles[severity],
      )}
    >
      {severity}
    </Badge>
  );
}
