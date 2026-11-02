import type { CheckResult } from "@/lib/types";

export function dashboardMeasurements(checks: CheckResult[][]) {
  const measured = checks
    .map((rows) => rows.filter((row) => row.status !== "pending"))
    .filter((rows) => rows.length > 0);
  const responseTimes = measured.flat().filter((row) => row.status !== "down");
  return {
    uptime: measured.length
      ? measured.reduce(
          (total, rows) =>
            total +
            (rows.reduce(
              (score, row) =>
                score +
                (row.status === "up" ? 1 : row.status === "degraded" ? 0.5 : 0),
              0,
            ) /
              rows.length) *
              100,
          0,
        ) / measured.length
      : null,
    responseTime: responseTimes.length
      ? Math.round(
          responseTimes.reduce((sum, row) => sum + row.responseTimeMs, 0) /
            responseTimes.length,
        )
      : null,
    checkCount: measured.reduce((count, rows) => count + rows.length, 0),
  };
}
