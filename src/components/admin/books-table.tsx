"use client";

import { BookMarked, ExternalLink, MapPin, Pencil, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  BookFormDialog,
  type EditableBook,
} from "@/components/admin/book-form-dialog";
import { ConfirmAction } from "@/components/confirm-action";
import { BookCover } from "@/components/library/book-cover";
import { ResponsiveTable, type Column } from "@/components/responsive-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { BOOK_FORMAT_LABELS } from "@/lib/constants";
import { deleteBook } from "@/server/actions/books";

export type AdminBook = EditableBook & { isLent: boolean };

function BookIdentity({ book }: { book: AdminBook }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <BookCover
        title={book.title}
        coverUrl={book.coverUrl}
        compact
        className="w-10 shrink-0"
        sizes="40px"
      />
      <div className="min-w-0">
        <p className="truncate font-semibold">{book.title}</p>
        <p className="truncate text-xs text-muted-foreground">{book.author}</p>
      </div>
    </div>
  );
}

function FormatBadges({ book }: { book: AdminBook }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={book.format === "DIGITAL" ? "secondary" : "outline"}>
        {BOOK_FORMAT_LABELS[book.format]}
      </Badge>
      {book.isLent ? (
        <Badge variant="outline" className="text-warning">
          Emprestado
        </Badge>
      ) : null}
    </div>
  );
}

function BookLocation({ book }: { book: AdminBook }) {
  if (book.format === "DIGITAL" && book.fileUrl) {
    return (
      <a
        href={book.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <ExternalLink className="size-3.5" aria-hidden />
        Abrir PDF
      </a>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <MapPin className="size-3.5" aria-hidden />
      {book.shelf}
    </span>
  );
}

function BookActions({ book }: { book: AdminBook }) {
  return (
    <div className="flex shrink-0 justify-end gap-1">
      <BookFormDialog
        book={book}
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Editar ${book.title}`}
          >
            <Pencil aria-hidden />
          </Button>
        }
      />

      <ConfirmAction
        title="Excluir livro"
        description={`"${book.title}" será removido do acervo e do histórico de empréstimos. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={() => deleteBook({ id: book.id })}
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Excluir ${book.title}`}
          >
            <Trash2 aria-hidden />
          </Button>
        }
      />
    </div>
  );
}

const columns: Column<AdminBook>[] = [
  {
    id: "book",
    header: "Livro",
    cell: (book) => <BookIdentity book={book} />,
  },
  {
    id: "genre",
    header: "Gênero",
    className: "hidden lg:table-cell text-muted-foreground text-xs",
    cell: (book) => book.genre,
  },
  {
    id: "format",
    header: "Formato",
    cell: (book) => <FormatBadges book={book} />,
  },
  {
    id: "location",
    header: "Onde está",
    className: "hidden lg:table-cell",
    cell: (book) => <BookLocation book={book} />,
  },
  {
    id: "actions",
    header: "Ações",
    align: "end",
    className: "w-24",
    cell: (book) => <BookActions book={book} />,
  },
];

export function BooksTable({ books }: { books: AdminBook[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return books;

    return books.filter((book) =>
      `${book.title} ${book.author} ${book.genre}`.toLowerCase().includes(term),
    );
  }, [books, search]);

  if (books.length === 0) {
    return (
      <Empty className="rounded-lg border border-dashed border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookMarked aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Acervo vazio</EmptyTitle>
          <EmptyDescription>
            Cadastre o primeiro livro para começar a emprestar.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:max-w-sm">
        <Search
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar livro"
          aria-label="Buscar livro"
          className="h-10 pl-9"
        />
      </div>

      <ResponsiveTable
        items={filtered}
        columns={columns}
        getRowKey={(book) => book.id}
        emptyMessage="Nenhum livro corresponde à busca."
        renderCard={(book) => (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <BookIdentity book={book} />
              <BookActions book={book} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <FormatBadges book={book} />
              <BookLocation book={book} />
            </div>

            <p className="text-xs text-muted-foreground">{book.genre}</p>
          </div>
        )}
      />
    </div>
  );
}
