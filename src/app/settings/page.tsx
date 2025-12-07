import { Bell, Database, Palette } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your uptime monitor configuration",
  robots: {
    index: false,
    follow: false,
  },
};

import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const settingsLinks = [
  {
    title: "Notifications",
    description: "Configure email, SMS, and webhook alerts",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    title: "Appearance",
    description: "Customize the look and feel",
    href: "/settings/appearance",
    icon: Palette,
    disabled: true,
  },
  {
    title: "Data & Storage",
    description: "Manage data retention and backups",
    href: "/settings/data",
    icon: Database,
    disabled: true,
  },
];

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your uptime monitor configuration
        </p>
      </div>

      <div className="grid gap-4">
        {settingsLinks.map((item) => (
          <Card
            key={item.href}
            className={item.disabled ? "opacity-50 pointer-events-none" : ""}
          >
            <Link href={item.href}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
