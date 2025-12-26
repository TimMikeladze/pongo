import type { DashboardConfig } from "@/lib/config-types";

export default {
  name: "Dog Food",
  slug: "dogfood",
  public: true,
  monitors: ["pongo"],
  slaTarget: 99.9,
} satisfies DashboardConfig;
