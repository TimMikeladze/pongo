import type { Metadata } from "next";
import { Github } from "lucide-react";
import { getDashboardBySlug } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);
  return {
    title: dashboard?.name ?? "Status Page",
    description: dashboard
      ? `Service status for ${dashboard.name}`
      : "Public status page",
  };
}
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { DashboardView } from "@/components/dashboard-view";
import { IncidentsTimeline } from "@/components/incidents-timeline";
import { PongoLogo } from "@/components/pongo-logo";
import { SupportDialog } from "@/components/support-dialog";
import { getActiveIncidents, getMonitors } from "@/lib/data";
import { getTimeRange, timeRangeCache } from "@/lib/time-range";

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

  const allMonitors = await getMonitors();
  const dashboardMonitors = allMonitors.filter((m) =>
    dashboard.monitorIds.includes(m.id),
  );
  const minRefreshInterval =
    dashboardMonitors.length > 0
      ? Math.min(...dashboardMonitors.map((m) => m.intervalSeconds))
      : 0;

  return (
    <div className="h-screen flex flex-col bg-background">
      <AutoRefresh intervalSeconds={minRefreshInterval} />
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
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">
                past incidents
              </h3>
              <a
                href={`/shared/${slug}/incidents`}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                view all
              </a>
            </div>
            <IncidentsTimeline dashboardId={dashboard.id} limit={2} />
          </div>
        </div>
      </main>

      {/* Footer - Fixed */}
      <footer className="flex-shrink-0 border-t border-border h-12">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-medium">
              <PongoLogo className="h-5 w-5" />
              <span>pongo.sh</span>
            </div>
            <span className="text-muted-foreground/60">
              open-source uptime monitoring
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/timmikeladze/pongo"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
              title="GitHub"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
            <SupportDialog mode="support" showLabel={false} />
            <SupportDialog mode="about" showLabel={false} />
          </div>
        </div>
      </footer>
    </div>
  );
}
