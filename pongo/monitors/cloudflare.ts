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

      // Explicitly handle all documented Cloudflare status indicators
      // Docs: https://www.cloudflarestatus.com/api
      // Possible values: "none", "minor", "major", "critical"

      if (indicator === "none") {
        return {
          status: "up",
          responseTime,
          statusCode: res.status,
        };
      }

      if (indicator === "minor" || indicator === "major") {
        return {
          status: "degraded",
          responseTime,
          statusCode: res.status,
          message: data.status.description,
        };
      }

      if (indicator === "critical") {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: data.status.description,
        };
      }

      // Unknown indicator - treat as down for safety
      return {
        status: "down",
        responseTime,
        statusCode: res.status,
        message: `Unknown indicator: ${indicator}`,
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
