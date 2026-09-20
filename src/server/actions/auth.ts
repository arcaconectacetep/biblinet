"use server";

import { redirect } from "next/navigation";

import {
  actionError,
  UNEXPECTED_ERROR_MESSAGE,
  validationError,
  type ActionResult,
} from "@/lib/action-result";
import {
  endSession,
  homePathForRole,
  requireUser,
  startSession,
} from "@/lib/auth/current-user";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { LOGIN_LOCK_MINUTES, MAX_FAILED_LOGIN_ATTEMPTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema, loginSchema } from "@/lib/validations";

const INVALID_CREDENTIALS_MESSAGE = "Usuário ou senha incorretos.";

/**
 * Compared against when the username does not exist, so a wrong username costs
 * the same time as a wrong password and cannot be used to enumerate accounts.
 */
const DUMMY_PASSWORD_HASH =
  "$2b$12$vXu0WCOzx6h1G/jEv1N6HOe/DNyo40tVkwvfz1tlvQc07UICu6e0O";

export async function signIn(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      role: true,
      passwordHash: true,
      sessionVersion: true,
      mustChangePassword: true,
      failedLoginCount: true,
      lockedUntil: true,
    },
  });

  if (!user) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH);

    return actionError(INVALID_CREDENTIALS_MESSAGE);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.max(
      1,
      Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000),
    );

    return actionError(
      `Muitas tentativas. Tente novamente em ${minutesLeft} minuto(s).`,
    );
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    const failedLoginCount = user.failedLoginCount + 1;
    const shouldLock = failedLoginCount >= MAX_FAILED_LOGIN_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: shouldLock ? 0 : failedLoginCount,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60_000)
          : null,
      },
    });

    return actionError(
      shouldLock
        ? `Muitas tentativas. A conta ficará bloqueada por ${LOGIN_LOCK_MINUTES} minutos.`
        : INVALID_CREDENTIALS_MESSAGE,
    );
  }

  if (user.failedLoginCount > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }

  await startSession(user);

  redirect(
    user.mustChangePassword ? "/change-password" : homePathForRole(user.role),
  );
}

export async function signOut() {
  await endSession();
  redirect("/login");
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  const sessionUser = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, role: true, passwordHash: true, sessionVersion: true },
  });

  if (!user) return actionError(UNEXPECTED_ERROR_MESSAGE);

  const currentMatches = await verifyPassword(
    parsed.data.currentPassword,
    user.passwordHash,
  );

  if (!currentMatches) {
    return actionError("Senha atual incorreta.", {
      currentPassword: ["Senha atual incorreta."],
    });
  }

  // Bumping the session version invalidates every cookie issued so far; the
  // current device gets a fresh one right away.
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.newPassword),
      mustChangePassword: false,
      sessionVersion: { increment: 1 },
      failedLoginCount: 0,
      lockedUntil: null,
    },
    select: { id: true, role: true, sessionVersion: true },
  });

  await startSession(updated);

  redirect(homePathForRole(updated.role));
}
