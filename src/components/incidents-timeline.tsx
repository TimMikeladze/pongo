import { getIncidents, getMonitors } from "@/lib/data";
import { IncidentCard } from "./incident-card";
import { Card, CardContent } from "./ui/card";

interface IncidentsTimelineProps {
  dashboardId?: string;
  limit?: number;
  showResolved?: boolean;
}

export async function IncidentsTimeline({
  dashboardId,
  limit,
  showResolved = true,
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
      <Card className="bg-card">
        <CardContent className="text-center py-8 text-[11px] text-muted-foreground">
          No incidents reported
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
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
