import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { FiringAlert } from "@/lib/data";

interface AlertBannerProps {
  firingAlerts: FiringAlert[];
}

export function AlertBanner({ firingAlerts }: AlertBannerProps) {
  if (firingAlerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-500 font-medium">
            {firingAlerts.length} alert{firingAlerts.length > 1 ? "s" : ""}{" "}
            currently firing
          </span>
        </div>
        <Link
          href="#firing"
          className="text-xs text-red-500 hover:text-red-400 transition-colors"
        >
          View
        </Link>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {firingAlerts.slice(0, 3).map((alert) => (
          <span
            key={alert.alertId}
            className="text-[10px] px-2 py-0.5 bg-red-500/20 rounded text-red-500"
          >
            {alert.alertId}
          </span>
        ))}
        {firingAlerts.length > 3 && (
          <span className="text-[10px] text-red-500/70">
            +{firingAlerts.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
}
