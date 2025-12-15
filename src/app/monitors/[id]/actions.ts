"use server";

import { revalidatePath } from "next/cache";

const SCHEDULER_URL = process.env.SCHEDULER_URL ?? "http://localhost:3001";

export async function triggerMonitor(monitorId: string) {
  try {
    const res = await fetch(`${SCHEDULER_URL}/monitors/${monitorId}/trigger`, {
      method: "POST",
    });

    if (!res.ok) {
      const data = await res.json();
      return {
        success: false,
        error: data.error ?? "Failed to trigger monitor",
      };
    }

    const data = await res.json();
    revalidatePath(`/monitors/${monitorId}`);

    return {
      success: true,
      status: data.status,
      responseTime: data.responseTime,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return {
      success: false,
      error: message.includes("fetch failed")
        ? "Scheduler unavailable"
        : message || "Scheduler unavailable",
    };
  }
}
