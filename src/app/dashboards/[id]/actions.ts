"use server";

import { revalidatePath } from "next/cache";

const SCHEDULER_URL = process.env.SCHEDULER_URL ?? "http://localhost:3001";

export async function triggerAllMonitors(
  monitorIds: string[],
  dashboardId: string,
) {
  try {
    const res = await fetch(`${SCHEDULER_URL}/monitors/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monitorIds }),
    });

    if (!res.ok) {
      const data = await res.json();
      return {
        success: false,
        error: data.error ?? "Failed to trigger monitors",
      };
    }

    const data = await res.json();
    revalidatePath(`/dashboards/${dashboardId}`);

    return {
      success: true,
      results: data.results,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return {
      success: false,
      error: message.includes("fetch failed") ? "Scheduler unavailable" : message || "Scheduler unavailable",
    };
  }
}
