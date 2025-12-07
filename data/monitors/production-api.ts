import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "GitHub Status",
  interval: "1m",
  timeout: "30s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch("https://github.com/status");
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
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
