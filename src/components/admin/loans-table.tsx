"use client";

import { CheckCircle2, Repeat2, Trash2, Undo2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { ConfirmAction } from "@/components/confirm-action";
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
import { daysUntil, formatDateOnly, formatDateTime } from "@/lib/format";
import { deleteLoan, returnLoan } from "@/server/actions/loans";

export type AdminLoan = {
  id: string;
  dueDate: Date | string;
  returnedAt: Date | string | null;
  user: {
    name: string;
    gradeYear: string | null;
    className: string | null;
    course: string | null;
  };
  book: { title: string; shelf: string | null };
};

function dueBadge(dueDate: Date | string) {
  const days = daysUntil(dueDate);

  if (days < 0) {
    return {
      label: `${Math.abs(days)} dia(s) de atraso`,
      tone: "text-destructive",
    };
  }

  if (days === 0) return { label: "Vence hoje", tone: "text-warning" };
  if (days <= 2) return { label: `Faltam ${days} dia(s)`, tone: "text-warning" };

  return { label: `Faltam ${days} dias`, tone: "text-muted-foreground" };
}

function classGroup(user: AdminLoan["user"]) {
  return (
    [user.gradeYear, user.className, user.course].filter(Boolean).join(" · ") ||
    "—"
  );
}

export function ActiveLoansTable({ loans }: { loans: AdminLoan[] }) {
  const [isPending, startTransition] = useTransition();

  function handleReturn(id: string) {
    startTransition(async () => {
      const result = await returnLoan({ id });

      if (!result.ok) {
        toast.error(result.message);

        return;
      }

      toast.success(result.message ?? "Devolução registrada.");
    });
  }

  function returnButton(loan: AdminLoan) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => handleReturn(loan.id)}
      >
        <Undo2 aria-hidden />
        Devolver
      </Button>
    );
  }

  function dueCell(loan: AdminLoan) {
    const badge = dueBadge(loan.dueDate);

    return (
      <div className="space-y-1">
        <p className="font-mono text-xs">{formatDateOnly(loan.dueDate)}</p>
        <Badge variant="outline" className={badge.tone}>
          {badge.label}
        </Badge>
      </div>
    );
  }

  const columns: Column<AdminLoan>[] = [
    {
      id: "student",
      header: "Aluno",
      cell: (loan) => (
        <div className="min-w-0">
          <p className="truncate font-semibold">{loan.user.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {classGroup(loan.user)}
          </p>
        </div>
      ),
    },
    {
      id: "book",
      header: "Livro",
      cell: (loan) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-primary">{loan.book.title}</p>
          {loan.book.shelf ? (
            <p className="truncate text-xs text-muted-foreground">
              {loan.book.shelf}
            </p>
          ) : null}
        </div>
      ),
    },
    { id: "due", header: "Devolução", cell: dueCell },
    {
      id: "actions",
      header: "Ação",
      align: "end",
      className: "w-32",
      cell: returnButton,
    },
  ];

  if (loans.length === 0) {
    return (
      <Empty className="rounded-2xl border border-dashed border-border/60">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CheckCircle2 aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Nenhum empréstimo em aberto</EmptyTitle>
          <EmptyDescription>
            Todos os exemplares estão na estante.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ResponsiveTable
      items={loans}
      columns={columns}
      getRowKey={(loan) => loan.id}
      renderCard={(loan) => (
        <div className="space-y-3">
          <div>
            <p className="font-semibold">{loan.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {classGroup(loan.user)}
            </p>
          </div>

          <div>
            <p className="font-medium text-primary">{loan.book.title}</p>
            {loan.book.shelf ? (
              <p className="text-xs text-muted-foreground">{loan.book.shelf}</p>
            ) : null}
          </div>

          <div className="flex items-end justify-between gap-3">
            {dueCell(loan)}
            {returnButton(loan)}
          </div>
        </div>
      )}
    />
  );
}

export function LoanHistoryTable({ loans }: { loans: AdminLoan[] }) {
  function removeButton(loan: AdminLoan) {
    return (
      <ConfirmAction
        title="Remover do histórico"
        description="O registro deste empréstimo será apagado definitivamente."
        confirmLabel="Remover"
        onConfirm={() => deleteLoan({ id: loan.id })}
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            aria-label="Remover registro"
          >
            <Trash2 aria-hidden />
          </Button>
        }
      />
    );
  }

  const columns: Column<AdminLoan>[] = [
    {
      id: "student",
      header: "Aluno",
      className: "font-medium",
      cell: (loan) => loan.user.name,
    },
    {
      id: "book",
      header: "Livro",
      className: "text-muted-foreground",
      cell: (loan) => loan.book.title,
    },
    {
      id: "returnedAt",
      header: "Devolvido em",
      className: "hidden sm:table-cell font-mono text-xs",
      cell: (loan) => (loan.returnedAt ? formatDateTime(loan.returnedAt) : "—"),
    },
    {
      id: "actions",
      header: "Ação",
      align: "end",
      className: "w-20",
      cell: removeButton,
    },
  ];

  if (loans.length === 0) {
    return (
      <Empty className="rounded-2xl border border-dashed border-border/60">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Repeat2 aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Sem histórico ainda</EmptyTitle>
          <EmptyDescription>
            Os empréstimos devolvidos aparecem aqui.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ResponsiveTable
      items={loans}
      columns={columns}
      getRowKey={(loan) => loan.id}
      renderCard={(loan) => (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{loan.user.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {loan.book.title}
            </p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {loan.returnedAt ? formatDateTime(loan.returnedAt) : "—"}
            </p>
          </div>
          {removeButton(loan)}
        </div>
      )}
    />
  );
}
