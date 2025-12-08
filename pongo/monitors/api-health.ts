import { monitor } from "../../src/lib/config-types";

const TEST_SERVER = process.env.TEST_SERVER_URL || "http://localhost:4000";

export default monitor({
  name: "API Health",
  interval: "30s",
  timeout: "10s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch(`${TEST_SERVER}/api/health`);
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
        status: responseTime > 1000 ? "degraded" : "up",
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
      id: "api-health-down",
      name: "API down",
      condition: { consecutiveFailures: 3 },
      channels: ["default"],
    },
    {
      id: "api-health-degraded",
      name: "API degraded",
      condition: { status: "degraded", forChecks: 5 },
      channels: ["default"],
    },
  ],
});
