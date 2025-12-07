"use client"

import { useParams } from "next/navigation"
import { notFound } from "next/navigation"
import { Activity, Clock } from "lucide-react"
import { DashboardView } from "@/components/dashboard-view"
import { SubscribeForm } from "@/components/subscribe-form"
import { IncidentsTimeline } from "@/components/incidents-timeline"
import { useDashboardBySlug, useActiveIncidents } from "@/lib/hooks"
import { format } from "date-fns"

export default function PublicDashboardPage() {
  const params = useParams()
  const slug = params.slug as string
  const dashboard = useDashboardBySlug(slug)
  const activeIncidents = useActiveIncidents(dashboard?.id)

  if (!dashboard || !dashboard.isPublic) {
    notFound()
  }

  const hasIssues = activeIncidents.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-primary" />
              <div>
                <h1 className="text-sm font-medium font-mono">{dashboard.name}</h1>
                <p className="text-[10px] text-muted-foreground">status page</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${hasIssues ? "bg-amber-500 animate-pulse" : "bg-blue-500"}`} />
              <span className="text-[10px] text-muted-foreground font-mono">
                {hasIssues ? "issues detected" : "all systems operational"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content - Wider container for 90-day bars */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <DashboardView dashboard={dashboard} isPublic />

        {/* Past Incidents Section */}
        <div className="mt-8 space-y-3">
          <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">past incidents</h3>
          <IncidentsTimeline dashboardId={dashboard.id} limit={10} />
        </div>

        {/* Subscribe Section */}
        <div className="mt-8 p-6 rounded-lg border border-border bg-card">
          <h3 className="text-xs font-medium mb-3 font-mono">get notified of updates</h3>
          <SubscribeForm dashboardId={dashboard.id} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
            <span>powered by uptime_</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              last updated {format(new Date(), "HH:mm:ss")}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
