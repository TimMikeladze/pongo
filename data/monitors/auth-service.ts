import type { MonitorConfig } from "@/lib/config-types"

export default {
  name: "Auth Service",
  url: "https://auth.example.com/status",
  method: "GET",
  interval: "30s",
  timeout: "10s",
  expectedStatus: 200,
  active: true,
} satisfies MonitorConfig
