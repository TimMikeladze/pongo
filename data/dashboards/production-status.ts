import type { DashboardConfig } from "../../src/lib/config-types"

export default {
  name: "Production Status",
  slug: "production",
  public: true,
  monitors: ["production-api", "auth-service", "marketing-website"],
  slaTarget: 99.9,
} satisfies DashboardConfig
