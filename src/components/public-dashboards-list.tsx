import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeading } from "@/components/page-layout";
import type { Dashboard } from "@/lib/types";

export function PublicDashboardsList({
  dashboards,
}: {
  dashboards: Dashboard[];
}) {
  return (
    <div className="page-stack">
      <PageHeading
        title="Service status"
        description="Choose a status page to view current service health and updates."
        actions={
          <Link
            href="/login"
            className="inline-flex min-h-8 items-center rounded-md border border-border px-3 text-sm hover:bg-muted"
          >
            Sign in
          </Link>
        }
      />
      {dashboards.length === 0 ? (
        <EmptyState
          title="No public status pages"
          description="There are no public status pages available."
        >
          <Link href="/login" className="text-sm underline underline-offset-4">
            Sign in to access the dashboard
          </Link>
        </EmptyState>
      ) : (
        <div className="panel divide-y divide-border">
          {dashboards.map((dashboard) => (
            <Link
              key={dashboard.id}
              href={`/shared/${dashboard.slug}`}
              className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/40"
            >
              <div>
                <h2 className="text-sm font-medium">{dashboard.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dashboard.monitorIds.length} monitored services · /
                  {dashboard.slug}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
