"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function DensityToggle() {
  const { density, toggleDensity } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="p-1.5 text-muted-foreground rounded hover:bg-secondary"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleDensity}
      className={cn(
        "p-1.5 rounded transition-colors",
        "text-muted-foreground hover:text-foreground hover:bg-secondary",
      )}
      title={density === "normal" ? "Enter zen mode (z)" : "Exit zen mode (z)"}
    >
      {density === "normal" ? (
        <Maximize2 className="h-3.5 w-3.5" />
      ) : (
        <Minimize2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
