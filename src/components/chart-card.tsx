"use client";

import {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Zap,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import {
  ChartTypeToggle,
  type ChartType,
} from "@/components/chart-type-toggle";
import { cn } from "@/lib/utils";

const ChartTypeContext = createContext<ChartType>("line");
const FullscreenContext = createContext<boolean>(false);

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

type IconName = keyof typeof iconMap;

interface ChartCardProps {
  title: string;
  icon?: IconName;
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

  const handleClose = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isFullscreen, handleClose]);

  const cardContent = (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className={cn("h-3 w-3", iconClassName)} />}
          <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {showToggle && (
            <ChartTypeToggle value={chartType} onChange={setChartType} />
          )}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
      <ChartTypeContext.Provider value={chartType}>
        <FullscreenContext.Provider value={isFullscreen}>
          <div className={cn(isFullscreen && "flex-1 min-h-0")}>{children}</div>
        </FullscreenContext.Provider>
      </ChartTypeContext.Provider>
    </>
  );

  if (isFullscreen) {
    return (
      <>
        {/* Placeholder to maintain layout */}
        <div
          className={cn(
            "border border-border rounded bg-card p-4 invisible",
            className,
          )}
        >
          {cardContent}
        </div>
        {/* Fullscreen overlay - positioned below the app header (h-12 = 48px) */}
        <div className="fixed inset-x-0 top-12 bottom-0 z-40 bg-background/95 backdrop-blur-sm flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              {Icon && <Icon className={cn("h-4 w-4", iconClassName)} />}
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground">
                {title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {showToggle && (
                <ChartTypeToggle value={chartType} onChange={setChartType} />
              )}
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                title="Close fullscreen (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 border border-border rounded bg-card p-6 flex flex-col min-h-0">
            <ChartTypeContext.Provider value={chartType}>
              <FullscreenContext.Provider value={true}>
                <div className="flex-1 min-h-0">{children}</div>
              </FullscreenContext.Provider>
            </ChartTypeContext.Provider>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={cn("border border-border rounded bg-card p-4", className)}>
      {cardContent}
    </div>
  );
}
