"use client";

import { useTheme } from "@/components/theme-provider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AppearanceControls() {
  const { theme, setTheme, density, setDensity, fullWidth, setFullWidth } =
    useTheme();
  return (
    <div className="divide-y divide-border">
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <Label htmlFor="appearance-theme" className="text-sm font-medium">
            Theme
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Use a light, dark, or system appearance.
          </p>
        </div>
        <Select
          value={theme}
          onValueChange={(value) =>
            setTheme(value as "light" | "dark" | "system")
          }
        >
          <SelectTrigger id="appearance-theme" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <Label htmlFor="appearance-density" className="text-sm font-medium">
            View mode
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Zen mode hides the navigation and footer. Press Escape to restore
            them.
          </p>
        </div>
        <Select
          value={density}
          onValueChange={(value) => setDensity(value as "normal" | "dense")}
        >
          <SelectTrigger id="appearance-density" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Standard</SelectItem>
            <SelectItem value="dense">Zen mode</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <Label htmlFor="appearance-width" className="text-sm font-medium">
            Content width
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Use the page width or fill your screen.
          </p>
        </div>
        <Select
          value={fullWidth ? "full" : "standard"}
          onValueChange={(value) => setFullWidth(value === "full")}
        >
          <SelectTrigger id="appearance-width" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="full">Full width</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
