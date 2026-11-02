"use client";

import { useTheme } from "@/components/theme-provider";

export function AppearanceControls() {
  const { theme, setTheme, density, setDensity, fullWidth, setFullWidth } =
    useTheme();
  const selectClass =
    "h-9 rounded-md border border-border bg-background px-3 text-sm";
  return (
    <div className="divide-y divide-border">
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <label htmlFor="appearance-theme" className="text-sm font-medium">
            Theme
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Use a light, dark, or system appearance.
          </p>
        </div>
        <select
          id="appearance-theme"
          value={theme}
          onChange={(event) =>
            setTheme(event.target.value as "light" | "dark" | "system")
          }
          className={selectClass}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <label htmlFor="appearance-density" className="text-sm font-medium">
            View mode
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Zen mode hides the navigation and footer. Press Escape to restore
            them.
          </p>
        </div>
        <select
          id="appearance-density"
          value={density}
          onChange={(event) =>
            setDensity(event.target.value as "normal" | "dense")
          }
          className={selectClass}
        >
          <option value="normal">Standard</option>
          <option value="dense">Zen mode</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <label htmlFor="appearance-width" className="text-sm font-medium">
            Content width
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Use the page width or fill your screen.
          </p>
        </div>
        <select
          id="appearance-width"
          value={fullWidth ? "full" : "standard"}
          onChange={(event) => setFullWidth(event.target.value === "full")}
          className={selectClass}
        >
          <option value="standard">Standard</option>
          <option value="full">Full width</option>
        </select>
      </div>
    </div>
  );
}
