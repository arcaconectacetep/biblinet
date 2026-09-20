import { jwtVerify, SignJWT } from "jose";

import type { Role } from "@/generated/prisma/enums";
import { env, isProduction } from "@/lib/env";

export const SESSION_COOKIE_NAME = "biblinet_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8h — a school day plus slack.

const secretKey = new TextEncoder().encode(env.SESSION_SECRET);

export type SessionPayload = {
  userId: string;
  role: Role;
  /** Must match `User.sessionVersion`, so credential changes revoke old cookies. */
  sessionVersion: number;
};

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT({ role: payload.role, sv: payload.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey);
}

/** Returns the payload of a valid, unexpired token, or `null` for anything else. */
export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string" || typeof payload.sv !== "number") {
      return null;
    }

    return {
      userId: payload.sub,
      role: payload.role as Role,
      sessionVersion: payload.sv,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
} as const;
