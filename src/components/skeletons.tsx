// src/components/skeletons.tsx
// Loading skeleton components for Suspense fallbacks

import { cn } from "@/lib/utils";

function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("animate-pulse rounded bg-muted/50", className)}
      style={style}
    />
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="border border-border rounded bg-card p-4">
      <Skeleton className="h-3 w-16 mb-2" />
      <Skeleton className="h-6 w-24" />
    </div>
  );
}

export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
    </div>
  );
}

export function ChartSkeleton({ height = 140 }: { height?: number }) {
  return (
    <div className="border border-border rounded bg-card p-4">
      <Skeleton className="h-3 w-24 mb-4" />
      <Skeleton className="w-full" style={{ height }} />
    </div>
  );
}

export function ChartGridSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  );
}

export function UptimeBarsSkeleton() {
  return (
    <div className="border border-border rounded bg-card p-4">
      <Skeleton className="h-3 w-32 mb-3" />
      <div className="flex gap-0.5">
        {Array.from({ length: 50 }).map((_, i) => (
          <Skeleton key={i} className="h-8 flex-1" />
        ))}
      </div>
    </div>
  );
}

export function RecentChecksSkeleton() {
  return (
    <div className="border border-border rounded bg-card p-4">
      <Skeleton className="h-3 w-24 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RegionBreakdownSkeleton() {
  return (
    <div className="border border-border rounded bg-card p-4">
      <Skeleton className="h-3 w-32 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-2 flex-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border border-border rounded bg-card p-4">
      <Skeleton className="h-3 w-24 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="border border-border rounded bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonitorDetailSkeleton() {
  return (
    <div className="space-y-6">
      <StatsGridSkeleton />
      <UptimeBarsSkeleton />
      <ChartGridSkeleton />
      <RecentChecksSkeleton />
    </div>
  );
}

export function DashboardDetailSkeleton() {
  return (
    <div className="space-y-6">
      <StatsGridSkeleton />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <UptimeBarsSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
