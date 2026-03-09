import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

/**
 * Format a date showing both UTC and local time.
 * Returns { utc, local } strings.
 */
export function formatDualTime(
  date: Date | number | string,
  formatStr = "MMM d, h:mm a",
): { utc: string; local: string } {
  const d = date instanceof Date ? date : new Date(Number(date));
  return {
    utc: formatInTimeZone(d, "UTC", formatStr),
    local: format(d, formatStr),
  };
}

/**
 * Format a bucket timestamp for dual display in tooltips.
 * Shows time-only for short intervals, date+time for longer ones.
 */
export function formatBucketDualTime(
  timestamp: number | bigint | string,
  interval: string,
): { utc: string; local: string } {
  const ts = Number(timestamp);
  const d = new Date(ts);

  const isShortInterval = ["5m", "15m", "30m", "1h"].includes(interval);
  const formatStr = isShortInterval ? "h:mm a" : "MMM d, h:mm a";

  return {
    utc: formatInTimeZone(d, "UTC", formatStr),
    local: format(d, formatStr),
  };
}

/**
 * Recharts tooltip label formatter that shows both UTC and local time.
 * Extracts _ts from payload to compute local time.
 */
export function dualTimeLabelFormatter(
  // biome-ignore lint/suspicious/noExplicitAny: recharts types use ReactNode
  label: any,
  // biome-ignore lint/suspicious/noExplicitAny: recharts payload type
  payload: readonly any[],
): string {
  const ts = payload?.[0]?.payload?._ts;
  if (!ts) return String(label);
  const d = new Date(ts);
  const utc = formatInTimeZone(d, "UTC", "MMM d, h:mm a");
  const local = format(d, "MMM d, h:mm a");
  return `UTC ${utc}  ·  Local ${local}`;
}
