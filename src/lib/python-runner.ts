// src/lib/python-runner.ts

import { spawn } from "node:child_process";
import type { MonitorResult } from "./config-types";

/**
 * Execute a Python monitor as a subprocess and parse its JSON output
 *
 * This function spawns a Python subprocess to run the monitor script,
 * captures its stdout/stderr, and parses the JSON result into a MonitorResult.
 *
 * Python monitors must print a JSON object to stdout with the following structure:
 * {
 *   "status": "up" | "down" | "degraded",
 *   "responseTime": number,
 *   "statusCode"?: number,
 *   "message"?: string
 * }
 *
 * @param pythonFilePath - Absolute path to the Python monitor file
 * @param timeoutMs - Maximum execution time in milliseconds (default: 30000)
 * @returns MonitorResult with status, responseTime, and optional message/statusCode
 *
 * @example
 * ```typescript
 * const result = await runPythonMonitor(
 *   path.join(__dirname, "my_monitor.py"),
 *   30000
 * );
 * console.log(result.status); // "up" | "down" | "degraded"
 * ```
 */
export async function runPythonMonitor(
  pythonFilePath: string,
  timeoutMs: number = 30000,
): Promise<MonitorResult> {
  const start = Date.now();

  try {
    // Determine Python command to use
    // UV is faster and handles dependencies automatically
    // Fallback to python3 if UV not available or PYTHON_CMD is set
    const pythonCmd = process.env.PYTHON_CMD || "uv run";
    const cmd = pythonCmd.includes("uv")
      ? ["uv", "run", pythonFilePath]
      : [pythonCmd, pythonFilePath];

    // Spawn Python subprocess
    // stdout: "pipe" allows us to capture JSON output
    // stderr: "pipe" allows us to capture error messages
    const [command, ...args] = cmd;
    const proc = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Collect stdout and stderr
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    proc.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
    proc.stderr.on("data", (chunk) => stderrChunks.push(chunk));

    // Set up timeout to prevent hanging monitors
    // This ensures monitors can't run indefinitely
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        proc.kill(); // Terminate the Python process
        reject(new Error(`Monitor timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Wait for process to complete or timeout (whichever comes first)
    const exitPromise = new Promise<{ code: number | null }>(
      (resolve, reject) => {
        proc.on("exit", (code) => resolve({ code }));
        proc.on("error", (err) => reject(err));
      },
    );

    const result = await Promise.race([exitPromise, timeoutPromise]);

    // Read stdout and stderr streams
    // stdout contains the JSON result from the monitor
    // stderr contains any error messages or Python exceptions
    const stdout = Buffer.concat(stdoutChunks).toString("utf-8");
    const stderr = Buffer.concat(stderrChunks).toString("utf-8");

    // Check for non-zero exit code (indicates Python error)
    if (result.code !== 0) {
      throw new Error(`Python monitor failed: ${stderr || "Unknown error"}`);
    }

    // Parse JSON output from Python monitor
    // Python monitors print JSON to stdout as their final action
    const parsed = JSON.parse(stdout.trim()) as MonitorResult;

    // Validate required fields to ensure monitor returned valid data
    if (!parsed.status || typeof parsed.responseTime !== "number") {
      throw new Error("Invalid monitor result: missing status or responseTime");
    }

    return parsed;
  } catch (error) {
    // If anything fails (timeout, invalid JSON, Python error, etc.),
    // return a "down" status with error details
    // This ensures the monitor always returns a valid MonitorResult
    return {
      status: "down",
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : "Python monitor error",
    };
  }
}
