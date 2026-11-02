import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeading({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="page-heading">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="back-link">
            <ArrowLeft className="size-3.5" />
            {back.label}
          </Link>
        )}
        <h1 className="page-title">{title}</h1>
        {description && <div className="page-description">{description}</div>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function SectionHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  children,
  variant = "panel",
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  variant?: "panel" | "plain" | "compact";
}) {
  return (
    <div className={`empty-state empty-state-${variant}`}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function MetricStrip({ children }: { children: ReactNode }) {
  return <div className="metric-strip">{children}</div>;
}
