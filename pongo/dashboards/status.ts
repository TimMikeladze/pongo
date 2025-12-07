import type { DashboardConfig } from "@/lib/config-types";

export default {
  name: "Status",
  slug: "status",
  public: true,
  monitors: ["vercel", "hackernews", "wikipedia"],
  slaTarget: 99.9,
} satisfies DashboardConfig;
