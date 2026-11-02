"use client";

import { BarChart3, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChartType = "line" | "bar";

interface ChartTypeToggleProps {
  value: ChartType;
  onChange: (type: ChartType) => void;
  className?: string;
}

export function ChartTypeToggle({
  value,
  onChange,
  className,
}: ChartTypeToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 bg-secondary/50 rounded p-0.5",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange("line")}
        className={cn(
          "min-h-8 min-w-8 p-1 rounded transition-colors",
          value === "line"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        title="Line chart"
        aria-label="Line chart"
        aria-pressed={value === "line"}
      >
        <LineChart className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => onChange("bar")}
        className={cn(
          "min-h-8 min-w-8 p-1 rounded transition-colors",
          value === "bar"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        title="Bar chart"
        aria-label="Bar chart"
        aria-pressed={value === "bar"}
      >
        <BarChart3 className="h-3 w-3" />
      </button>
    </div>
  );
}
