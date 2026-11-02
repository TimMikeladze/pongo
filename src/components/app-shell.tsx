"use client";

import {
  Activity,
  Bell,
  BookOpen,
  Check,
  ExternalLink,
  LayoutDashboard,
  LogIn,
  LogOut,
  Maximize,
  Minimize,
  Moon,
  Rss,
  Settings,
  SlidersHorizontal,
  Sun,
  Terminal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { logout } from "@/app/login/actions";
import { Github } from "@/components/brand-icons";
import { PongoLogo } from "@/components/pongo-logo";
import { SupportDialog } from "@/components/support-dialog";
import { useTheme } from "@/components/theme-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const navigation = [
  { name: "Overview", href: "/", icon: Terminal },
  { name: "Monitors", href: "/monitors", icon: Activity },
  { name: "Dashboards", href: "/dashboards", icon: LayoutDashboard },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({
  children,
  headerLogo,
  authEnabled = false,
  isAuthenticated = false,
  showHowItWorks = false,
}: {
  children: ReactNode;
  headerLogo?: string;
  authEnabled?: boolean;
  isAuthenticated?: boolean;
  showHowItWorks?: boolean;
}) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const publicNavRef = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);
  useEffect(() => {
    if (previousPath.current !== pathname) {
      mainRef.current?.scrollTo(0, 0);
      previousPath.current = pathname;
    }
    publicNavRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);
  const {
    density,
    toggleDensity,
    theme,
    resolvedTheme,
    setTheme,
    fullWidth,
    toggleFullWidth,
  } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!optionsOpen || !optionsTrigger.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setOptionsOpen(false);
    });
    observer.observe(optionsTrigger.current);
    return () => observer.disconnect();
  }, [optionsOpen]);
  useEffect(() => setMounted(true), []);
  const zen = mounted && density === "dense";
  const shared = pathname.startsWith("/shared/");
  const slug = shared ? pathname.split("/")[2] : null;
  const publicBase = slug ? `/shared/${slug}` : null;
  const operator = isAuthenticated && !shared && pathname !== "/login";
  const publicTabs = [
    { label: "Status", suffix: "" },
    { label: "Incidents", suffix: "/incidents" },
    { label: "Maintenance", suffix: "/maintenance" },
    { label: "Updates", suffix: "/announcements" },
    ...(showHowItWorks
      ? [{ label: "How it works", suffix: "/how-it-works" }]
      : []),
  ];
  const name = process.env.NEXT_PUBLIC_SITE_NAME ?? "pongo.sh";
  const context = process.env.NEXT_PUBLIC_HEADER_CAPTION ?? "Demo deployment";
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL?.trim();
  const showGithub =
    githubUrl && process.env.NEXT_PUBLIC_HIDE_GITHUB !== "true";

  useEffect(() => {
    if (!zen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        document.querySelector('[role="dialog"][data-state="open"]')
      )
        return;
      toggleDensity();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zen, toggleDensity]);

  const themeControl = (
    <button
      type="button"
      className="control-button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={`Switch to ${mounted && resolvedTheme === "light" ? "dark" : "light"} theme`}
      title={`Theme: ${theme}`}
    >
      {mounted && resolvedTheme === "light" ? (
        <Moon className="size-4" />
      ) : (
        <Sun className="size-4" />
      )}
    </button>
  );

  return (
    <div
      className="app-shell"
      data-full-width={mounted && fullWidth}
      data-zen={zen}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="app-header">
        <div className="shell-container" data-testid="shell-header">
          <Link href={publicBase ?? "/"} className="brand-link">
            <span className="brand-mark" aria-hidden="true">
              {headerLogo ? (
                <Image
                  src={headerLogo}
                  width={32}
                  height={32}
                  alt=""
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <PongoLogo size={32} />
              )}
            </span>
            <span className="brand-copy">
              <span className="brand-name" title={name}>
                {name}
              </span>
              <span className="brand-context" title={context}>
                {context}
              </span>
            </span>
          </Link>
          {operator && (
            <nav className="primary-nav" aria-label="Main navigation">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    (
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href)
                    )
                      ? "page"
                      : undefined
                  }
                >
                  <item.icon className="size-3.5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          )}
          <div className="header-controls">
            {themeControl}
            {shared && publicBase && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="control-button"
                    aria-label="Get status updates"
                  >
                    <Rss className="size-3.5" />
                    <span className="hidden sm:inline">Get updates</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <h2 className="text-sm font-semibold">
                    Follow service updates
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    Add a feed to your reader. No account required.
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`${publicBase}/feed.xml`}
                      className="control-button"
                    >
                      <Rss className="size-3.5" />
                      RSS feed
                    </Link>
                    <Link
                      href={`${publicBase}/feed.atom`}
                      className="control-button"
                    >
                      Atom feed
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {!operator &&
              !shared &&
              authEnabled &&
              !isAuthenticated &&
              pathname !== "/login" && (
                <Link href="/login" className="control-button">
                  <LogIn className="size-3.5" />
                  Sign in
                </Link>
              )}
          </div>
        </div>
      </header>
      {shared && publicBase && (
        <nav
          ref={publicNavRef}
          className="public-nav shell-container"
          aria-label="Status page navigation"
        >
          {publicTabs.map((tab) => (
            <Link
              key={tab.label}
              href={`${publicBase}${tab.suffix}`}
              aria-current={
                pathname === `${publicBase}${tab.suffix}` ? "page" : undefined
              }
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      )}
      <main
        ref={mainRef}
        id="main-content"
        className="app-main shell-container"
        data-testid="shell-main"
        tabIndex={-1}
      >
        {children}
      </main>
      <footer className="app-footer">
        <div className="shell-container" data-testid="shell-footer">
          <div className="flex items-center gap-2 min-w-0">
            {process.env.NEXT_PUBLIC_FOOTER_LOGO ? (
              <Image
                src={process.env.NEXT_PUBLIC_FOOTER_LOGO}
                width={20}
                height={20}
                alt=""
                unoptimized
                className="rounded-full"
              />
            ) : (
              <PongoLogo size={20} />
            )}
            <span>
              {process.env.NEXT_PUBLIC_FOOTER_TITLE ??
                process.env.NEXT_PUBLIC_SITE_NAME ??
                "pongo.sh"}
            </span>
            <a
              href={githubUrl || "https://github.com/TimMikeladze/pongo"}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline border-l border-border pl-3 ml-1 hover:text-foreground hover:underline"
            >
              {process.env.NEXT_PUBLIC_FOOTER_CAPTION ??
                "Open-source uptime monitoring"}
            </a>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {showGithub && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="control-button"
              >
                <Github className="size-3.5" aria-hidden="true" />
                GitHub
              </a>
            )}
            {publicBase && (
              <Link
                href={`${publicBase}/feed.xml`}
                className="control-button"
                aria-label="RSS feed"
              >
                <Rss className="size-3.5" />
                RSS
              </Link>
            )}
            {!zen && (
              <Popover open={optionsOpen} onOpenChange={setOptionsOpen}>
                <PopoverTrigger asChild>
                  <button
                    ref={optionsTrigger}
                    type="button"
                    className="control-button"
                  >
                    <SlidersHorizontal className="size-3.5" />
                    Page options
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  side="top"
                  onCloseAutoFocus={(event) => {
                    const bounds =
                      optionsTrigger.current?.getBoundingClientRect();
                    if (
                      bounds &&
                      (bounds.bottom <= 0 || bounds.top >= window.innerHeight)
                    )
                      event.preventDefault();
                  }}
                  className="w-64 max-h-[var(--radix-popover-content-available-height)] overflow-y-auto p-2 data-[state=closed]:animate-none"
                >
                  <div className="page-options">
                    <p className="px-2 py-1 text-xs text-muted-foreground">
                      View
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setOptionsOpen(false);
                        toggleFullWidth();
                      }}
                      aria-pressed={mounted && fullWidth}
                    >
                      {mounted && fullWidth ? (
                        <Minimize className="size-4" />
                      ) : (
                        <Maximize className="size-4" />
                      )}
                      {mounted && fullWidth
                        ? "Constrain width"
                        : "Use full width"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOptionsOpen(false);
                        toggleDensity();
                      }}
                    >
                      <Check className="size-4" /> Enter zen mode
                    </button>
                    <div className="my-1 border-t border-border" />
                    {!process.env.NEXT_PUBLIC_HIDE_DOCS && (
                      <a
                        href="https://github.com/TimMikeladze/pongo#readme"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <BookOpen className="size-4" /> Documentation
                      </a>
                    )}
                    {!process.env.NEXT_PUBLIC_HIDE_SUPPORT && (
                      <SupportDialog triggerClassName="page-options-dialog" />
                    )}
                    <SupportDialog
                      mode="about"
                      triggerClassName="page-options-dialog"
                    />
                    {authEnabled &&
                      (isAuthenticated ? (
                        <button type="button" onClick={() => logout()}>
                          <LogOut className="size-4" /> Sign out
                        </button>
                      ) : (
                        <Link
                          href="/login"
                          onClick={() => setOptionsOpen(false)}
                        >
                          <LogIn className="size-4" /> Sign in
                        </Link>
                      ))}
                    {shared && isAuthenticated && (
                      <Link href="/" onClick={() => setOptionsOpen(false)}>
                        <ExternalLink className="size-4" /> Operator overview
                      </Link>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </footer>
      {zen && (
        <div
          className="zen-controls"
          role="toolbar"
          aria-label="Zen mode controls"
        >
          <button
            type="button"
            className="control-button"
            onClick={toggleDensity}
            aria-label="Exit zen mode"
          >
            Exit zen <span className="text-muted-foreground">Esc</span>
          </button>
          {themeControl}
          <button
            type="button"
            className="control-button"
            onClick={toggleFullWidth}
            aria-label={fullWidth ? "Constrain width" : "Use full width"}
          >
            {fullWidth ? (
              <Minimize className="size-4" />
            ) : (
              <Maximize className="size-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
