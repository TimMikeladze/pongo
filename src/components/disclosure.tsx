"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function Disclosure({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Collapsible className={cn("performance-disclosure", className)}>
      <h2>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="performance-trigger h-auto w-full whitespace-normal rounded-md"
          >
            <ChevronRight
              className="size-4 shrink-0 transition-transform"
              aria-hidden="true"
            />
            <span className="disclosure-title">{title}</span>
            <span>{description}</span>
          </Button>
        </CollapsibleTrigger>
      </h2>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}
