import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "Pongo",
  interval: "5m",
  timeout: "30s",

  async handler() {
    const url = process.env.PONGO_URL;
    if (!url) {
      return {
        status: "down",
        responseTime: 0,
        message: "PONGO_URL environment variable not set",
      };
    }

    const start = Date.now();

    try {
      const res = await fetch(url);
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
        status: responseTime > 3000 ? "degraded" : "up",
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
