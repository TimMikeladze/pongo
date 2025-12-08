import { monitor } from "../../src/lib/config-types";

const TEST_SERVER = process.env.TEST_SERVER_URL || "http://localhost:4000";

export default monitor({
  name: "CDN",
  interval: "1m",
  timeout: "10s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch(`${TEST_SERVER}/cdn/health`);
      const responseTime = Date.now() - start;

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `CDN error: HTTP ${res.status}`,
        };
      }

      return {
        status: responseTime > 300 ? "degraded" : "up",
        responseTime,
        statusCode: res.status,
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },

  alerts: [
    {
      id: "cdn-down",
      name: "CDN down",
      condition: { consecutiveFailures: 3 },
      channels: ["default"],
    },
  ],
});
