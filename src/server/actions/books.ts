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
import { bookSchema, bookUpdateWithIdSchema, idSchema } from "@/lib/validations";

function revalidateBookViews() {
  revalidatePath("/admin/books");
  revalidatePath("/admin/loans");
  revalidatePath("/admin");
  revalidatePath("/library");
}

export async function createBook(input: unknown): Promise<ActionResult> {
  await requireStaff();

  const parsed = bookSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  const data = parsed.data;

  try {
    await prisma.book.create({
      data: {
        title: data.title,
        author: data.author,
        genre: data.genre,
        format: data.format,
        coverUrl: data.coverUrl,
        shelf: data.format === "PHYSICAL" ? data.shelf : null,
        fileUrl: data.format === "DIGITAL" ? data.fileUrl : null,
      },
    });
  } catch (error) {
    console.error("createBook failed", error);

    return actionError(UNEXPECTED_ERROR_MESSAGE);
  }

  revalidateBookViews();

  return { ok: true, message: "Livro adicionado ao acervo." };
}

export async function updateBook(input: unknown): Promise<ActionResult> {
  await requireStaff();

  const parsed = bookUpdateWithIdSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  const data = parsed.data;

  // A physical copy that is currently lent out cannot become a digital title,
  // otherwise the open loan would point at a book nobody has to return.
  if (data.format === "DIGITAL") {
    const activeLoans = await prisma.loan.count({
      where: { bookId: data.id, returnedAt: null },
    });

    if (activeLoans > 0) {
      return actionError(
        "Este livro está emprestado. Registre a devolução antes de convertê-lo em digital.",
      );
    }
  }

  try {
    await prisma.book.update({
      where: { id: data.id },
      data: {
        title: data.title,
        author: data.author,
        genre: data.genre,
        format: data.format,
        coverUrl: data.coverUrl,
        shelf: data.format === "PHYSICAL" ? data.shelf : null,
        fileUrl: data.format === "DIGITAL" ? data.fileUrl : null,
      },
    });
  } catch (error) {
    if (isRecordNotFoundError(error)) return actionError("Livro não encontrado.");

    console.error("updateBook failed", error);

    return actionError(UNEXPECTED_ERROR_MESSAGE);
  }

  revalidateBookViews();

  return { ok: true, message: "Livro atualizado." };
}

export async function deleteBook(input: unknown): Promise<ActionResult> {
  await requireStaff();

  const parsed = idSchema.safeParse(input);

  if (!parsed.success) return validationError(parsed.error);

  const activeLoans = await prisma.loan.count({
    where: { bookId: parsed.data.id, returnedAt: null },
  });

  if (activeLoans > 0) {
    return actionError(
      "Este livro está emprestado no momento. Registre a devolução antes de excluir.",
    );
  }

  try {
    await prisma.book.delete({ where: { id: parsed.data.id } });
  } catch (error) {
    if (isRecordNotFoundError(error)) return actionError("Livro não encontrado.");

    console.error("deleteBook failed", error);

    return actionError(UNEXPECTED_ERROR_MESSAGE);
  }

  revalidateBookViews();

  return { ok: true, message: "Livro removido do acervo." };
}
