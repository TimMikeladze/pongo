import { type MonitorResult, monitor } from "../../src/lib/config-types";
import cloudflare from "./cloudflare";
import pongo from "./pongo";
import vercel from "./vercel";

/**
 * Call a Python monitor endpoint (Vercel Python Runtime)
 */
async function callPythonMonitor(
  endpoint: string,
  timeoutMs = 30000,
): Promise<MonitorResult> {
  const start = Date.now();

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${process.env.PORT || 3000}`;

  const url = `${baseUrl}/api/monitors/${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: `Python monitor returned ${response.status}`,
      };
    }

    return (await response.json()) as MonitorResult;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: `Timeout after ${timeoutMs}ms`,
      };
    }

    return {
      status: "down",
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

const hackernews = monitor({
  name: "Hacker News",
  interval: "15m",
  timeout: "30s",
  async handler() {
    return callPythonMonitor("hackernews", 30000);
  },
});

const example = monitor({
  name: "Example API",
  interval: "15m",
  timeout: "30s",
  async handler() {
    return callPythonMonitor("example_api", 30000);
  },
});

export default {
  example,
  hackernews,
  vercel,
  cloudflare,
  pongo,
};
