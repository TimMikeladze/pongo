"use client";

import {
  Activity,
  Bell,
  Coffee,
  Github,
  Heart,
  Info,
  LayoutDashboard,
  Linkedin,
  Maximize,
  Minimize,
  Minimize2,
  Monitor,
  Moon,
  Share2,
  Star,
  Sun,
  Terminal,
  Twitter,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { useFullscreen } from "@/components/fullscreen-provider";
import { PongoLogo } from "@/components/pongo-logo";
import { SupportDialog } from "@/components/support-dialog";
import { useTheme } from "@/components/theme-provider";
import { TimeRangePicker } from "@/components/time-range-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GridPattern } from "@/components/ui/grid-pattern";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-label="Bluesky"
      role="img"
    >
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
    </svg>
  );
}

const navigation = [
  { name: "overview", href: "/", icon: Terminal },
  { name: "monitors", href: "/monitors", icon: Activity },
  { name: "dashboards", href: "/dashboards", icon: LayoutDashboard },
  { name: "alerts", href: "/alerts", icon: Bell },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    density,
    toggleDensity,
    theme,
    setTheme,
    fullWidth,
    toggleFullWidth,
  } = useTheme();
  const { isFullscreen: isChartFullscreen } = useFullscreen();
  const [mounted, setMounted] = useState(false);
  const [showZenControls, setShowZenControls] = useState(false);
  const [zenSupportOpen, setZenSupportOpen] = useState(false);
  const [zenAboutOpen, setZenAboutOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "Escape" && density === "dense") {
        toggleDensity();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleDensity, density]);

  const isPublicPage = pathname.startsWith("/shared/");
  const isLoginPage = pathname === "/login";

  if (isPublicPage || isLoginPage) {
    return <>{children}</>;
  }

  const isDense = mounted && density === "dense";

  // Disable time range picker on list pages
  const disableTimeRangePicker =
    pathname === "/monitors" ||
    pathname === "/dashboards" ||
    pathname.startsWith("/settings");

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <GridPattern
          width={30}
          height={30}
          x={-1}
          y={-1}
          strokeDasharray="4 2"
          className="h-full w-full [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,white,transparent)]"
        />
      </div>
      <header
        className={cn(
          "shrink-0 border-b border-border bg-background transition-all duration-300 relative z-10",
          isDense ? "h-0 opacity-0 overflow-hidden" : "h-12",
        )}
      >
        <div
          className={cn(
            "mx-auto h-full px-4 md:px-6 flex items-center justify-between relative",
            !fullWidth && "md:max-w-6xl",
          )}
        >
          <div className="flex items-center">
            <nav className="flex items-center gap-1">
              {navigation.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 text-xs transition-colors rounded",
                      isActive
                        ? "text-primary bg-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <TimeRangePicker disabled={disableTimeRangePicker} />
          </div>
        </div>
      </header>

      {isDense && (
        <div
          role="toolbar"
          aria-label="Zen mode controls"
          className="fixed top-4 right-4 z-50"
          onMouseEnter={() => setShowZenControls(true)}
          onMouseLeave={() => setShowZenControls(false)}
        >
          <div
            className={cn(
              "relative flex items-center gap-1 transition-all duration-300 ease-out",
              showZenControls
                ? "bg-background/95 backdrop-blur-md border border-border shadow-lg rounded-full px-1 py-1"
                : "bg-transparent",
            )}
          >
            <div
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 transition-all duration-300",
                showZenControls ? "opacity-0 scale-0" : "opacity-100 scale-100",
              )}
            >
              <div className="w-2 h-2 rounded-full bg-primary/40 hover:bg-primary/60 cursor-pointer" />
            </div>

            <div
              className={cn(
                "flex items-center gap-0.5 transition-all duration-300",
                showZenControls
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none",
              )}
            >
              <button
                type="button"
                onClick={toggleFullWidth}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title={fullWidth ? "Constrain width" : "Full width"}
              >
                {fullWidth ? (
                  <Minimize className="h-3.5 w-3.5" />
                ) : (
                  <Maximize className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={toggleDensity}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Exit zen mode (Esc)"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  // Cycle: dark -> light -> system -> dark
                  if (theme === "dark") setTheme("light");
                  else if (theme === "light") setTheme("system");
                  else setTheme("dark");
                }}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title={`Theme: ${theme}`}
              >
                {theme === "dark" && <Moon className="h-3.5 w-3.5" />}
                {theme === "light" && <Sun className="h-3.5 w-3.5" />}
                {theme === "system" && <Monitor className="h-3.5 w-3.5" />}
              </button>
              <a
                href="https://github.com/timmikeladze/pongo"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="GitHub"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
              <Dialog open={zenSupportOpen} onOpenChange={setZenSupportOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="p-2 rounded-full text-muted-foreground hover:text-pink-500 hover:bg-accent transition-colors"
                    title="Support pongo.sh"
                  >
                    <Heart className="h-3.5 w-3.5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-sm font-mono">
                      {/* keep this empty */}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-muted-foreground">
                      pongo.sh is free and open source. here are some ways to
                      support the project:
                    </p>
                    <div className="space-y-2">
                      <a
                        href="https://github.com/timmikeladze/pongo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded border border-border hover:bg-accent transition-colors group"
                      >
                        <Star className="h-4 w-4 text-muted-foreground group-hover:text-yellow-500 transition-colors" />
                        <div>
                          <div className="text-xs font-medium">
                            star on github
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            help others discover pongo.sh
                          </div>
                        </div>
                      </a>
                      <a
                        href="https://github.com/timmikeladze/pongo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded border border-border hover:bg-accent transition-colors group"
                      >
                        <Github className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <div>
                          <div className="text-xs font-medium">contribute</div>
                          <div className="text-[10px] text-muted-foreground">
                            report bugs or submit pull requests
                          </div>
                        </div>
                      </a>
                      <a
                        href="https://github.com/sponsors/timmikeladze"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded border border-border hover:bg-accent transition-colors group"
                      >
                        <Coffee className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                        <div>
                          <div className="text-xs font-medium">sponsor</div>
                          <div className="text-[10px] text-muted-foreground">
                            support ongoing development
                          </div>
                        </div>
                      </a>
                      <a
                        href="https://twitter.com/intent/tweet?text=Check%20out%20pongo%20-%20open%20source%20uptime%20monitoring&url=https://pongo.sh"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded border border-border hover:bg-accent transition-colors group"
                      >
                        <Share2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <div>
                          <div className="text-xs font-medium">share us</div>
                          <div className="text-[10px] text-muted-foreground">
                            spread the word on social media
                          </div>
                        </div>
                      </a>
                      <div className="flex items-center justify-center gap-4 p-3 rounded border border-border">
                        <a
                          href="https://github.com/timmikeladze"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="GitHub"
                        >
                          <Github className="h-4 w-4" />
                        </a>
                        <a
                          href="https://twitter.com/linesofcode"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Twitter"
                        >
                          <Twitter className="h-4 w-4" />
                        </a>
                        <a
                          href="https://bsky.app/profile/linesofcode"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-[#0085ff] transition-colors"
                          title="Bluesky"
                        >
                          <BlueskyIcon className="h-4 w-4" />
                        </a>
                        <a
                          href="https://linkedin.com/in/tim-mikeladze"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-[#0a66c2] transition-colors"
                          title="LinkedIn"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={zenAboutOpen} onOpenChange={setZenAboutOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="About pongo.sh"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-sm font-mono">
                      {/* keep this empty */}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      pongo.sh is an open source uptime monitoring solution
                      designed for developers who prefer configuration as code.
                      define your monitors as simple typescript files, commit
                      them to your repository, and deploy anywhere that runs
                      node.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      track response times, uptime percentages, error rates, and
                      latency percentiles with real-time dashboards. create
                      beautiful public status pages to keep your users informed
                      about service health.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      no database required — pongo.sh reads monitor definitions
                      directly from your filesystem. results are stored locally
                      in sqlite, making it lightweight, portable, and easy to
                      backup.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div
            className={cn(
              "absolute top-full right-0 mt-2 text-[10px] text-muted-foreground/50 whitespace-nowrap transition-opacity duration-300",
              showZenControls ? "opacity-100" : "opacity-0",
            )}
          >
            esc to exit
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto relative z-10">
        <div
          className={cn(
            "mx-auto px-4 md:px-6 py-4 md:py-6",
            !fullWidth && "md:max-w-6xl",
          )}
        >
          {children}
        </div>
      </main>

      <footer
        className={cn(
          "shrink-0 border-t border-border bg-background relative z-10 transition-all duration-300 h-12",
          (isDense || isChartFullscreen) && "h-0 opacity-0 overflow-hidden",
        )}
      >
        <div
          className={cn(
            "mx-auto h-full px-4 md:px-6 flex items-center justify-between text-xs text-muted-foreground font-mono",
            !fullWidth && "md:max-w-6xl",
          )}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-medium">
              <PongoLogo className="h-5 w-5" />
              <span>pongo.sh</span>
            </div>
            <span className="text-muted-foreground/60">
              open-source uptime monitoring
            </span>
          </div>
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
            <SupportDialog showLabel={false} />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleFullWidth}
                  className="hidden md:flex hover:text-foreground transition-colors"
                >
                  {fullWidth ? (
                    <Minimize className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize className="h-3.5 w-3.5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {fullWidth ? "Constrain width" : "Full width"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleDensity}
                  className="hidden md:flex hover:text-foreground transition-colors"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Zen mode</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    // Cycle: dark -> light -> system -> dark
                    if (theme === "dark") setTheme("light");
                    else if (theme === "light") setTheme("system");
                    else setTheme("dark");
                  }}
                  className="hover:text-foreground transition-colors"
                >
                  {mounted && theme === "dark" && (
                    <Moon className="h-3.5 w-3.5" />
                  )}
                  {mounted && theme === "light" && (
                    <Sun className="h-3.5 w-3.5" />
                  )}
                  {mounted && theme === "system" && (
                    <Monitor className="h-3.5 w-3.5" />
                  )}
                  {!mounted && <Moon className="h-3.5 w-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>Theme: {theme}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </footer>
    </div>
  );
}
