import type { Metadata } from "next";
import { getDashboardBySlug } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);
  return {
    title: dashboard ? `Incidents - ${dashboard.name}` : "Incidents",
    description: dashboard
      ? `Incident history for ${dashboard.name}`
      : "Public incidents",
  };
}

import { notFound } from "next/navigation";
import { IncidentsTimeline } from "@/components/incidents-timeline";
import { PageHeading } from "@/components/page-layout";
import { PublicDashboardHeader } from "@/components/public-dashboard-header";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicIncidentsPage({ params }: Props) {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);

  if (!dashboard?.isPublic) {
    notFound();
  }

  return (
    <div className="page-stack">
      <PublicDashboardHeader dashboard={dashboard} />
      <PageHeading title="Incident history" description={dashboard.name} />
      <IncidentsTimeline dashboardId={dashboard.id} />
    </div>
  );
}
