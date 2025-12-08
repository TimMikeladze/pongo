import type { Metadata } from "next";
import { ArrowLeft, Github } from "lucide-react";
import { getDashboardBySlug } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);
  return {
    title: dashboard ? `Announcements - ${dashboard.name}` : "Announcements",
    description: dashboard
      ? `Service announcements for ${dashboard.name}`
      : "Public announcements",
  };
}
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnnouncementsList } from "@/components/announcements-list";
import { PongoLogo } from "@/components/pongo-logo";
import { SupportDialog } from "@/components/support-dialog";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicAnnouncementsPage({ params }: Props) {
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);

  if (!dashboard || !dashboard.isPublic) {
    notFound();
  }

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
                  announcements
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <AnnouncementsList dashboardId={dashboard.id} />
        </div>
      </main>

      {/* Footer - Fixed */}
      <footer className="flex-shrink-0 border-t border-border h-12">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-medium">
              <PongoLogo className="h-5 w-5" />
              <span>pongo.sh</span>
            </div>
            <span className="text-muted-foreground/60">
              open-source uptime monitoring
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/timmikeladze/pongo"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
              title="GitHub"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
            <SupportDialog mode="support" showLabel={false} />
            <SupportDialog mode="about" showLabel={false} />
          </div>
        </div>
      </footer>
    </div>
  );
}
