import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "NPM Registry",
  interval: "1m",
  timeout: "30s",

  async handler() {
    const start = Date.now();

    try {
      // Check NPM registry by fetching a known package
      const res = await fetch("https://registry.npmjs.org/react/latest");
      const responseTime = Date.now() - start;

      if (!res.ok) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: `HTTP ${res.status}`,
        };
      }

      const data = (await res.json()) as { name: string; version: string };

      if (!data.name || !data.version) {
        return {
          status: "down",
          responseTime,
          statusCode: res.status,
          message: "Invalid response from NPM registry",
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
