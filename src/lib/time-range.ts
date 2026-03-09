import {
  createSearchParamsCache,
  parseAsStringLiteral,
  parseAsTimestamp,
} from "nuqs/server";
import { parseDuration } from "@/lib/config-types";

const DEFAULT_PRESETS = "1h,24h,7d,30d,90d,180d,360d";
const DEFAULT_INTERVALS = "15m,30m,1h,24h,3d,7d,30d";

function parseEnvList(
  envValue: string | undefined,
  fallback: string,
): string[] {
  const raw = envValue?.trim() || fallback;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const TIME_RANGE_PRESETS: readonly string[] = parseEnvList(
  process.env.NEXT_PUBLIC_TIME_RANGE_PRESETS,
  DEFAULT_PRESETS,
);
export type TimeRangePreset = string;

export const INTERVAL_OPTIONS: readonly string[] = parseEnvList(
  process.env.NEXT_PUBLIC_INTERVAL_OPTIONS,
  DEFAULT_INTERVALS,
);
export type IntervalOption = string;

const envDefaultPreset =
  process.env.NEXT_PUBLIC_DEFAULT_PRESET?.trim() || "24h";
export const DEFAULT_PRESET: TimeRangePreset = TIME_RANGE_PRESETS.includes(
  envDefaultPreset,
)
  ? envDefaultPreset
  : TIME_RANGE_PRESETS[0];

const envDefaultInterval =
  process.env.NEXT_PUBLIC_DEFAULT_INTERVAL?.trim() || "15m";
export const DEFAULT_INTERVAL: IntervalOption = INTERVAL_OPTIONS.includes(
  envDefaultInterval,
)
  ? envDefaultInterval
  : INTERVAL_OPTIONS[0];

/**
 * Maximum number of data points to allow for chart queries.
 * This prevents excessive data loading for large time ranges with small intervals.
 */
export const MAX_DATA_POINTS = 500;

/**
 * Get the duration in milliseconds for a time range preset.
 */
export function getPresetDurationMs(preset: TimeRangePreset): number {
  return parseDuration(preset);
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
  preset: parseAsStringLiteral(
    TIME_RANGE_PRESETS as unknown as readonly [string, ...string[]],
  ).withDefault(DEFAULT_PRESET),
  from: parseAsTimestamp,
  to: parseAsTimestamp,
  interval: parseAsStringLiteral(
    INTERVAL_OPTIONS as unknown as readonly [string, ...string[]],
  ).withDefault(DEFAULT_INTERVAL),
};

export const timeRangeCache = createSearchParamsCache(timeRangeSearchParams);

export function getPresetRange(preset: TimeRangePreset): {
  from: Date;
  to: Date;
} {
  const to = new Date();
  const durationMs = parseDuration(preset);
  const from = new Date(to.getTime() - durationMs);
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
  return parseDuration(interval);
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
  const intervalMs = getIntervalMs(interval);
  const flooredTimestamp =
    Math.floor(Number(timestamp) / intervalMs) * intervalMs;
  const date = new Date(flooredTimestamp);

  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (intervalMs < ONE_DAY) {
    // Sub-day intervals: show time
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  }

  if (intervalMs === ONE_DAY) {
    // Exactly 1 day: show date + time
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      timeZone: "UTC",
    });
  }

  // Multi-day intervals: show date only
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
