import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { PublicHeaderProvider } from "@/components/public-header-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { isAuthEnabled, isAuthenticated } from "@/lib/auth";
import { UmamiScript } from "@/lib/umami";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "https://pongo.sh"),
  title: {
    default: "Overview | pongo.sh - open-source uptime monitoring",
    template: "%s | pongo.sh - open-source uptime monitoring",
  },
  description: "Self-hosted uptime monitoring",
  keywords: [
    "uptime",
    "monitoring",
    "status page",
    "self-hosted",
    "open source",
  ],
  authors: [{ name: "pongo.sh" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "pongo.sh",
    title: "pongo.sh",
    description: "Self-hosted uptime monitoring",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "pongo.sh - Self-hosted uptime monitoring",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "pongo.sh",
    description: "Self-hosted uptime monitoring",
    images: ["/banner.png"],
  },
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Optional header logo from env (path to file in /public, e.g., "/logo.png")
  const headerLogo = process.env.HEADER_LOGO || undefined;

  // Auth state for AppShell
  const authEnabled = isAuthEnabled();
  const authenticated = await isAuthenticated();

  // Structured data for SEO (Organization schema)
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://pongo.sh";
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "pongo.sh",
    description: "Self-hosted uptime monitoring",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: ["https://github.com/TimMikeladze/pongo"],
  };

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Blocking theme script - runs before paint to prevent FOUC */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static inline script with no user input
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("pongo-theme")||"dark";if(t==="system"){t=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}document.documentElement.classList.remove("light","dark");document.documentElement.classList.add(t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${jetbrainsMono.className} antialiased`}>
        {/* Structured data for search engines - using JSON.stringify with static data is safe */}
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Safe - JSON.stringify with static configuration data only
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        {/* Analytics - only loads if NEXT_PUBLIC_UMAMI_WEBSITE_ID and NEXT_PUBLIC_UMAMI_URL are set */}
        <UmamiScript />
        <NuqsAdapter defaultOptions={{ shallow: false }}>
          <ThemeProvider defaultTheme="dark" storageKey="pongo-theme">
            <PublicHeaderProvider>
              <AppShell
                headerLogo={headerLogo}
                authEnabled={authEnabled}
                isAuthenticated={authenticated}
              >
                {children}
              </AppShell>
            </PublicHeaderProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
