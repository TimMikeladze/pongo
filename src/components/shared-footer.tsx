"use client";

import { format } from "date-fns";
import { Github } from "lucide-react";
import { PongoLogo } from "@/components/pongo-logo";
import { SupportDialog } from "@/components/support-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SharedFooterProps {
  renderedAt?: string;
}

export function SharedFooter({ renderedAt }: SharedFooterProps) {
  return (
    <footer className="flex-shrink-0 border-t border-border h-12">
      <div className="max-w-6xl mx-auto h-full px-4 md:px-6 flex items-center justify-between text-xs text-muted-foreground font-mono">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3 cursor-default">
              <PongoLogo className="h-6 w-6" />
              <div className="flex flex-col">
                <span className="font-medium">pongo.sh</span>
                <span className="text-[10px] text-muted-foreground/60">
                  open-source uptime monitoring
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {renderedAt ? (
              <div className="flex flex-col gap-0.5">
                <span>Local: {format(new Date(renderedAt), "HH:mm:ss")}</span>
                <span>UTC: {renderedAt.slice(11, 19)}</span>
              </div>
            ) : (
              "Rendered time unavailable"
            )}
          </TooltipContent>
        </Tooltip>
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href="https://github.com/timmikeladze/pongo"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
            </TooltipTrigger>
            <TooltipContent>GitHub</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <SupportDialog showLabel={false} />
              </span>
            </TooltipTrigger>
            <TooltipContent>Support</TooltipContent>
          </Tooltip>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
