import { monitor } from "../../src/lib/config-types";

const TEST_SERVER = process.env.TEST_SERVER_URL || "http://localhost:4000";

export default monitor({
  name: "Database",
  interval: "30s",
  timeout: "10s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch(`${TEST_SERVER}/db/health`);
      const responseTime = Date.now() - start;

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `Database unreachable: HTTP ${res.status}`,
        };
      }

      return {
        status: responseTime > 500 ? "degraded" : "up",
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
      id: "database-down",
      name: "Database down",
      condition: { consecutiveFailures: 2 },
      channels: ["default"],
    },
    {
      id: "database-slow",
      name: "Database slow",
      condition: { latencyAboveMs: 500, forChecks: 3 },
      channels: ["default"],
    },
  ],
});
