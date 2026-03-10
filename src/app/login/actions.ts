"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, verifyAccessCode } from "@/lib/auth";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  record.count++;
  return record.count > MAX_ATTEMPTS;
}

export async function login(
  code: string,
): Promise<{ success: boolean; error?: string }> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
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
