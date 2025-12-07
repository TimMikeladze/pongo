import type { MonitorConfig } from "../../src/lib/config-types"

export default {
  name: "Auth Service",
  interval: "30s",
  timeout: "10s",
  active: true,

  async handler() {
    const start = Date.now()

    try {
      const res = await fetch("https://auth.example.com/status")
      const responseTime = Date.now() - start

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `HTTP ${res.status}`,
        }
      }

      return {
        status: responseTime > 500 ? "degraded" : "up",
        responseTime,
        statusCode: res.status,
      }
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
      }
    }
  },
} satisfies MonitorConfig
