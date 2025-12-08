import { monitor } from "../../src/lib/config-types";

const TEST_SERVER = process.env.TEST_SERVER_URL || "http://localhost:4000";

export default monitor({
  name: "Auth Service",
  interval: "30s",
  timeout: "10s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch(`${TEST_SERVER}/auth/health`);
      const responseTime = Date.now() - start;

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `Auth service error: HTTP ${res.status}`,
        };
      }

      return {
        status: responseTime > 800 ? "degraded" : "up",
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
      id: "auth-service-down",
      name: "Auth service down",
      condition: { consecutiveFailures: 2 },
      channels: ["default"],
    },
  ],
});
