import { format } from "date-fns";
import { PawPrint, Clock, Github, Heart } from "lucide-react";
import { notFound } from "next/navigation";
import { DashboardView } from "@/components/dashboard-view";
import { IncidentsTimeline } from "@/components/incidents-timeline";
import { SupportDialog } from "@/components/support-dialog";
import { getActiveIncidents, getDashboardBySlug } from "@/lib/data";
import { timeRangeCache, getTimeRange } from "@/lib/time-range";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PublicDashboardPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);

  if (!dashboard || !dashboard.isPublic) {
    notFound();
  }

  const { preset, from, to, interval } =
    await timeRangeCache.parse(searchParams);
  const timeRange = getTimeRange({ preset, from, to });

  const activeIncidents = await getActiveIncidents(dashboard.id);
  const hasIssues = activeIncidents.length > 0;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - Fixed */}
      <header className="flex-shrink-0 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-medium font-mono">
                {dashboard.name}
              </h1>
              <p className="text-[10px] text-muted-foreground">status page</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${hasIssues ? "bg-amber-500 animate-pulse" : "bg-blue-500"}`}
              />
              <span className="text-[10px] text-muted-foreground font-mono">
                {hasIssues ? "issues detected" : "all systems operational"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <DashboardView
            dashboardId={dashboard.id}
            isPublic
            timeRange={timeRange}
            interval={interval}
          />

          {/* Past Incidents Section */}
          <div className="mt-8 space-y-3">
            <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">
              past incidents
            </h3>
            <IncidentsTimeline dashboardId={dashboard.id} limit={10} />
          </div>
        </div>
      </main>

      {/* Footer - Fixed */}
      <footer className="flex-shrink-0 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <PawPrint className="h-3 w-3 text-primary" />
                <span>pongo</span>
              </div>
              <span className="text-muted-foreground/50">
                open-source uptime monitoring
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/timcole/pongo"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Github className="h-3 w-3" />
                GitHub
              </a>
              <SupportDialog />
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(), "HH:mm:ss")}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
