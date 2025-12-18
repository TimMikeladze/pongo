import type { Metadata } from "next";
import { getDashboardBySlug, getDashboards } from "@/lib/data";

// ISR: Revalidate public status pages every 30 seconds
export const revalidate = 30;

// Allow new dashboard slugs to work without rebuild
export const dynamicParams = true;

/**
 * Pre-generate public dashboard pages at build time
 */
export async function generateStaticParams() {
  const dashboards = await getDashboards();
  return dashboards.filter((d) => d.isPublic).map((d) => ({ slug: d.slug }));
}

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
import { SetPublicHeader } from "@/components/set-public-header";
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
    <>
      <AutoRefresh intervalSeconds={minRefreshInterval} />
      <SetPublicHeader
        name={dashboard.name}
        description="status page"
        hasIssues={hasIssues}
      />

      <DashboardView
        dashboardId={dashboard.id}
        isPublic
        timeRange={timeRange}
        interval={interval}
      />

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
    </>
  );
}
