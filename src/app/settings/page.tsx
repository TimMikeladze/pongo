import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading, SectionHeading } from "@/components/page-layout";
import { AppearanceControls } from "./appearance-controls";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configuration and appearance for Pongo",
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return (
    <div className="page-stack">
      <PageHeading
        title="Settings"
        description="Monitoring configuration stays in code. Appearance is saved in this browser."
      />
      <section>
        <SectionHeading
          title="Configuration"
          description="Review monitor and dashboard changes in git, then restart the scheduler to apply monitoring changes."
        />
        <div className="panel overflow-hidden">
          <dl className="divide-y divide-border">
            <div className="grid gap-1 px-3 py-2.5 sm:grid-cols-[180px_1fr]">
              <dt className="text-sm font-medium">Monitors</dt>
              <dd className="text-sm text-muted-foreground">
                <code className="text-xs">pongo/monitors/</code>
                <p className="mt-1">
                  Check handlers, schedules, timeouts, and alert conditions.
                </p>
              </dd>
            </div>
            <div className="grid gap-1 px-3 py-2.5 sm:grid-cols-[180px_1fr]">
              <dt className="text-sm font-medium">Dashboards</dt>
              <dd className="text-sm text-muted-foreground">
                <code className="text-xs">pongo/dashboards/</code>
                <p className="mt-1">
                  Monitor groups, public status pages, and SLA targets.
                </p>
              </dd>
            </div>
            <div className="grid gap-1 px-3 py-2.5 sm:grid-cols-[180px_1fr]">
              <dt className="text-sm font-medium">Notifications</dt>
              <dd className="text-sm text-muted-foreground">
                <code className="text-xs">pongo/channels.ts</code>
                <p className="mt-1">
                  Webhook destinations referenced by alert rules.
                </p>
                <Link
                  href="/settings/notifications"
                  className="mt-2 inline-block text-foreground underline underline-offset-4"
                >
                  View channels and alert history
                </Link>
              </dd>
            </div>
          </dl>
        </div>
      </section>
      <section>
        <SectionHeading
          title="Appearance"
          description="These preferences apply across Pongo on this device."
        />
        <AppearanceControls />
      </section>
    </div>
  );
}
