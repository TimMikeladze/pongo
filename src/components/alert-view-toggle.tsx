"use client";

import { List, Table } from "lucide-react";
import { useQueryState } from "nuqs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type AlertView = "timeline" | "table";

export function AlertViewToggle() {
  const [view, setView] = useQueryState("view", {
    defaultValue: "timeline" as AlertView,
    parse: (v) => (v === "table" ? "table" : "timeline") as AlertView,
  });

  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(next) => {
        if (next) setView(next as AlertView);
      }}
      className="flex items-center border border-border rounded-md overflow-hidden"
      aria-label="Alert history view"
    >
      <ToggleGroupItem
        value="timeline"
        className={cn(
          "flex items-center gap-1.5 min-h-8 px-3 py-1.5 text-xs",
          view === "timeline"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary",
        )}
      >
        <List className="h-3.5 w-3.5" />
        Timeline
      </ToggleGroupItem>
      <ToggleGroupItem
        value="table"
        className={cn(
          "flex items-center gap-1.5 min-h-8 px-3 py-1.5 text-xs",
          view === "table"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary",
        )}
      >
        <Table className="h-3.5 w-3.5" />
        Table
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
