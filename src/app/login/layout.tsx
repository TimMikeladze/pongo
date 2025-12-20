import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to access your uptime monitoring dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
