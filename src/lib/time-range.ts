import {
  createSearchParamsCache,
  parseAsStringLiteral,
  parseAsTimestamp,
} from "nuqs/server";
import { subHours, subDays } from "date-fns";

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

export const INTERVAL_OPTIONS = ["1h", "24h", "3d", "7d", "30d"] as const;
export type IntervalOption = (typeof INTERVAL_OPTIONS)[number];

export const DEFAULT_PRESET: TimeRangePreset = "24h";
export const DEFAULT_INTERVAL: IntervalOption = "1h";

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
 */
export function formatBucketLabel(
  timestamp: number,
  interval: IntervalOption,
): string {
  const date = new Date(timestamp);
  switch (interval) {
    case "1h":
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    case "24h":
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
      });
    case "3d":
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    case "7d":
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    case "30d":
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}
