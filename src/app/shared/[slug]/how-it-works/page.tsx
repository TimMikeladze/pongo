import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-layout";
import { PublicDashboardHeader } from "@/components/public-dashboard-header";
import { ReadmeContent } from "@/components/readme-content";
import { getDashboardBySlug } from "@/lib/data";
import { isHowItWorksEnabled } from "@/lib/how-it-works";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Configure and run Pongo uptime monitoring and public status pages.",
};

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!isHowItWorksEnabled()) notFound();
  const { slug } = await params;
  const dashboard = await getDashboardBySlug(slug);
  if (!dashboard?.isPublic) notFound();
  const readme = await readFile(path.join(process.cwd(), "README.md"), "utf8");
  return (
    <div className="page-stack">
      <PublicDashboardHeader dashboard={dashboard} />
      <PageHeading
        title="How it works"
        description="Configure, deploy, and run Pongo."
      />
      <ReadmeContent markdown={readme} />
    </div>
  );
}
