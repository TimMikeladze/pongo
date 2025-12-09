import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getDashboardBySlug } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);
  return {
    title: dashboard ? `Incidents - ${dashboard.name}` : "Incidents",
    description: dashboard
      ? `Incident history for ${dashboard.name}`
      : "Public incidents",
  };
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { IncidentsTimeline } from "@/components/incidents-timeline";
import { SharedFooter } from "@/components/shared-footer";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicIncidentsPage({ params }: Props) {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);

  if (!dashboard || !dashboard.isPublic) {
    notFound();
  }

  const renderedAt = new Date().toISOString();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - Fixed */}
      <header className="flex-shrink-0 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/shared/${slug}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-sm font-medium font-mono">
                  {dashboard.name}
                </h1>
                <p className="text-[10px] text-muted-foreground">
                  past incidents
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <IncidentsTimeline dashboardId={dashboard.id} />
        </div>
      </main>

      <SharedFooter renderedAt={renderedAt} />
    </div>
  );
}
