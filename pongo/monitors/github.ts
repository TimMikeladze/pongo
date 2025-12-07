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

      const body = await res.text();
      const confirmationString = "GitHub lives!";
      const hasConfirmation = body.includes(confirmationString);

      if (!hasConfirmation) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `Missing confirmation: "${confirmationString}"`,
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
