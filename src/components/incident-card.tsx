"use client";

import { format, formatDistanceToNow } from "date-fns";
import {
  type AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Search,
} from "lucide-react";
import { useState } from "react";
import type {
  Incident,
  IncidentSeverity,
  IncidentStatus,
  Monitor,
} from "@/lib/types";

const statusIcons: Record<IncidentStatus, typeof AlertCircle> = {
  investigating: Search,
  identified: Eye,
  monitoring: Eye,
  resolved: CheckCircle,
};

const severityStyles: Record<IncidentSeverity, string> = {
  critical: "text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/30",
  major:
    "text-orange-700 dark:text-orange-400 bg-orange-500/10 border-orange-500/30",
  minor:
    "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
  maintenance:
    "text-purple-700 dark:text-purple-400 bg-purple-500/10 border-purple-500/30",
};

const statusStyles: Record<IncidentStatus, string> = {
  investigating: "text-amber-700 dark:text-amber-400",
  identified: "text-orange-700 dark:text-orange-400",
  monitoring: "text-blue-700 dark:text-blue-400",
  resolved: "text-emerald-700 dark:text-emerald-400",
};

interface IncidentCardProps {
  incident: Incident;
  monitors: Monitor[];
  showUpdates?: boolean;
}

export function IncidentCard({
  incident,
  monitors,
  showUpdates = true,
}: IncidentCardProps) {
  const [expanded, setExpanded] = useState(incident.status !== "resolved");
  const affectedMonitors = monitors.filter((m) =>
    incident.affectedMonitorIds.includes(m.id),
  );
  const StatusIcon = statusIcons[incident.status];

  return (
    <div className={`rounded-lg border ${severityStyles[incident.severity]}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2 md:p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <StatusIcon className={`h-4 w-4 ${statusStyles[incident.status]}`} />
          <div>
            <p className="text-xs font-medium">{incident.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] opacity-60 uppercase tracking-wide">
                {incident.severity}
              </span>
              <span className="text-[10px] opacity-40">•</span>
              <span className={`text-[10px] ${statusStyles[incident.status]}`}>
                {incident.status}
              </span>
              <span className="text-[10px] opacity-40">•</span>
              <span className="text-[10px] opacity-60">
                {formatDistanceToNow(new Date(incident.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>
        {showUpdates && (
          <div className="flex items-center gap-2 text-[10px] opacity-60">
            {incident.updates.length} updates
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </div>
        )}
      </button>

      {expanded && showUpdates && (
        <div className="px-2 md:px-4 pb-2 md:pb-4 space-y-3">
          {affectedMonitors.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {affectedMonitors.map((m) => (
                <span
                  key={m.id}
                  className="text-[10px] px-2 py-0.5 rounded bg-background/50 opacity-60"
                >
                  {m.name}
                </span>
              ))}
            </div>
          )}

          <div className="border-l border-current/20 ml-2 pl-4 space-y-3">
            {incident.updates.map((update) => {
              const UpdateIcon = statusIcons[update.status];
              return (
                <div key={update.id} className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-current opacity-40" />
                  <div className="flex items-center gap-2 text-[10px]">
                    <UpdateIcon
                      className={`h-3 w-3 ${statusStyles[update.status]}`}
                    />
                    <span className={statusStyles[update.status]}>
                      {update.status}
                    </span>
                    <span className="opacity-40">
                      {format(new Date(update.createdAt), "MMM d, HH:mm")}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-1">
                    {update.message}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
