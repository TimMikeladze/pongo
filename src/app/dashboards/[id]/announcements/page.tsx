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
    title: dashboard ? `Announcements - ${dashboard.name}` : "Announcements",
    description: dashboard
      ? `Announcements for ${dashboard.name}`
      : "Dashboard announcements",
  };
}

import { notFound } from "next/navigation";
import { AnnouncementsList } from "@/components/announcements-list";
import { PageHeading } from "@/components/page-layout";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AnnouncementsPage({ params }: Props) {
  const { id } = await params;
  const dashboard = await getDashboard(id);

  if (!dashboard) {
    notFound();
  }

  return (
    <div className="page-stack">
      <PageHeading
        title="Updates"
        description={dashboard.name}
        back={{ href: `/dashboards/${id}`, label: "Dashboard" }}
      />
      <AnnouncementsList dashboardId={dashboard.id} />
    </div>
  );
}
