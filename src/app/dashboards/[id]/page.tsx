// src/app/dashboards/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardView } from "@/components/dashboard-view";
import { AnnouncementsList } from "@/components/announcements-list";
import { IncidentsTimeline } from "@/components/incidents-timeline";
import { MaintenanceSchedule } from "@/components/maintenance-schedule";
import { getDashboard, getMonitors } from "@/lib/data";

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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
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
        <div className="flex items-center gap-2">
          {dashboard.isPublic && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs h-8 bg-transparent"
            >
              <Link href={`/public/${dashboard.slug}`} target="_blank">
                <ExternalLink className="mr-2 h-3 w-3" />
                View Public
              </Link>
            </Button>
          )}
          <span className="text-[10px] text-muted-foreground">
            <code className="bg-secondary px-1 rounded">
              data/dashboards/{id}.ts
            </code>
          </span>
        </div>
      </div>

      <Tabs defaultValue="preview" className="space-y-6">
        <TabsList className="text-xs">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <DashboardView dashboardId={dashboard.id} />
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">
              All Announcements
            </h3>
            <span className="text-[10px] text-muted-foreground">
              from{" "}
              <code className="bg-secondary px-1 rounded">
                data/announcements/
              </code>
            </span>
          </div>
          <AnnouncementsList dashboardId={dashboard.id} />
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Incident History
            </h3>
            <span className="text-[10px] text-muted-foreground">
              from{" "}
              <code className="bg-secondary px-1 rounded">data/incidents/</code>
            </span>
          </div>
          <IncidentsTimeline dashboardId={dashboard.id} />

          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Scheduled Maintenance
            </h3>
            <MaintenanceSchedule dashboardId={dashboard.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
