import type { StatusBucket } from "./data";

export interface HistoryBucket extends StatusBucket {
  endTimestamp: number;
  periods: number;
  missingPeriods: number;
}

export function groupStatusHistory(
  buckets: StatusBucket[],
  limit = 90,
): HistoryBucket[] {
  const size = Math.max(1, Math.ceil(buckets.length / Math.max(1, limit)));
  const groups: HistoryBucket[] = [];
  for (let start = 0; start < buckets.length; start += size) {
    const period = buckets.slice(start, start + size);
    const first = period[0];
    const last = period[period.length - 1];
    const measured = period.filter(
      (bucket) => bucket.checks > 0 && bucket.status !== "pending",
    );
    const checks = measured.reduce((sum, bucket) => sum + bucket.checks, 0);
    groups.push({
      timestamp: first.timestamp,
      endTimestamp: last.timestamp,
      label: period.length === 1 ? first.label : `${first.label}–${last.label}`,
      status: measured.some((bucket) => bucket.status === "down")
        ? "down"
        : measured.some((bucket) => bucket.status === "degraded")
          ? "degraded"
          : measured.length
            ? "up"
            : "pending",
      uptime: checks
        ? measured.reduce(
            (sum, bucket) => sum + bucket.uptime * bucket.checks,
            0,
          ) / checks
        : 0,
      checks,
      periods: period.length,
      missingPeriods: period.length - measured.length,
    });
  }
  return groups;
}
