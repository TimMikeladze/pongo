"use server";

import { revalidatePath } from "next/cache";
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
  const until = new Date(Date.now() + durationMs);
  await silenceAlert(alertId, until);
  revalidatePath("/alerts");
}

export async function unsilenceAlertAction(alertId: string): Promise<void> {
  await unsilenceAlert(alertId);
  revalidatePath("/alerts");
}

export async function disableAlertAction(alertId: string): Promise<void> {
  await disableAlert(alertId);
  revalidatePath("/alerts");
}

export async function enableAlertAction(alertId: string): Promise<void> {
  await enableAlert(alertId);
  revalidatePath("/alerts");
}
