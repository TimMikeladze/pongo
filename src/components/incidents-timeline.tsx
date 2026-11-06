import { getIncidents, getMonitors } from "@/lib/data";
import { IncidentCard } from "./incident-card";
import { EmptyState } from "./page-layout";

interface IncidentsTimelineProps {
  dashboardId?: string;
  limit?: number;
  showResolved?: boolean;
  compactEmpty?: boolean;
}

export async function IncidentsTimeline({
  dashboardId,
  limit,
  showResolved = true,
  compactEmpty = false,
}: IncidentsTimelineProps) {
  const [incidents, monitors] = await Promise.all([
    getIncidents(dashboardId),
    getMonitors(),
  ]);

  const filteredIncidents = showResolved
    ? incidents
    : incidents.filter((i) => i.status !== "resolved");
  const displayIncidents = limit
    ? filteredIncidents.slice(0, limit)
    : filteredIncidents;

  if (displayIncidents.length === 0) {
    return (
      <EmptyState
        variant={compactEmpty ? "compact" : "panel"}
        title="No incidents reported"
        description="Service incidents and their updates will appear here."
      />
    );
  }

  return (
    <div className="divide-y-0">
      {displayIncidents.map((incident) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          monitors={monitors}
        />
      ))}
    </div>
  );
}
