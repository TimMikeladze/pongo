"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, verifyAccessCode } from "@/lib/auth";
import { createRateLimiter, isRateLimited } from "@/lib/rate-limit";

const loginLimiter = createRateLimiter(5, 60_000);

export async function login(
  code: string,
): Promise<{ success: boolean; error?: string }> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(loginLimiter, ip)) {
    return { success: false, error: "Too many attempts. Try again later." };
  }

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
