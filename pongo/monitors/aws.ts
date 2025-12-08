import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "AWS",
  interval: "15m",
  timeout: "30s",

  async handler() {
    const start = Date.now();

    try {
      // Check AWS health dashboard
      const res = await fetch("https://health.aws.amazon.com/health/status");
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
});
