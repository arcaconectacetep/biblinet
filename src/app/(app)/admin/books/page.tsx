import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { BookFormDialog } from "@/components/admin/book-form-dialog";
import { BooksTable, type AdminBook } from "@/components/admin/books-table";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Acervo",
};

export default async function AdminBooksPage() {
  await requireStaff();

  const books = await prisma.book.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      author: true,
      genre: true,
      format: true,
      shelf: true,
      fileUrl: true,
      coverUrl: true,
      loans: { where: { returnedAt: null }, select: { id: true }, take: 1 },
    },
  });

  const rows: AdminBook[] = books.map(({ loans, ...book }) => ({
    ...book,
    isLent: loans.length > 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Acervo"
        description={`${books.length} título(s) cadastrado(s) na biblioteca.`}
        action={
          <BookFormDialog
            trigger={
              <Button size="lg">
                <Plus aria-hidden />
                Adicionar livro
              </Button>
            }
          />
        }
      />

      <BooksTable books={rows} />
    </div>
  );
}
