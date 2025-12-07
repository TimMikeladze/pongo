import type { DashboardConfig } from "../../src/lib/config-types";

export default {
  name: "Demo Dashboard",
  slug: "demo-dashboard",
  public: true,
  monitors: ["github", "example"],
  slaTarget: 99.9,
} satisfies DashboardConfig;
