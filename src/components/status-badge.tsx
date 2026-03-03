import type { MonitorStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: MonitorStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const statusConfig = {
  up: { label: "operational", className: "bg-status-up" },
  down: { label: "down", className: "bg-status-down" },
  degraded: { label: "degraded", className: "bg-status-degraded" },
  pending: { label: "pending", className: "bg-status-pending" },
};

const sizeConfig = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2.5 w-2.5",
};

export function StatusBadge({
  status,
  size = "md",
  showLabel = false,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn("rounded-full", sizeConfig[size], config.className)}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground lowercase tracking-wide">
          {config.label}
        </span>
      )}
    </div>
  );
}
