"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SectionWithTooltipProps {
  title: string;
  tooltip: string;
}

export function SectionWithTooltip({
  title,
  tooltip,
}: SectionWithTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground cursor-help">
          {title}
        </h3>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs bg-background border border-border text-foreground text-xs p-2 whitespace-normal"
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
