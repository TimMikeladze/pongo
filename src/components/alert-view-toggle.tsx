"use client";

import { useQueryState } from "nuqs";
import { List, Table } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertView = "timeline" | "table";

export function AlertViewToggle() {
  const [view, setView] = useQueryState("view", {
    defaultValue: "timeline" as AlertView,
    parse: (v) => (v === "table" ? "table" : "timeline") as AlertView,
  });

  return (
    <div className="flex items-center border border-border rounded overflow-hidden">
      <button
        type="button"
        onClick={() => setView("timeline")}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 text-[10px]",
          view === "timeline"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        <List className="h-3 w-3" />
        Timeline
      </button>
      <button
        type="button"
        onClick={() => setView("table")}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 text-[10px]",
          view === "table"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        <Table className="h-3 w-3" />
        Table
      </button>
    </div>
  );
}
