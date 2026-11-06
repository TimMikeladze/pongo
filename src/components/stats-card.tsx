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
  return (
    <div className={className}>
      <div className="metric-label">{title}</div>
      <div
        className={cn("metric-value", trend === "down" && "text-status-down")}
      >
        {value}
      </div>
      {description && <p className="metric-description">{description}</p>}
    </div>
  );
}
