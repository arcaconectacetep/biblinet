import { CalendarClock, CheckCircle2, MapPin } from "lucide-react";

import { BookCover } from "@/components/library/book-cover";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { daysUntil, formatDateOnly } from "@/lib/format";
import type { StudentLoan } from "@/server/queries/library";

function dueStatus(dueDate: Date) {
  const days = daysUntil(dueDate);

  if (days < 0) {
    return {
      label: `Atrasado há ${Math.abs(days)} dia(s)`,
      className: "text-destructive",
    };
  }

  if (days === 0) return { label: "Devolver hoje", className: "text-warning" };
  if (days <= 2) {
    return { label: `Faltam ${days} dia(s)`, className: "text-warning" };
  }

  return { label: `Faltam ${days} dias`, className: "text-muted-foreground" };
}

export function MyLoans({ loans }: { loans: StudentLoan[] }) {
  const activeLoans = loans.filter((loan) => !loan.returnedAt);

  if (activeLoans.length === 0) {
    return (
      <Empty className="rounded-lg border border-dashed border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CheckCircle2 aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Nenhum livro com você</EmptyTitle>
          <EmptyDescription>
            Passe na biblioteca para retirar um livro do acervo físico.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {activeLoans.map((loan) => {
        const status = dueStatus(loan.dueDate);

        return (
          <li
            key={loan.id}
            className="flex gap-3 rounded-lg border border-border bg-card p-3"
          >
            <BookCover
              title={loan.book.title}
              coverUrl={loan.book.coverUrl}
              className="w-16 shrink-0"
              sizes="64px"
            />

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <h4 className="line-clamp-2 text-sm leading-snug font-semibold">
                {loan.book.title}
              </h4>
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {loan.book.author}
              </p>

              <p className="mt-auto flex items-center gap-1.5 text-xs">
                <CalendarClock className="size-3.5 shrink-0" aria-hidden />
                <span>Até {formatDateOnly(loan.dueDate)}</span>
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
              </p>

              {loan.book.shelf ? (
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MapPin className="size-3" aria-hidden />
                  Devolver na {loan.book.shelf}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
