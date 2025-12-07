import type { MonitorConfig } from "../../src/lib/config-types";

export default {
  name: "Marketing Website",
  interval: "5m",
  timeout: "30s",
  active: true,

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch("https://www.example.com");
      const responseTime = Date.now() - start;

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `HTTP ${res.status}`,
        };
      }

      return {
        status: responseTime > 2000 ? "degraded" : "up",
        responseTime,
        statusCode: res.status,
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
} satisfies MonitorConfig;
