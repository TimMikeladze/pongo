import { createHash, timingSafeEqual } from "node:crypto";
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

function getSessionPassword(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (secret) {
    return createHash("sha256").update(secret).digest("hex").slice(0, 32);
  }
  if (ACCESS_CODE) {
    return createHash("sha256").update(ACCESS_CODE).digest("hex").slice(0, 32);
  }
  return "this-password-is-not-used-when-auth-disabled";
}

export function getSessionOptions(): SessionOptions {
  return {
    password: getSessionPassword(),
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
  if (!ACCESS_CODE) return false;

  const a = Buffer.from(code);
  const b = Buffer.from(ACCESS_CODE);

  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }

  return timingSafeEqual(a, b);
}
