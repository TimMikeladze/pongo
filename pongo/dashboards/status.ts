import type { DashboardConfig } from "@/lib/config-types";

export default {
  name: "Status",
  slug: "status",
  public: true,
  monitors: [
    "example",
    "vercel",
    "cloudflare",
    "hackernews",
    "hackernews-py",
    "vercel-py",
  ],
  slaTarget: 99.9,
} satisfies DashboardConfig;
