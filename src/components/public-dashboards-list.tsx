import { ExternalLink, Globe, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import type { Dashboard } from "@/lib/types";
import { PongoLogo } from "./pongo-logo";

interface Props {
  dashboards: Dashboard[];
}

export function PublicDashboardsList({ dashboards }: Props) {
  if (dashboards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-16">
        <PongoLogo className="h-12 w-12 mb-4" />
        <h1 className="text-lg font-medium mb-2">No Public Status Pages</h1>
        <p className="text-sm text-muted-foreground mb-6">
          There are no public status pages available.
        </p>
        <Link href="/login" className="text-xs text-primary hover:underline">
          Sign in to access the dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex flex-col items-center mb-8">
        <PongoLogo className="h-10 w-10 mb-3" />
        <h1 className="text-lg font-medium">Status Pages</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Select a status page to view
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
        {dashboards.map((dashboard) => (
          <Link
            key={dashboard.id}
            href={`/shared/${dashboard.slug}`}
            className="group border border-border rounded bg-card p-4 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                <span className="text-sm group-hover:text-primary transition-colors">
                  {dashboard.name}
                </span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>/{dashboard.slug}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in for admin access
        </Link>
      </div>
    </div>
  );
}
