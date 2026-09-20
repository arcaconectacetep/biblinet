"use client";

import { ExternalLink, LibraryBig, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { BookCover } from "@/components/library/book-cover";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BOOK_FORMAT_LABELS } from "@/lib/constants";
import { daysUntil, formatDateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CatalogBook } from "@/server/queries/library";

type FormatFilter = "ALL" | "PHYSICAL" | "DIGITAL";

const FORMAT_FILTERS: { value: FormatFilter; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "PHYSICAL", label: "Físicos" },
  { value: "DIGITAL", label: "Digitais" },
];

const ALL_GENRES = "ALL";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function Catalog({ books }: { books: CatalogBook[] }) {
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState<FormatFilter>("ALL");
  const [genre, setGenre] = useState<string>(ALL_GENRES);

  const genres = useMemo(
    () => [...new Set(books.map((book) => book.genre))].sort((a, b) => a.localeCompare(b)),
    [books],
  );

  const filtered = useMemo(() => {
    const term = normalize(search.trim());

    return books.filter((book) => {
      const matchesFormat = format === "ALL" || book.format === format;
      const matchesGenre = genre === ALL_GENRES || book.genre === genre;
      const matchesTerm =
        term.length === 0 ||
        normalize(`${book.title} ${book.author} ${book.genre}`).includes(term);

      return matchesFormat && matchesGenre && matchesTerm;
    });
  }, [books, search, format, genre]);

  const isFiltered =
    search.trim().length > 0 || format !== "ALL" || genre !== ALL_GENRES;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por título, autor ou gênero"
            aria-label="Buscar no acervo"
            className="h-10 pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger
              className="h-10 w-full sm:w-52"
              aria-label="Filtrar por gênero"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_GENRES}>Todos os gêneros</SelectItem>
              {genres.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div
            role="group"
            aria-label="Filtrar por formato"
            className="flex items-center gap-1 rounded-full border border-border bg-background p-1"
          >
            {FORMAT_FILTERS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant="ghost"
                aria-pressed={format === option.value}
                onClick={() => setFormat(option.value)}
                className={cn(
                  "rounded-full px-3",
                  format === option.value &&
                    "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {filtered.length}{" "}
          {filtered.length === 1 ? "livro encontrado" : "livros encontrados"}
        </p>

        {isFiltered ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setFormat("ALL");
              setGenre(ALL_GENRES);
            }}
          >
            Limpar filtros
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <Empty className="rounded-lg border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LibraryBig aria-hidden />
            </EmptyMedia>
            <EmptyTitle>Nenhum livro encontrado</EmptyTitle>
            <EmptyDescription>
              Tente outra busca ou troque os filtros.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((book, index) => (
            <li
              key={book.id}
              className="enter-view"
              // Only the first rows stagger; after that the delay would be
              // felt as lag rather than polish.
              style={{ animationDelay: `${Math.min(index, 11) * 25}ms` }}
            >
              <BookCard book={book} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LentStatus({ dueDate }: { dueDate: Date | string | null }) {
  const daysLeft = dueDate ? daysUntil(dueDate) : null;
  const isOverdue = daysLeft !== null && daysLeft < 0;
  const isDueToday = daysLeft === 0;

  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-[11px]",
        isOverdue ? "text-destructive" : "text-warning",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isOverdue ? "bg-destructive" : "bg-warning",
        )}
        aria-hidden
      />
      {isOverdue
        ? "Emprestado · devolução atrasada"
        : isDueToday
          ? "Emprestado · volta hoje"
          : `Volta em ${dueDate ? formatDateOnly(dueDate) : "breve"}`}
    </p>
  );
}

function BookCard({ book }: { book: CatalogBook }) {
  const isDigital = book.format === "DIGITAL";

  return (
    <article className="interactive-card group flex h-full flex-col gap-2.5 rounded-lg border border-border bg-card p-2.5">
      <div className="relative overflow-hidden rounded-lg">
        <BookCover title={book.title} coverUrl={book.coverUrl} />

        <span className="absolute top-2 right-2 rounded-full border border-border bg-background/90 px-2 py-0.5 text-[10px] font-medium">
          {BOOK_FORMAT_LABELS[book.format]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <h4 className="line-clamp-2 text-sm leading-snug font-semibold">
          {book.title}
        </h4>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {book.author}
        </p>
        <p className="line-clamp-1 text-[11px] text-muted-foreground">
          {book.genre}
        </p>

        <div className="mt-auto pt-2">
          {isDigital && book.fileUrl ? (
            <Button asChild size="sm" className="w-full">
              <a href={book.fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden />
                Ler PDF
              </a>
            </Button>
          ) : book.isLent ? (
            <LentStatus dueDate={book.dueDate} />
          ) : (
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-[11px] text-success">
                <span className="size-1.5 rounded-full bg-success" aria-hidden />
                Disponível
              </p>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{book.shelf}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
