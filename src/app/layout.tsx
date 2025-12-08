import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "https://pongo.sh"),
  title: {
    default: "Overview | Pongo.sh - open-source uptime monitoring",
    template: "%s | Pongo.sh - open-source uptime monitoring",
  },
  description: "Self-hosted uptime monitoring",
  keywords: [
    "uptime",
    "monitoring",
    "status page",
    "self-hosted",
    "open source",
  ],
  authors: [{ name: "Pongo.sh" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Pongo.sh",
    title: "Pongo.sh",
    description: "Self-hosted uptime monitoring",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pongo.sh",
    description: "Self-hosted uptime monitoring",
  },
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${jetbrainsMono.className} antialiased`}>
        <NuqsAdapter defaultOptions={{ shallow: false }}>
          <ThemeProvider defaultTheme="dark" storageKey="pongo-theme">
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
