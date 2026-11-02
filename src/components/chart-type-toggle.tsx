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
    <fieldset
      aria-label="Chart type"
      className={cn("chart-view-toggle", className)}
    >
      <button
        type="button"
        onClick={() => onChange("line")}
        title="Line chart"
        aria-label="Line chart"
        aria-pressed={value === "line"}
      >
        <LineChart className="size-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onChange("bar")}
        title="Bar chart"
        aria-label="Bar chart"
        aria-pressed={value === "bar"}
      >
        <BarChart3 className="size-3.5" aria-hidden="true" />
      </button>
    </fieldset>
  );
}
