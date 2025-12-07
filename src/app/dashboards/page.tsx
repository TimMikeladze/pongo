"use client"

import Link from "next/link"
import { Plus, ExternalLink, Globe, Lock, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDashboards, useMonitors } from "@/lib/hooks"
import { store } from "@/lib/store"

export default function DashboardsPage() {
  const dashboards = useDashboards()
  const monitors = useMonitors()

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
        <Button asChild size="sm" className="h-7 text-xs">
          <Link href="/dashboards/new">
            <Plus className="mr-1.5 h-3 w-3" />
            new dashboard
          </Link>
        </Button>
      </div>

      {/* Dashboards List */}
      {dashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded">
          <LayoutDashboard className="h-6 w-6 text-muted-foreground mb-3" />
          <p className="text-xs text-muted-foreground mb-4">no dashboards configured</p>
          <Button asChild size="sm" variant="outline" className="h-7 text-xs bg-transparent">
            <Link href="/dashboards/new">
              <Plus className="mr-1.5 h-3 w-3" />
              create dashboard
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((dashboard) => {
            const dashboardMonitors = monitors.filter((m) => dashboard.monitorIds.includes(m.id))
            const upCount = dashboardMonitors.filter((m) => {
              const result = store.getLatestCheckResult(m.id)
              return result?.status === "up"
            }).length

            return (
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
                  <span className="text-muted-foreground">{dashboardMonitors.length} monitors</span>
                  <span className="text-status-up">
                    {upCount}/{dashboardMonitors.length} up
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
