import type { DashboardConfig } from "@/lib/config-types";

export default {
  name: "Status",
  slug: "status",
  public: true,
  monitors: ["github", "cloudflare", "aws", "vercel", "openai", "npm"],
  slaTarget: 99.9,
} satisfies DashboardConfig;
