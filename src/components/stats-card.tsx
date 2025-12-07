"use client";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  className,
}: StatsCardProps) {
  const { density } = useTheme();
  const isDense = density === "dense";

  return (
    <div
      className={cn(
        "rounded border border-border bg-card",
        isDense ? "p-2" : "p-4",
        className,
      )}
    >
      <div
        className={cn(
          "uppercase tracking-wider text-muted-foreground",
          isDense ? "text-[8px] mb-1" : "text-[10px] mb-2",
        )}
      >
        {title}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-light tracking-tight",
            isDense ? "text-lg" : "text-2xl",
            trend === "up" && "text-status-up",
            trend === "down" && "text-status-down",
          )}
        >
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              isDense ? "text-[10px]" : "text-xs",
              trend === "up" && "text-status-up",
              trend === "down" && "text-status-down",
              trend === "neutral" && "text-muted-foreground",
            )}
          >
            {trend === "up" && "↑"}
            {trend === "down" && "↓"}
            {trend === "neutral" && "—"}
          </span>
        )}
      </div>
      {description && (
        <p
          className={cn(
            "text-muted-foreground",
            isDense ? "mt-0.5 text-[8px]" : "mt-1 text-[10px]",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
