"use client";

import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Suspense, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatIntervalLabel,
  formatPresetLabel,
  getBestIntervalForDuration,
  getPresetDurationMs,
  INTERVAL_OPTIONS,
  type IntervalOption,
  isIntervalAllowed,
  TIME_RANGE_PRESETS,
  type TimeRangePreset,
  timeRangeSearchParams,
} from "@/lib/time-range";
import { cn } from "@/lib/utils";

interface TimeRangePickerProps {
  disabled?: boolean;
}

export function TimeRangePicker({ disabled }: TimeRangePickerProps = {}) {
  if (disabled) {
    return <TimeRangePickerFallback showTooltip />;
  }
  return (
    <Suspense fallback={<TimeRangePickerFallback />}>
      <TimeRangePickerInner />
    </Suspense>
  );
}

function TimeRangePickerFallback({
  showTooltip = false,
}: {
  showTooltip?: boolean;
}) {
  const button = (
    <Button
      variant="outline"
      type="button"
      className={cn(
        "control-button",
        "text-muted-foreground cursor-not-allowed",
      )}
      disabled
    >
      <CalendarIcon className="h-3 w-3" />
      <span>Last 24h</span>
    </Button>
  );

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{button}</span>
        </TooltipTrigger>
        <TooltipContent>Not available on this page</TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

function TimeRangePickerInner() {
  const [{ preset, from, to, interval }, setParams] = useQueryStates(
    timeRangeSearchParams,
  );
  const [open, setOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>(
    from && to ? { from, to } : undefined,
  );

  const isCustom = from && to;

  // Calculate current duration for interval restrictions
  const currentDurationMs = isCustom
    ? to.getTime() - from.getTime()
    : getPresetDurationMs(preset);

  const handlePresetClick = (newPreset: TimeRangePreset) => {
    const newDurationMs = getPresetDurationMs(newPreset);
    // Auto-select best interval if current one isn't allowed
    const newInterval = isIntervalAllowed(interval, newDurationMs)
      ? interval
      : getBestIntervalForDuration(newDurationMs);
    setParams({
      preset: newPreset,
      from: null,
      to: null,
      interval: newInterval,
    });
    setCustomRange(undefined);
    setOpen(false);
  };

  const handleIntervalClick = (newInterval: IntervalOption) => {
    setParams({ interval: newInterval });
    setOpen(false);
  };

  const handleCustomApply = () => {
    if (customRange?.from && customRange?.to) {
      const customDurationMs =
        customRange.to.getTime() - customRange.from.getTime();
      // Auto-select best interval if current one isn't allowed
      const newInterval = isIntervalAllowed(interval, customDurationMs)
        ? interval
        : getBestIntervalForDuration(customDurationMs);
      setParams({
        preset: "24h", // Reset preset but it won't matter since custom range takes precedence
        from: customRange.from,
        to: customRange.to,
        interval: newInterval,
      });
      setOpen(false);
    }
  };

  const displayLabel = isCustom
    ? `${format(from, "MMM d")} - ${format(to, "MMM d")}`
    : formatPresetLabel(preset);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          aria-label="Reporting period"
          className={cn(
            "control-button",
            "text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors",
          )}
        >
          <CalendarIcon className="h-3 w-3" />
          <span>{displayLabel}</span>
          <span className="text-muted-foreground/50">|</span>
          <Clock className="h-3 w-3" />
          <span>{formatIntervalLabel(interval)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-[calc(100vw-2rem)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto p-0"
        align="end"
      >
        <div className="p-3 space-y-3">
          {/* Time Range Presets */}
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Time range
          </div>
          <fieldset
            className="flex gap-1 flex-wrap"
            aria-label="Reporting range"
          >
            {TIME_RANGE_PRESETS.map((p) => (
              <Button
                key={p}
                variant={!isCustom && preset === p ? "default" : "outline"}
                size="sm"
                className="text-xs h-8 px-2"
                onClick={() => handlePresetClick(p)}
              >
                {formatPresetLabel(p)}
              </Button>
            ))}
          </fieldset>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Interval Selection */}
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Interval
          </div>
          <fieldset
            className="flex gap-1 flex-wrap"
            aria-label="Aggregation interval"
          >
            {INTERVAL_OPTIONS.map((i) => {
              const allowed = isIntervalAllowed(i, currentDurationMs);
              const button = (
                <Button
                  key={i}
                  variant={interval === i ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "text-xs h-8 px-2",
                    !allowed && "opacity-40 cursor-not-allowed",
                  )}
                  onClick={() => allowed && handleIntervalClick(i)}
                  disabled={!allowed}
                >
                  {formatIntervalLabel(i)}
                </Button>
              );

              if (!allowed) {
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <span>{button}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Too many data points for this time range
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return button;
            })}
          </fieldset>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Custom range calendars */}
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Custom range
          </div>
          <Calendar
            mode="range"
            selected={customRange}
            onSelect={setCustomRange}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />

          {/* Apply button for custom range */}
          {customRange?.from && customRange?.to && (
            <div className="flex justify-end">
              <Button
                size="sm"
                className="text-xs h-8"
                onClick={handleCustomApply}
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
