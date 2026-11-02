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
    title: dashboard ? `Announcements - ${dashboard.name}` : "Announcements",
    description: dashboard
      ? `Service announcements for ${dashboard.name}`
      : "Public announcements",
  };
}

import { notFound } from "next/navigation";
import { AnnouncementsList } from "@/components/announcements-list";
import { PageHeading } from "@/components/page-layout";
import { PublicDashboardHeader } from "@/components/public-dashboard-header";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicAnnouncementsPage({ params }: Props) {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);

  if (!dashboard?.isPublic) {
    notFound();
  }

  return (
    <div className="page-stack">
      <PublicDashboardHeader dashboard={dashboard} />
      <PageHeading title="Updates" description={dashboard.name} />
      <AnnouncementsList dashboardId={dashboard.id} />
    </div>
  );
}
