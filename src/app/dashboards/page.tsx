// src/app/dashboards/page.tsx
import Link from "next/link"
import { ExternalLink, Globe, Lock, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDashboards, getMonitors, getLatestCheckResult } from "@/lib/data"

export default async function DashboardsPage() {
  const dashboards = await getDashboards()
  const monitors = await getMonitors()

  // Get status for each dashboard's monitors
  const dashboardsWithStatus = await Promise.all(
    dashboards.map(async (dashboard) => {
      const dashboardMonitors = monitors.filter((m) => dashboard.monitorIds.includes(m.id))
      const results = await Promise.all(
        dashboardMonitors.map((m) => getLatestCheckResult(m.id))
      )
      const upCount = results.filter((r) => r?.status === "up").length
      return {
        dashboard,
        monitorCount: dashboardMonitors.length,
        upCount,
      }
    })
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          <div>
            <h1 className="text-sm">dashboards</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">status pages with multiple monitors</p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          defined in <code className="bg-secondary px-1 rounded">data/dashboards/</code>
        </p>
      </div>

      {/* Dashboards List */}
      {dashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded">
          <LayoutDashboard className="h-6 w-6 text-muted-foreground mb-3" />
          <p className="text-xs text-muted-foreground mb-2">no dashboards configured</p>
          <p className="text-[10px] text-muted-foreground/70">
            add .ts files to <code className="bg-secondary px-1 rounded">data/dashboards/</code>
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {dashboardsWithStatus.map(({ dashboard, monitorCount, upCount }) => (
            <div
              key={dashboard.id}
              className="group border border-border rounded bg-card p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link href={`/dashboards/${dashboard.id}`} className="text-sm hover:text-primary transition-colors">
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
                    <Link href={`/public/${dashboard.slug}`} target="_blank">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{monitorCount} monitors</span>
                <span className="text-status-up">
                  {upCount}/{monitorCount} up
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
