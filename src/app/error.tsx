"use client";

import Link from "next/link";
import { EmptyState, PageHeading } from "@/components/page-layout";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-stack">
      <PageHeading
        title="Unable to load this page"
        description="Monitoring data could not be retrieved."
      />
      <div className="panel">
        <EmptyState
          variant="plain"
          title="Try loading the page again"
          description="If the problem continues, check your database connection and server logs."
        >
          <button type="button" className="control-button" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="control-button">
            Return to overview
          </Link>
        </EmptyState>
      </div>
    </div>
  );
}
