import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "Cloudflare",
  interval: "15m",
  timeout: "30s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch(
        "https://www.cloudflarestatus.com/api/v2/status.json",
      );
      const responseTime = Date.now() - start;

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `HTTP ${res.status}`,
        };
      }

      const data = (await res.json()) as {
        status: { indicator: string; description: string };
      };
      const indicator = data.status.indicator;

      if (indicator === "critical" || indicator === "major") {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: data.status.description,
        };
      }

      if (indicator === "minor") {
        return {
          status: "degraded",
          responseTime,
          statusCode: res.status,
          message: data.status.description,
        };
      }

      return {
        status: "up",
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
