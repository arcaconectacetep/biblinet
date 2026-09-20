"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  UNEXPECTED_ERROR_MESSAGE,
  validationError,
  type ActionResult,
} from "@/lib/action-result";
import { requireRole, requireUser } from "@/lib/auth/current-user";
import { BOARD_MESSAGE_COOLDOWN_SECONDS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { isRecordNotFoundError } from "@/lib/prisma-errors";
import {
  boardMessageSchema,
  bugReportSchema,
  bugStatusSchema,
  idSchema,
} from "@/lib/validations";

export async function postBoardMessage(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = boardMessageSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  const lastMessage = await prisma.boardMessage.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (lastMessage) {
    const secondsSinceLast =
      (Date.now() - lastMessage.createdAt.getTime()) / 1000;

    if (secondsSinceLast < BOARD_MESSAGE_COOLDOWN_SECONDS) {
      return actionError(
        `Aguarde ${Math.ceil(
          BOARD_MESSAGE_COOLDOWN_SECONDS - secondsSinceLast,
        )} segundos para enviar outra mensagem.`,
      );
    }
  }

  try {
    await prisma.boardMessage.create({
      data: { userId: user.id, content: parsed.data.content },
    });
  } catch (error) {
    console.error("postBoardMessage failed", error);

    return actionError(UNEXPECTED_ERROR_MESSAGE);
  }

  revalidatePath("/library");

  return { ok: true };
}

export async function deleteBoardMessage(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  const message = await prisma.boardMessage.findUnique({
    where: { id: parsed.data.id },
    select: { userId: true },
  });

  if (!message) return actionError("Mensagem não encontrada.");

  // Authors can remove their own message; staff can moderate any of them.
  const canDelete = message.userId === user.id || user.role !== "STUDENT";

  if (!canDelete) {
    return actionError("Você só pode apagar as suas próprias mensagens.");
  }

  try {
    await prisma.boardMessage.delete({ where: { id: parsed.data.id } });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return actionError("Mensagem não encontrada.");
    }

    console.error("deleteBoardMessage failed", error);

    return actionError(UNEXPECTED_ERROR_MESSAGE);
  }

  revalidatePath("/library");

  return { ok: true, message: "Mensagem apagada." };
}

export async function submitBugReport(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = bugReportSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  try {
    await prisma.bugReport.create({
      data: {
        userId: user.id,
        category: parsed.data.category,
        description: parsed.data.description,
      },
    });
  } catch (error) {
    console.error("submitBugReport failed", error);

    return actionError(UNEXPECTED_ERROR_MESSAGE);
  }

  revalidatePath("/admin/reports");

  return {
    ok: true,
    message: "Relato enviado. Obrigado por ajudar a melhorar o Biblinet!",
  };
}

export async function updateBugStatus(input: unknown): Promise<ActionResult> {
  await requireRole("DEV");

  const parsed = bugStatusSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  try {
    await prisma.bugReport.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });
  } catch (error) {
    if (isRecordNotFoundError(error)) return actionError("Relato não encontrado.");

    console.error("updateBugStatus failed", error);

    return actionError(UNEXPECTED_ERROR_MESSAGE);
  }

  revalidatePath("/admin/reports");

  return { ok: true, message: "Status atualizado." };
}

export async function deleteBugReport(input: unknown): Promise<ActionResult> {
  await requireRole("DEV");

  const parsed = idSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  try {
    await prisma.bugReport.delete({ where: { id: parsed.data.id } });
  } catch (error) {
    if (isRecordNotFoundError(error)) return actionError("Relato não encontrado.");

    console.error("deleteBugReport failed", error);

    return actionError(UNEXPECTED_ERROR_MESSAGE);
  }

  revalidatePath("/admin/reports");

  return { ok: true, message: "Relato removido." };
}
