// src/app/dashboards/[id]/page.tsx

import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getDashboard } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dashboard = await getDashboard(id);
  return {
    title: dashboard?.name ?? "Dashboard",
    description: dashboard
      ? `Status dashboard for ${dashboard.name}`
      : "Dashboard details",
    robots: {
      index: false,
      follow: false,
    },
  };
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardView } from "@/components/dashboard-view";
import { PageHeading } from "@/components/page-layout";
import { DashboardDetailSkeleton } from "@/components/skeletons";
import { TriggerAllButton } from "@/components/trigger-all-button";
import { getTimeRange, timeRangeCache } from "@/lib/time-range";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const dashboard = await getDashboard(id);
  const { preset, from, to, interval } =
    await timeRangeCache.parse(searchParams);
  const timeRange = getTimeRange({ preset, from, to });

  if (!dashboard) {
    notFound();
  }

  return (
    <div className="page-stack">
      <PageHeading
        title={dashboard.name}
        back={{ href: "/dashboards", label: "Dashboards" }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {dashboard.isPublic && (
              <Link
                href={`/shared/${dashboard.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-8 items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-muted"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View public page
              </Link>
            )}
            <TriggerAllButton
              monitorIds={dashboard.monitorIds}
              dashboardId={dashboard.id}
              schedulerEnabled={!!process.env.SCHEDULER_URL}
              enabled={process.env.ENABLE_MANUAL_RUN === "true"}
            />
          </div>
        }
      />
      {/* Dashboard content - streams when ready */}
      <Suspense fallback={<DashboardDetailSkeleton />}>
        <DashboardView
          dashboardId={dashboard.id}
          timeRange={timeRange}
          interval={interval}
        />
      </Suspense>
    </div>
  );
}
