import Link from "next/link";
import { EmptyState, PageHeading } from "@/components/page-layout";

export default function NotFound() {
  return (
    <div className="page-stack">
      <PageHeading
        title="Page not found"
        description="This monitor, dashboard, or page is not available."
      />
      <div className="panel">
        <EmptyState
          variant="plain"
          title="Check the address or return to your status pages"
          description="A dashboard may have been removed or made private."
        >
          <Link href="/" className="control-button">
            Return to overview
          </Link>
        </EmptyState>
      </div>
    </div>
  );
}
