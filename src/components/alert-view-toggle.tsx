"use client";

import { List, Table } from "lucide-react";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";

export type AlertView = "timeline" | "table";

export function AlertViewToggle() {
  const [view, setView] = useQueryState("view", {
    defaultValue: "timeline" as AlertView,
    parse: (v) => (v === "table" ? "table" : "timeline") as AlertView,
  });

  return (
    <fieldset
      className="flex items-center border border-border rounded-md overflow-hidden"
      aria-label="Alert history view"
    >
      <button
        type="button"
        onClick={() => setView("timeline")}
        aria-pressed={view === "timeline"}
        className={cn(
          "flex items-center gap-1.5 min-h-8 px-3 py-1.5 text-xs",
          view === "timeline"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary",
        )}
      >
        <List className="h-3.5 w-3.5" />
        Timeline
      </button>
      <button
        type="button"
        onClick={() => setView("table")}
        aria-pressed={view === "table"}
        className={cn(
          "flex items-center gap-1.5 min-h-8 px-3 py-1.5 text-xs",
          view === "table"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary",
        )}
      >
        <Table className="h-3.5 w-3.5" />
        Table
      </button>
    </fieldset>
  );
}
