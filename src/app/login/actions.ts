"use server";

import { redirect } from "next/navigation";
import { getSession, verifyAccessCode } from "@/lib/auth";

export async function login(
  code: string,
): Promise<{ success: boolean; error?: string }> {
  if (!verifyAccessCode(code)) {
    return { success: false, error: "Invalid access code" };
  }

  const session = await getSession();
  session.isAuthenticated = true;
  await session.save();

  return { success: true };
}

export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
