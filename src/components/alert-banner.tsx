import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { FiringAlert } from "@/lib/data";

export function AlertBanner({ firingAlerts }: { firingAlerts: FiringAlert[] }) {
  if (!firingAlerts.length) return null;
  return (
    <div
      className="notice flex flex-wrap items-center gap-3 border border-amber-500/30 bg-amber-500/5 p-4"
      role="status"
    >
      <AlertTriangle
        className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {firingAlerts.length} alert{firingAlerts.length === 1 ? "" : "s"}{" "}
          currently firing
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {firingAlerts
            .slice(0, 3)
            .map((alert) => alert.monitorName)
            .join(" · ")}
          {firingAlerts.length > 3 ? ` · +${firingAlerts.length - 3} more` : ""}
        </p>
      </div>
      <Link
        href={`/monitors/${encodeURIComponent(firingAlerts[0].monitorId)}`}
        className="inline-flex min-h-8 items-center text-sm underline underline-offset-4"
      >
        Investigate
      </Link>
    </div>
  );
}
