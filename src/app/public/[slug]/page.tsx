import { format } from "date-fns";
import { PawPrint, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { DashboardView } from "@/components/dashboard-view";
import { IncidentsTimeline } from "@/components/incidents-timeline";
import { getActiveIncidents, getDashboardBySlug } from "@/lib/data";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicDashboardPage({ params }: Props) {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);

  if (!dashboard || !dashboard.isPublic) {
    notFound();
  }

  const activeIncidents = await getActiveIncidents(dashboard.id);
  const hasIssues = activeIncidents.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PawPrint className="h-4 w-4 text-primary" />
              <div>
                <h1 className="text-sm font-medium font-mono">
                  {dashboard.name}
                </h1>
                <p className="text-[10px] text-muted-foreground">status page</p>
              </div>
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

      {/* Content - Wider container for 90-day bars */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <DashboardView dashboardId={dashboard.id} isPublic />

        {/* Past Incidents Section */}
        <div className="mt-8 space-y-3">
          <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">
            past incidents
          </h3>
          <IncidentsTimeline dashboardId={dashboard.id} limit={10} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
            <a
              href="https://pongo.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              powered by pongo
            </a>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              last updated {format(new Date(), "HH:mm:ss")}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
