import { ExternalLink, Globe, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ListFilter } from "@/components/list-filter";
import { EmptyState, PageHeading } from "@/components/page-layout";
import { getDashboards, getLatestCheckResult, getMonitors } from "@/lib/data";
import { healthLabels, summarizeHealth } from "@/lib/health";

export const metadata: Metadata = {
  title: "Dashboards",
  description: "Manage your status page dashboards",
};
interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardsPage({ searchParams }: Props) {
  const [params, dashboards, monitors] = await Promise.all([
    searchParams,
    getDashboards(),
    getMonitors(),
  ]);
  const publicCount = dashboards.filter(
    (dashboard) => dashboard.isPublic,
  ).length;
  const filter = typeof params.filter === "string" ? params.filter : "all";
  const search = typeof params.q === "string" ? params.q.toLowerCase() : "";
  const filtered = dashboards.filter(
    (dashboard) =>
      (filter !== "public" || dashboard.isPublic) &&
      (filter !== "private" || !dashboard.isPublic) &&
      (!search ||
        `${dashboard.name} ${dashboard.id} ${dashboard.slug}`
          .toLowerCase()
          .includes(search)),
  );
  const rows = await Promise.all(
    filtered.map(async (dashboard) => {
      const dashboardMonitors = monitors.filter((monitor) =>
        dashboard.monitorIds.includes(monitor.id),
      );
      const statuses = await Promise.all(
        dashboardMonitors.map(async (monitor) =>
          monitor.isActive
            ? (await getLatestCheckResult(monitor.id))?.status
            : ("pending" as const),
        ),
      );
      return {
        dashboard,
        monitorCount: dashboardMonitors.length,
        health: summarizeHealth(statuses),
      };
    }),
  );
  return (
    <div className="page-stack">
      <PageHeading
        title="Dashboards"
        description={`${dashboards.length} total · ${publicCount} public · ${dashboards.length - publicCount} private`}
      />
      <ListFilter
        filterOptions={[
          { value: "all", label: "All", count: dashboards.length },
          { value: "public", label: "Public", count: publicCount },
          {
            value: "private",
            label: "Private",
            count: dashboards.length - publicCount,
          },
        ]}
        placeholder="Search dashboards..."
      />
      {dashboards.length === 0 ? (
        <EmptyState
          title="No dashboards configured"
          description="Add a dashboard configuration in pongo/dashboards to publish a status page."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No dashboards match your filters"
          description="Try another dashboard name or change the visibility filter."
        />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="data-table w-full text-left text-sm">
            <caption className="sr-only">
              Status dashboards and current service health
            </caption>
            <thead>
              <tr>
                <th scope="col">Dashboard</th>
                <th scope="col">Visibility</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-right">
                  Services
                </th>
                <th scope="col">
                  <span className="sr-only">Public page</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ dashboard, monitorCount, health }) => (
                <tr key={dashboard.id}>
                  <td>
                    <Link
                      href={`/dashboards/${dashboard.id}`}
                      className="inline-flex min-h-8 flex-col justify-center font-medium hover:underline"
                    >
                      {dashboard.name}
                      <span className="mt-0.5 text-xs font-normal text-muted-foreground">
                        /{dashboard.slug}
                      </span>
                    </Link>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      {dashboard.isPublic ? (
                        <Globe className="h-3.5 w-3.5" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                      {dashboard.isPublic ? "Public" : "Private"}
                    </span>
                  </td>
                  <td>
                    <span className="status-pill" data-status={health}>
                      {healthLabels[health]}
                    </span>
                  </td>
                  <td className="text-right font-mono tabular-nums">
                    {monitorCount}
                  </td>
                  <td>
                    {dashboard.isPublic && (
                      <Link
                        href={`/shared/${dashboard.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${dashboard.name} public page`}
                        className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md hover:bg-muted"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
