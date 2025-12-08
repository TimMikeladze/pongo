import { monitor } from "../../src/lib/config-types";

const TEST_SERVER = process.env.TEST_SERVER_URL || "http://localhost:4000";

export default monitor({
  name: "Payments API",
  interval: "30s",
  timeout: "15s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch(`${TEST_SERVER}/payments/health`);
      const responseTime = Date.now() - start;

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `Payments API error: HTTP ${res.status}`,
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
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },

  alerts: [
    {
      id: "payments-down",
      name: "Payments API down",
      condition: { consecutiveFailures: 1 },
      channels: ["default"],
    },
    {
      id: "payments-slow",
      name: "Payments API slow",
      condition: { latencyAboveMs: 2000, forChecks: 2 },
      channels: ["default"],
    },
  ],
});
