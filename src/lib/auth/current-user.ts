import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { Role } from "@/generated/prisma/enums";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: Role;
  mustChangePassword: boolean;
  course: string | null;
  gradeYear: string | null;
  className: string | null;
};

export const STAFF_ROLES: Role[] = ["ADMIN", "DEV"];

/**
 * Resolves the signed-in user for the current request. The cookie alone is not
 * trusted: the user is re-read from the database and the session version must
 * still match, so a password change or a deleted account ends the session.
 *
 * Memoized per request so a page with several components hits the DB once.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const payload = await verifySessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
  );

  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      mustChangePassword: true,
      course: true,
      gradeYear: true,
      className: true,
      sessionVersion: true,
    },
  });

  if (!user || user.sessionVersion !== payload.sessionVersion) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    course: user.course,
    gradeYear: user.gradeYear,
    className: user.className,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) redirect("/login");

  return user;
}

/** Like `requireUser`, but also enforces a role allow-list. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();

  // Send the user back to their own area instead of leaking that the route exists.
  if (!roles.includes(user.role)) redirect(homePathForRole(user.role));

  return user;
}

export function requireStaff() {
  return requireRole(...STAFF_ROLES);
}

export async function startSession(user: {
  id: string;
  role: Role;
  sessionVersion: number;
}) {
  const token = await signSessionToken({
    userId: user.id,
    role: user.role,
    sessionVersion: user.sessionVersion,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
}

export async function endSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function isStaff(role: Role) {
  return STAFF_ROLES.includes(role);
}

/** Landing route for a role, used after login and by the root redirect. */
export function homePathForRole(role: Role) {
  return isStaff(role) ? "/admin" : "/library";
}
