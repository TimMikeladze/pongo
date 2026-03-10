"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import {
  disableAlert,
  enableAlert,
  silenceAlert,
  unsilenceAlert,
} from "@/lib/data";

export async function silenceAlertAction(
  alertId: string,
  durationMs: number,
): Promise<void> {
  if (!(await isAuthenticated())) throw new Error("Unauthorized");
  const until = new Date(Date.now() + durationMs);
  await silenceAlert(alertId, until);
  revalidatePath("/alerts");
}

export async function unsilenceAlertAction(alertId: string): Promise<void> {
  if (!(await isAuthenticated())) throw new Error("Unauthorized");
  await unsilenceAlert(alertId);
  revalidatePath("/alerts");
}

export async function disableAlertAction(alertId: string): Promise<void> {
  if (!(await isAuthenticated())) throw new Error("Unauthorized");
  await disableAlert(alertId);
  revalidatePath("/alerts");
}

export async function enableAlertAction(alertId: string): Promise<void> {
  if (!(await isAuthenticated())) throw new Error("Unauthorized");
  await enableAlert(alertId);
  revalidatePath("/alerts");
}
