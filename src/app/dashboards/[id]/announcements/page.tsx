import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
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
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnnouncementsList } from "@/components/announcements-list";
import { Button } from "@/components/ui/button";

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
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href={`/dashboards/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-sm font-medium">Announcements</h1>
          <p className="text-muted-foreground text-[10px] font-mono">
            {dashboard.name}
          </p>
        </div>
      </div>

      <AnnouncementsList dashboardId={dashboard.id} />
    </div>
  );
}
