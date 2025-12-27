// src/lib/python-runner.ts

import type { MonitorResult } from "./config-types";

/**
 * Get the base URL for API calls
 * In Vercel deployment: uses VERCEL_URL or relative path
 * In local/Docker: uses localhost with appropriate port
 */
function getBaseUrl(): string {
  // Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Custom base URL (for testing or custom deployments)
  if (process.env.PYTHON_MONITOR_BASE_URL) {
    return process.env.PYTHON_MONITOR_BASE_URL;
  }

  // Local development (Next.js default port)
  const port = process.env.PORT || "3000";
  return `http://localhost:${port}`;
}

/**
 * Execute a Python monitor via the Vercel Python runtime API endpoint
 *
 * This function makes an HTTP request to a Python serverless function
 * deployed on Vercel and parses the JSON response into a MonitorResult.
 *
 * Python monitors are served as serverless functions at /api/monitors/{monitorName}
 * and return a JSON object with the following structure:
 * {
 *   "status": "up" | "down" | "degraded",
 *   "responseTime": number,
 *   "statusCode"?: number,
 *   "message"?: string
 * }
 *
 * @param monitorEndpoint - The API endpoint path (e.g., "hackernews" for /api/monitors/hackernews)
 * @param timeoutMs - Maximum execution time in milliseconds (default: 30000)
 * @returns MonitorResult with status, responseTime, and optional message/statusCode
 *
 * @example
 * ```typescript
 * const result = await runPythonMonitor("hackernews", 30000);
 * console.log(result.status); // "up" | "down" | "degraded"
 * ```
 */
export async function runPythonMonitor(
  monitorEndpoint: string,
  timeoutMs: number = 30000,
): Promise<MonitorResult> {
  const start = Date.now();

  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/monitors/${monitorEndpoint}`;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Pongo-Monitor-Runner/1.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Python monitor API returned ${response.status}: ${response.statusText}`,
        );
      }

      // Parse JSON response from the Python serverless function
      const parsed = (await response.json()) as MonitorResult;

      // Validate required fields to ensure monitor returned valid data
      if (!parsed.status || typeof parsed.responseTime !== "number") {
        throw new Error(
          "Invalid monitor result: missing status or responseTime",
        );
      }

      return parsed;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.name === "AbortError") {
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: `Monitor timeout after ${timeoutMs}ms`,
      };
    }

    // If anything fails (network error, invalid JSON, etc.),
    // return a "down" status with error details
    // This ensures the monitor always returns a valid MonitorResult
    return {
      status: "down",
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : "Python monitor error",
    };
  }
}
