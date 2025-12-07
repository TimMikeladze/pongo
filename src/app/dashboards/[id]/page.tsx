// src/app/dashboards/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardView } from "@/components/dashboard-view";
import { TriggerAllButton } from "@/components/trigger-all-button";
import { getDashboard } from "@/lib/data";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DashboardDetailPage({ params }: Props) {
  const { id } = await params;
  const dashboard = await getDashboard(id);

  if (!dashboard) {
    notFound();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/dashboards">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-sm font-medium">{dashboard.name}</h1>
          <p className="text-muted-foreground text-[10px] font-mono">
            /public/{dashboard.slug}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TriggerAllButton monitorIds={dashboard.monitorIds} dashboardId={dashboard.id} />
          {dashboard.isPublic && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs h-7 bg-transparent"
            >
              <Link href={`/public/${dashboard.slug}`} target="_blank">
                <ExternalLink className="mr-2 h-3 w-3" />
                View Public
              </Link>
            </Button>
          )}
        </div>
      </div>

      <DashboardView dashboardId={dashboard.id} />
    </div>
  );
}
