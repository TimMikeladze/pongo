import type { Metadata } from "next";
import { getDashboard } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dashboard = await getDashboard(id);
  return {
    title: dashboard ? `Incidents - ${dashboard.name}` : "Incidents",
    description: dashboard
      ? `Incident history for ${dashboard.name}`
      : "Dashboard incidents",
  };
}

import { notFound } from "next/navigation";
import { IncidentsTimeline } from "@/components/incidents-timeline";
import { MaintenanceSchedule } from "@/components/maintenance-schedule";
import { PageHeading } from "@/components/page-layout";

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
    <div className="page-stack">
      <PageHeading
        title="Incident history"
        description={dashboard.name}
        back={{ href: `/dashboards/${id}`, label: "Dashboard" }}
      />
      <IncidentsTimeline dashboardId={dashboard.id} />
      <MaintenanceSchedule dashboardId={dashboard.id} showEmpty />
    </div>
  );
}
