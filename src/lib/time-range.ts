import { subDays, subHours } from "date-fns";
import {
  createSearchParamsCache,
  parseAsStringLiteral,
  parseAsTimestamp,
} from "nuqs/server";

export const TIME_RANGE_PRESETS = [
  "1h",
  "24h",
  "7d",
  "30d",
  "90d",
  "180d",
  "360d",
] as const;
export type TimeRangePreset = (typeof TIME_RANGE_PRESETS)[number];

export const INTERVAL_OPTIONS = [
  "5m",
  "15m",
  "30m",
  "1h",
  "24h",
  "3d",
  "7d",
  "30d",
] as const;
export type IntervalOption = (typeof INTERVAL_OPTIONS)[number];

export const DEFAULT_PRESET: TimeRangePreset = "24h";
export const DEFAULT_INTERVAL: IntervalOption = "15m";

/**
 * Maximum number of data points to allow for chart queries.
 * This prevents excessive data loading for large time ranges with small intervals.
 */
export const MAX_DATA_POINTS = 500;

/**
 * Get the duration in milliseconds for a time range preset.
 */
export function getPresetDurationMs(preset: TimeRangePreset): number {
  switch (preset) {
    case "1h":
      return 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
    case "90d":
      return 90 * 24 * 60 * 60 * 1000;
    case "180d":
      return 180 * 24 * 60 * 60 * 1000;
    case "360d":
      return 360 * 24 * 60 * 60 * 1000;
  }
}

/**
 * Get allowed intervals for a given time range duration.
 * Intervals are allowed if they would produce <= MAX_DATA_POINTS data points.
 */
export function getAllowedIntervals(durationMs: number): IntervalOption[] {
  return INTERVAL_OPTIONS.filter((interval) => {
    const intervalMs = getIntervalMs(interval);
    const dataPoints = Math.ceil(durationMs / intervalMs);
    return dataPoints <= MAX_DATA_POINTS;
  });
}

/**
 * Get allowed intervals for a preset time range.
 */
export function getAllowedIntervalsForPreset(
  preset: TimeRangePreset,
): IntervalOption[] {
  return getAllowedIntervals(getPresetDurationMs(preset));
}

/**
 * Check if an interval is allowed for a given time range duration.
 */
export function isIntervalAllowed(
  interval: IntervalOption,
  durationMs: number,
): boolean {
  const intervalMs = getIntervalMs(interval);
  const dataPoints = Math.ceil(durationMs / intervalMs);
  return dataPoints <= MAX_DATA_POINTS;
}

/**
 * Get the best default interval for a time range duration.
 * Returns the smallest allowed interval for maximum granularity.
 */
export function getBestIntervalForDuration(durationMs: number): IntervalOption {
  const allowed = getAllowedIntervals(durationMs);
  // Return smallest allowed interval (first in array since INTERVAL_OPTIONS is sorted small to large)
  return allowed[0] || "30d";
}

export const timeRangeSearchParams = {
  preset: parseAsStringLiteral(TIME_RANGE_PRESETS).withDefault(DEFAULT_PRESET),
  from: parseAsTimestamp,
  to: parseAsTimestamp,
  interval:
    parseAsStringLiteral(INTERVAL_OPTIONS).withDefault(DEFAULT_INTERVAL),
};

export const timeRangeCache = createSearchParamsCache(timeRangeSearchParams);

export function getPresetRange(preset: TimeRangePreset): {
  from: Date;
  to: Date;
} {
  const to = new Date();
  let from: Date;

  switch (preset) {
    case "1h":
      from = subHours(to, 1);
      break;
    case "24h":
      from = subHours(to, 24);
      break;
    case "7d":
      from = subDays(to, 7);
      break;
    case "30d":
      from = subDays(to, 30);
      break;
    case "90d":
      from = subDays(to, 90);
      break;
    case "180d":
      from = subDays(to, 180);
      break;
    case "360d":
      from = subDays(to, 360);
      break;
    default:
      from = subHours(to, 24);
  }

  return { from, to };
}

export function getTimeRange(params: {
  preset: TimeRangePreset;
  from: Date | null;
  to: Date | null;
}): { from: Date; to: Date } {
  // Custom range takes precedence
  if (params.from && params.to) {
    return { from: params.from, to: params.to };
  }

  return getPresetRange(params.preset);
}

export function formatPresetLabel(preset: TimeRangePreset): string {
  return preset;
}

export function formatIntervalLabel(interval: IntervalOption): string {
  return interval;
}

export function getIntervalMs(interval: IntervalOption): number {
  switch (interval) {
    case "5m":
      return 5 * 60 * 1000;
    case "15m":
      return 15 * 60 * 1000;
    case "30m":
      return 30 * 60 * 1000;
    case "1h":
      return 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "3d":
      return 3 * 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
  }
}

/**
 * Format a bucket timestamp for display on charts.
 * Uses UTC to ensure consistent display across different server timezones.
 * Floors timestamp to interval boundary for clean display (e.g., 3:38 -> 3:35 for 5m interval).
 */
export function formatBucketLabel(
  timestamp: number | bigint | string,
  interval: IntervalOption,
): string {
  // Ensure timestamp is a number (handles bigint/string from database)
  // Floor to interval boundary to ensure clean display times
  const intervalMs = getIntervalMs(interval);
  const flooredTimestamp =
    Math.floor(Number(timestamp) / intervalMs) * intervalMs;
  const date = new Date(flooredTimestamp);
  switch (interval) {
    case "5m":
    case "15m":
    case "30m":
    case "1h":
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      });
    case "24h":
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        timeZone: "UTC",
      });
    case "3d":
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
    case "7d":
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
    case "30d":
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
  }
}
