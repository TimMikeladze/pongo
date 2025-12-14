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

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnnouncementsList } from "@/components/announcements-list";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicAnnouncementsPage({ params }: Props) {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);

  if (!dashboard || !dashboard.isPublic) {
    notFound();
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/shared/${slug}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-sm font-medium font-mono">{dashboard.name}</h1>
          <p className="text-[10px] text-muted-foreground">announcements</p>
        </div>
      </div>

      <AnnouncementsList dashboardId={dashboard.id} />
    </>
  );
}
