import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IncidentsTimeline } from "@/components/incidents-timeline";
import { MaintenanceSchedule } from "@/components/maintenance-schedule";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/lib/data";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function IncidentsPage({ params }: Props) {
  const { id } = await params;
  const dashboard = await getDashboard(id);

  if (!dashboard) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href={`/dashboards/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-sm font-medium">Incidents</h1>
          <p className="text-muted-foreground text-[10px] font-mono">
            {dashboard.name}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">
            incident history
          </h3>
          <IncidentsTimeline dashboardId={dashboard.id} />
        </div>

        <div className="space-y-2">
          <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">
            scheduled maintenance
          </h3>
          <MaintenanceSchedule dashboardId={dashboard.id} />
        </div>
      </div>
    </div>
  );
}
