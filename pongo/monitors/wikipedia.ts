import { monitor } from "../../src/lib/config-types";

export default monitor({
  name: "Wikipedia",
  interval: "5m",
  timeout: "15s",

  async handler() {
    const start = Date.now();

    try {
      const res = await fetch("https://en.wikipedia.org/wiki/Main_Page");
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
