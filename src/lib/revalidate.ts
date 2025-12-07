// src/lib/revalidate.ts
// Centralized cache revalidation functions for on-demand cache invalidation
"use server";

import { revalidatePath, revalidateTag } from "next/cache";

// Use "max" profile for SWR behavior (stale content served while fresh data loads)
// This provides immediate responses while revalidating in the background

/**
 * Revalidate all data associated with a specific monitor.
 * Call this when monitor config changes or when you need fresh data.
 */
export async function revalidateMonitor(monitorId: string) {
  revalidateTag(`monitor-${monitorId}`, "max");
  revalidatePath(`/monitors/${monitorId}`);
}

/**
 * Revalidate all check results across all monitors.
 * Call this after new check results are written to the database.
 */
export async function revalidateCheckResults() {
  revalidateTag("check-results", "max");
}

/**
 * Revalidate all data associated with a specific dashboard.
 * Call this when dashboard config changes.
 */
export async function revalidateDashboard(dashboardId: string) {
  revalidateTag(`dashboard-${dashboardId}`, "max");
  revalidatePath(`/dashboards/${dashboardId}`);
}

/**
 * Revalidate all dashboard-related data for public status pages.
 * Call this when dashboard slug changes or public page needs refresh.
 */
export async function revalidateSharedDashboard(slug: string) {
  revalidatePath(`/shared/${slug}`);
  revalidatePath(`/shared/${slug}/status.json`);
}

/**
 * Revalidate all alert-related data.
 * Call this when alert state changes (firing/resolved).
 */
export async function revalidateAlerts() {
  revalidateTag("alerts", "max");
  revalidatePath("/alerts");
}

/**
 * Revalidate everything - use sparingly.
 * This invalidates all cached data and forces fresh fetches.
 */
export async function revalidateAll() {
  revalidateTag("check-results", "max");
  revalidateTag("alerts", "max");
  revalidatePath("/");
  revalidatePath("/monitors");
  revalidatePath("/dashboards");
  revalidatePath("/alerts");
}
