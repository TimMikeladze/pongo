"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";

const SCHEDULER_URL = process.env.SCHEDULER_URL ?? "http://localhost:3001";
const SCHEDULER_SECRET = process.env.SCHEDULER_SECRET;

function schedulerHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  if (SCHEDULER_SECRET) h.Authorization = `Bearer ${SCHEDULER_SECRET}`;
  return h;
}

export async function triggerMonitor(monitorId: string) {
  if (!(await isAuthenticated())) {
    return { success: false, error: "Unauthorized" };
  }
  try {
    const res = await fetch(`${SCHEDULER_URL}/monitors/${monitorId}/trigger`, {
      method: "POST",
      headers: schedulerHeaders(),
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
