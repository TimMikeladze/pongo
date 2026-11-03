"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Maximize2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
  type ChartType,
  ChartTypeToggle,
} from "@/components/chart-type-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const ChartTypeContext = createContext<ChartType>("line");
const FullscreenContext = createContext(false);
export function useChartType(): ChartType {
  return useContext(ChartTypeContext);
}
export function useChartFullscreen(): boolean {
  return useContext(FullscreenContext);
}
const iconMap = {
  activity: Activity,
  "alert-triangle": AlertTriangle,
  "check-circle": CheckCircle,
  "trending-up": TrendingUp,
  zap: Zap,
} as const;

interface ChartCardProps {
  title: string;
  icon?: keyof typeof iconMap;
  iconClassName?: string;
  children: ReactNode;
  defaultChartType?: ChartType;
  showToggle?: boolean;
  className?: string;
}
export function ChartCard({
  title,
  icon,
  iconClassName,
  children,
  defaultChartType = "line",
  showToggle = true,
  className,
}: ChartCardProps) {
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const Icon = icon ? iconMap[icon] : null;
  return (
    <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
      <div
        className={cn("chart-surface", isFullscreen && "invisible", className)}
      >
        <div className="flex justify-between items-center gap-3 mb-3">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            {Icon && (
              <Icon
                className={cn("size-3.5 text-muted-foreground", iconClassName)}
              />
            )}
            {title}
          </h3>
          <div className="flex gap-1 items-center">
            {showToggle && (
              <ChartTypeToggle value={chartType} onChange={setChartType} />
            )}
            <DialogTrigger asChild>
              <Button
                variant="outline"
                type="button"
                className="control-button border-transparent"
                aria-label={`Expand ${title} chart`}
                title="Fullscreen"
              >
                <Maximize2 className="size-3.5" />
              </Button>
            </DialogTrigger>
          </div>
        </div>
        <ChartTypeContext.Provider value={chartType}>
          <FullscreenContext.Provider value={false}>
            {children}
          </FullscreenContext.Provider>
        </ChartTypeContext.Provider>
      </div>
      <DialogContent
        className="inset-4 top-4 left-4 translate-x-0 translate-y-0 w-auto max-w-none sm:max-w-none h-[calc(100dvh-2rem)] flex flex-col p-4 sm:p-6"
        aria-label={`${title} chart`}
      >
        <DialogHeader className="pr-8">
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Expanded performance chart. Press Escape to return.
          </DialogDescription>
        </DialogHeader>
        {showToggle && (
          <div>
            <ChartTypeToggle value={chartType} onChange={setChartType} />
          </div>
        )}
        <div className="flex-1 min-h-0">
          <ChartTypeContext.Provider value={chartType}>
            <FullscreenContext.Provider value={true}>
              {children}
            </FullscreenContext.Provider>
          </ChartTypeContext.Provider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
