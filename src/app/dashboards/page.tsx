// src/app/dashboards/page.tsx

import type { Metadata } from "next";
import { ExternalLink, Globe, LayoutDashboard, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboards",
  description: "Manage your status page dashboards",
};
import Link from "next/link";
import { ListFilter } from "@/components/list-filter";
import { Button } from "@/components/ui/button";
import { getDashboards, getLatestCheckResult, getMonitors } from "@/lib/data";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardsPage({ searchParams }: Props) {
  const params = await searchParams;
  const dashboards = await getDashboards();
  const monitors = await getMonitors();

  const publicCount = dashboards.filter((d) => d.isPublic).length;
  const privateCount = dashboards.length - publicCount;

  // Get status for each dashboard's monitors
  const dashboardsWithStatus = await Promise.all(
    dashboards.map(async (dashboard) => {
      const dashboardMonitors = monitors.filter((m) =>
        dashboard.monitorIds.includes(m.id),
      );
      const results = await Promise.all(
        dashboardMonitors.map((m) => getLatestCheckResult(m.id)),
      );
      const upCount = results.filter((r) => r?.status === "up").length;
      return {
        dashboard,
        monitorCount: dashboardMonitors.length,
        upCount,
      };
    }),
  );

  // Filter logic
  const filter = (params.filter as string) || "all";
  const search = (params.q as string) || "";

  const filteredDashboards = dashboardsWithStatus.filter(({ dashboard }) => {
    // Visibility filter
    if (filter === "public" && !dashboard.isPublic) return false;
    if (filter === "private" && dashboard.isPublic) return false;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        dashboard.name.toLowerCase().includes(searchLower) ||
        dashboard.id.toLowerCase().includes(searchLower) ||
        dashboard.slug?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          <div>
            <h1 className="text-sm">dashboards</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {dashboards.length} total · {publicCount} public · {privateCount}{" "}
              private
            </p>
          </div>
        </div>
        <ListFilter
          filterOptions={[
            { value: "all", label: "all", count: dashboards.length },
            { value: "public", label: "public", count: publicCount },
            { value: "private", label: "private", count: privateCount },
          ]}
          placeholder="Search dashboards..."
        />
      </div>

      {/* Dashboards List */}
      {dashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded">
          <LayoutDashboard className="h-6 w-6 text-muted-foreground mb-3" />
          <p className="text-xs text-muted-foreground mb-2">
            no dashboards configured
          </p>
        </div>
      ) : filteredDashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded bg-card/50">
          <p className="text-xs text-muted-foreground">
            no dashboards match your filters
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredDashboards.map(({ dashboard, monitorCount, upCount }) => (
            <div
              key={dashboard.id}
              className="group border border-border rounded bg-card p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link
                    href={`/dashboards/${dashboard.id}`}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {dashboard.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    {dashboard.isPublic ? (
                      <span className="flex items-center gap-1 text-[10px] text-primary">
                        <Globe className="h-3 w-3" />
                        public
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        private
                      </span>
                    )}
                  </div>
                </div>
                {dashboard.isPublic && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    asChild
                  >
                    <Link href={`/shared/${dashboard.slug}`} target="_blank">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">
                  {monitorCount} monitors
                </span>
                <span className="text-status-up">
                  {upCount}/{monitorCount} up
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
