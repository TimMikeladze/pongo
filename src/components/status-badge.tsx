import { cn } from "@/lib/utils";
import type { MonitorStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: MonitorStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const statusConfig = {
  up: { label: "operational", className: "bg-green-500" },
  down: { label: "down", className: "bg-red-500" },
  degraded: { label: "degraded", className: "bg-yellow-500" },
  pending: { label: "pending", className: "bg-gray-500" },
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
