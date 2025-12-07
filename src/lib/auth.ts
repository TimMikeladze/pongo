import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isAuthenticated?: boolean;
}

const ACCESS_CODE = process.env.ACCESS_CODE;
const EXPIRY_DAYS = Number(process.env.EXPIRY_DAYS) || 7;

export function isAuthEnabled(): boolean {
  return !!ACCESS_CODE;
}

export function getSessionOptions(): SessionOptions {
  return {
    password:
      ACCESS_CODE?.padEnd(32, ACCESS_CODE) ||
      "this-password-is-not-used-when-auth-disabled",
    cookieName: "pongo-auth",
    ttl: EXPIRY_DAYS * 24 * 60 * 60,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

export async function isAuthenticated(): Promise<boolean> {
  if (!isAuthEnabled()) {
    return true;
  }
  const session = await getSession();
  return session.isAuthenticated === true;
}

export function verifyAccessCode(code: string): boolean {
  return code === ACCESS_CODE;
}
