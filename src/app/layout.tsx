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
  title: "pongo",
  description: "Self-hosted uptime monitoring",
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
