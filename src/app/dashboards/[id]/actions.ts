"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";

const SCHEDULER_URL = process.env.SCHEDULER_URL ?? "http://localhost:3001";
const SCHEDULER_SECRET = process.env.SCHEDULER_SECRET;

export async function triggerAllMonitors(
  monitorIds: string[],
  dashboardId: string,
) {
  if (!(await isAuthenticated())) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (SCHEDULER_SECRET) headers.Authorization = `Bearer ${SCHEDULER_SECRET}`;

    const res = await fetch(`${SCHEDULER_URL}/monitors/trigger`, {
      method: "POST",
      headers,
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
      error: message.includes("fetch failed")
        ? "Scheduler unavailable"
        : message || "Scheduler unavailable",
    };
  }
}
