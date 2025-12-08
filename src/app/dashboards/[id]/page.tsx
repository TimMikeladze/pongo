// src/app/dashboards/[id]/page.tsx

import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardView } from "@/components/dashboard-view";
import { TriggerAllButton } from "@/components/trigger-all-button";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/lib/data";
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
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-8 pt-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/dashboards">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-sm font-medium">{dashboard.name}</h1>
          {dashboard.isPublic && (
            <Link
              href={`/public/${dashboard.slug}`}
              target="_blank"
              className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-0.5"
            >
              <ExternalLink className="h-2.5 w-2.5" />
              view public page
            </Link>
          )}
        </div>
        <TriggerAllButton
          monitorIds={dashboard.monitorIds}
          dashboardId={dashboard.id}
          schedulerEnabled={!!process.env.SCHEDULER_URL}
          enabled={process.env.ENABLE_MANUAL_RUN === "true"}
        />
      </div>

      <DashboardView
        dashboardId={dashboard.id}
        timeRange={timeRange}
        interval={interval}
      />
    </div>
  );
}
