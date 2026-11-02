import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MaintenanceSchedule } from "@/components/maintenance-schedule";
import { PageHeading } from "@/components/page-layout";
import { PublicDashboardHeader } from "@/components/public-dashboard-header";
import { getDashboardBySlug } from "@/lib/data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);
  return {
    title: dashboard?.isPublic
      ? `Maintenance - ${dashboard.name}`
      : "Maintenance",
    description: "Upcoming scheduled service maintenance",
  };
}

export default async function PublicMaintenancePage({ params }: Props) {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);
  if (!dashboard?.isPublic) notFound();
  return (
    <div className="page-stack">
      <PublicDashboardHeader dashboard={dashboard} />
      <PageHeading
        title="Maintenance"
        description="Planned work and affected services."
      />
      <MaintenanceSchedule
        dashboardId={dashboard.id}
        showEmpty
        feedHref={`/shared/${slug}/feed.xml`}
      />
    </div>
  );
}
