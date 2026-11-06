"use client";

import { BarChart3, LineChart } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as ChartType);
      }}
      aria-label="Chart type"
      className={cn("chart-view-toggle", className)}
    >
      <ToggleGroupItem value="line" title="Line chart" aria-label="Line chart">
        <LineChart className="size-3.5" aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="bar" title="Bar chart" aria-label="Bar chart">
        <BarChart3 className="size-3.5" aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
