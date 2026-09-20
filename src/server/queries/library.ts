import "server-only";

import { boardMessageCutoff } from "@/lib/board";
import { prisma } from "@/lib/prisma";

export type CatalogBook = Awaited<ReturnType<typeof getCatalog>>[number];
export type StudentLoan = Awaited<ReturnType<typeof getStudentLoans>>[number];
export type BoardMessage = Awaited<ReturnType<typeof getBoardMessages>>[number];

/** Whole catalog plus, for physical titles, whether a copy is available. */
export async function getCatalog() {
  const books = await prisma.book.findMany({
    orderBy: [{ genre: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      author: true,
      genre: true,
      format: true,
      shelf: true,
      fileUrl: true,
      coverUrl: true,
      loans: {
        where: { returnedAt: null },
        select: { id: true, dueDate: true },
        take: 1,
      },
    },
  });

  return books.map(({ loans, ...book }) => ({
    ...book,
    isLent: loans.length > 0,
    dueDate: loans[0]?.dueDate ?? null,
  }));
}

export async function getStudentLoans(userId: string) {
  return prisma.loan.findMany({
    where: { userId },
    orderBy: [{ returnedAt: "asc" }, { dueDate: "asc" }],
    select: {
      id: true,
      dueDate: true,
      returnedAt: true,
      book: {
        select: {
          id: true,
          title: true,
          author: true,
          shelf: true,
          coverUrl: true,
          format: true,
        },
      },
    },
  });
}

/**
 * Board messages live for 24h. Expired ones are pruned here, so the board
 * cleans itself without a scheduled job.
 */
export async function getBoardMessages() {
  const cutoff = boardMessageCutoff();

  await prisma.boardMessage.deleteMany({ where: { createdAt: { lt: cutoff } } });

  return prisma.boardMessage.findMany({
    where: { createdAt: { gte: cutoff } },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      content: true,
      createdAt: true,
      userId: true,
      user: { select: { name: true, role: true } },
    },
  });
}
