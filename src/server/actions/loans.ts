"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  UNEXPECTED_ERROR_MESSAGE,
  validationError,
  type ActionResult,
} from "@/lib/action-result";
import { requireStaff } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { isRecordNotFoundError } from "@/lib/prisma-errors";
import { idSchema, loanSchema } from "@/lib/validations";

function revalidateLoanViews() {
  revalidatePath("/admin/loans");
  revalidatePath("/admin");
  revalidatePath("/library");
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}

export async function createLoan(input: unknown): Promise<ActionResult> {
  await requireStaff();

  const parsed = loanSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  const { userId, bookId, dueDate } = parsed.data;
  const due = new Date(`${dueDate}T00:00:00Z`);

  if (due < startOfToday()) {
    return actionError("A data de devolução não pode estar no passado.", {
      dueDate: ["A data de devolução não pode estar no passado."],
    });
  }

  const [student, book] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    }),
    prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, format: true, title: true },
    }),
  ]);

  if (!student || student.role !== "STUDENT") {
    return actionError("Selecione um aluno válido.", {
      userId: ["Selecione um aluno válido."],
    });
  }

  if (!book) {
    return actionError("Livro não encontrado.", {
      bookId: ["Livro não encontrado."],
    });
  }

  if (book.format === "DIGITAL") {
    return actionError(
      "Livros digitais ficam disponíveis para leitura online e não precisam de empréstimo.",
      { bookId: ["Este livro é digital."] },
    );
  }

  try {
    // Serialized so two librarians cannot lend the same copy at once.
    await prisma.$transaction(async (tx) => {
      const alreadyLent = await tx.loan.count({
        where: { bookId, returnedAt: null },
      });

      if (alreadyLent > 0) {
        throw new Error("BOOK_ALREADY_LENT");
      }

      await tx.loan.create({ data: { userId, bookId, dueDate: due } });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BOOK_ALREADY_LENT") {
      return actionError("Este exemplar já está emprestado.", {
        bookId: ["Este exemplar já está emprestado."],
      });
    }

    console.error("createLoan failed", error);

    return actionError(UNEXPECTED_ERROR_MESSAGE);
  }

  revalidateLoanViews();

  return { ok: true, message: `Empréstimo de "${book.title}" registrado.` };
}

export async function returnLoan(input: unknown): Promise<ActionResult> {
  await requireStaff();

  const parsed = idSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  try {
    // `returnedAt: null` in the filter keeps a double click from overwriting
    // the original return date.
    const { count } = await prisma.loan.updateMany({
      where: { id: parsed.data.id, returnedAt: null },
      data: { returnedAt: new Date() },
    });

    if (count === 0) {
      return actionError("Este empréstimo já foi devolvido.");
    }
  } catch (error) {
    console.error("returnLoan failed", error);

    return actionError(UNEXPECTED_ERROR_MESSAGE);
  }

  revalidateLoanViews();

  return { ok: true, message: "Devolução registrada." };
}

export async function deleteLoan(input: unknown): Promise<ActionResult> {
  await requireStaff();

  const parsed = idSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  try {
    await prisma.loan.delete({ where: { id: parsed.data.id } });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return actionError("Empréstimo não encontrado.");
    }

    console.error("deleteLoan failed", error);

    return actionError(UNEXPECTED_ERROR_MESSAGE);
  }

  revalidateLoanViews();

  return { ok: true, message: "Registro removido do histórico." };
}
