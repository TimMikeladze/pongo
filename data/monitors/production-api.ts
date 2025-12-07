import type { MonitorConfig } from "@/lib/config-types"

export default {
  name: "Production API",
  url: "https://api.example.com/health",
  method: "GET",
  interval: "1m",
  timeout: "30s",
  expectedStatus: 200,
  active: true,
} satisfies MonitorConfig
