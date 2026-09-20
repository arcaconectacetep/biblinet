"use server";

import { revalidatePath } from "next/cache";

import type { Role } from "@/generated/prisma/enums";
import {
  actionError,
  UNEXPECTED_ERROR_MESSAGE,
  validationError,
  type ActionResult,
} from "@/lib/action-result";
import { requireStaff, type SessionUser } from "@/lib/auth/current-user";
import {
  buildFirstAccessPassword,
  generateTemporaryPassword,
  hashPassword,
} from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import {
  isRecordNotFoundError,
  isUniqueConstraintError,
} from "@/lib/prisma-errors";
import {
  idSchema,
  userSchema,
  userUpdateWithIdSchema,
} from "@/lib/validations";

/**
 * Administrators run the library day to day and may only touch student
 * accounts; creating or editing staff is restricted to the developer account.
 */
function canManageRole(actor: SessionUser, targetRole: Role) {
  return actor.role === "DEV" || targetRole === "STUDENT";
}

const PERMISSION_DENIED_MESSAGE =
  "Apenas o perfil de desenvolvedor pode gerenciar contas de administração.";

function duplicateFieldError(error: unknown) {
  if (isUniqueConstraintError(error, "username")) {
    return actionError("Este login já está em uso.", {
      username: ["Este login já está em uso."],
    });
  }

  if (isUniqueConstraintError(error, "email")) {
    return actionError("Este e-mail já está cadastrado.", {
      email: ["Este e-mail já está cadastrado."],
    });
  }

  return null;
}

function revalidateUserViews() {
  revalidatePath("/admin/users");
  revalidatePath("/admin/loans");
  revalidatePath("/admin");
}

export async function createUser(input: unknown): Promise<ActionResult> {
  const actor = await requireStaff();
  const parsed = userSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  const data = parsed.data;

  if (!canManageRole(actor, data.role)) {
    return actionError(PERMISSION_DENIED_MESSAGE);
  }

  // Students sign in for the first time with their birth date (DDMMYYYY) and
  // are required to pick a real password right after.
  const initialPassword =
    data.role === "STUDENT"
      ? buildFirstAccessPassword(new Date(`${data.birthDate}T00:00:00Z`))
      : data.password;

  try {
    await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        taxId: data.taxId,
        phone: data.phone,
        address: data.address,
        role: data.role,
        passwordHash: await hashPassword(initialPassword),
        mustChangePassword: true,
        ...(data.role === "STUDENT"
          ? {
              registrationNumber: data.registrationNumber,
              birthDate: new Date(`${data.birthDate}T00:00:00Z`),
              course: data.course,
              gradeYear: data.gradeYear,
              className: data.className,
            }
          : {}),
      },
    });
  } catch (error) {
    const duplicate = duplicateFieldError(error);

    if (duplicate) return duplicate;

    console.error("createUser failed", error);

    return actionError(UNEXPECTED_ERROR_MESSAGE);
  }

  revalidateUserViews();

  return {
    ok: true,
    message:
      data.role === "STUDENT"
        ? "Aluno cadastrado. A primeira senha é a data de nascimento (DDMMAAAA)."
        : "Conta criada com sucesso.",
  };
}

export async function updateUser(input: unknown): Promise<ActionResult> {
  const actor = await requireStaff();
  const parsed = userUpdateWithIdSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  const data = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id: data.id },
    select: { id: true, role: true },
  });

  if (!target) return actionError("Usuário não encontrado.");

  // Both the current role and the requested role must be manageable, otherwise
  // an admin could promote a student into a staff account.
  if (!canManageRole(actor, target.role) || !canManageRole(actor, data.role)) {
    return actionError(PERMISSION_DENIED_MESSAGE);
  }

  try {
    await prisma.user.update({
      where: { id: data.id },
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        taxId: data.taxId,
        phone: data.phone,
        address: data.address,
        role: data.role,
        ...(data.role === "STUDENT"
          ? {
              registrationNumber: data.registrationNumber,
              birthDate: new Date(`${data.birthDate}T00:00:00Z`),
              course: data.course,
              gradeYear: data.gradeYear,
              className: data.className,
            }
          : {
              registrationNumber: null,
              birthDate: null,
              course: null,
              gradeYear: null,
              className: null,
            }),
      },
    });
  } catch (error) {
    const duplicate = duplicateFieldError(error);

    if (duplicate) return duplicate;
    if (isRecordNotFoundError(error)) {
      return actionError("Usuário não encontrado.");
    }

    console.error("updateUser failed", error);

    return actionError(UNEXPECTED_ERROR_MESSAGE);
  }

  revalidateUserViews();

  return { ok: true, message: "Cadastro atualizado." };
}

export async function deleteUser(input: unknown): Promise<ActionResult> {
  const actor = await requireStaff();
  const parsed = idSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  if (parsed.data.id === actor.id) {
    return actionError("Você não pode excluir a sua própria conta.");
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.id },
    select: { role: true },
  });

  if (!target) return actionError("Usuário não encontrado.");

  if (!canManageRole(actor, target.role)) {
    return actionError(PERMISSION_DENIED_MESSAGE);
  }

  const activeLoans = await prisma.loan.count({
    where: { userId: parsed.data.id, returnedAt: null },
  });

  if (activeLoans > 0) {
    return actionError(
      "Este usuário ainda tem empréstimos em aberto. Registre a devolução antes de excluir.",
    );
  }

  try {
    await prisma.user.delete({ where: { id: parsed.data.id } });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return actionError("Usuário não encontrado.");
    }

    console.error("deleteUser failed", error);

    return actionError(UNEXPECTED_ERROR_MESSAGE);
  }

  revalidateUserViews();

  return { ok: true, message: "Usuário removido." };
}

/**
 * Replaces the password with a one-time value shown to the administrator, ends
 * every active session of that user and forces a new password on next login.
 */
export async function resetUserPassword(
  input: unknown,
): Promise<ActionResult<{ temporaryPassword: string }>> {
  const actor = await requireStaff();
  const parsed = idSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.id },
    select: { role: true },
  });

  if (!target) return actionError("Usuário não encontrado.");

  if (!canManageRole(actor, target.role)) {
    return actionError(PERMISSION_DENIED_MESSAGE);
  }

  const temporaryPassword = generateTemporaryPassword();

  try {
    await prisma.user.update({
      where: { id: parsed.data.id },
      data: {
        passwordHash: await hashPassword(temporaryPassword),
        mustChangePassword: true,
        sessionVersion: { increment: 1 },
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
  } catch (error) {
    console.error("resetUserPassword failed", error);

    return actionError(UNEXPECTED_ERROR_MESSAGE);
  }

  revalidateUserViews();

  return {
    ok: true,
    data: { temporaryPassword },
    message: "Senha temporária gerada.",
  };
}
