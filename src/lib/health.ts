import type { MonitorStatus } from "./types";

export const healthLabels: Record<MonitorStatus, string> = {
  up: "Operational",
  down: "Outage",
  degraded: "Degraded",
  pending: "Awaiting first check",
};

export function summarizeHealth(
  statuses: Array<MonitorStatus | null | undefined>,
): MonitorStatus {
  if (statuses.includes("down")) return "down";
  if (statuses.includes("degraded")) return "degraded";
  if (
    statuses.length === 0 ||
    statuses.some((status) => !status || status === "pending")
  )
    return "pending";
  return "up";
}
