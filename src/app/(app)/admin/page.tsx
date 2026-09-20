import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  BookMarked,
  CalendarClock,
  GraduationCap,
  Plus,
  Repeat2,
  UserPlus,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/current-user";
import { daysUntil, formatDateOnly } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Painel",
};

type LoanSummary = {
  id: string;
  dueDate: Date;
  user: { name: string };
  book: { title: string };
};

const loanSummarySelect = {
  id: true,
  dueDate: true,
  user: { select: { name: true } },
  book: { select: { title: true } },
} as const;

const QUICK_ACTIONS = [
  { href: "/admin/loans", label: "Registrar empréstimo", icon: Plus },
  { href: "/admin/books", label: "Adicionar livro", icon: BookMarked },
  { href: "/admin/users", label: "Cadastrar aluno", icon: UserPlus },
];

export default async function AdminDashboardPage() {
  const actor = await requireStaff();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    bookCount,
    digitalCount,
    studentCount,
    activeLoanCount,
    overdueLoans,
    upcomingLoans,
  ] = await Promise.all([
    prisma.book.count(),
    prisma.book.count({ where: { format: "DIGITAL" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.loan.count({ where: { returnedAt: null } }),
    prisma.loan.findMany({
      where: { returnedAt: null, dueDate: { lt: startOfToday } },
      orderBy: { dueDate: "asc" },
      take: 6,
      select: loanSummarySelect,
    }),
    prisma.loan.findMany({
      where: { returnedAt: null, dueDate: { gte: startOfToday } },
      orderBy: { dueDate: "asc" },
      take: 6,
      select: loanSummarySelect,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel da biblioteca"
        description={`Bom trabalho, ${actor.name.split(" ")[0]}. Aqui está o resumo de hoje.`}
        action={
          <Button asChild size="lg">
            <Link href="/admin/loans">
              <Plus aria-hidden />
              Novo empréstimo
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Acervo"
          value={bookCount}
          hint={`${digitalCount} digitais`}
          icon={BookMarked}
        />
        <StatCard
          label="Alunos"
          value={studentCount}
          hint="cadastrados no sistema"
          icon={GraduationCap}
        />
        <StatCard
          label="Empréstimos"
          value={activeLoanCount}
          hint="em aberto"
          icon={Repeat2}
          tone={activeLoanCount > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Atrasados"
          value={overdueLoans.length}
          hint="precisam de cobrança"
          icon={AlertTriangle}
          tone={overdueLoans.length > 0 ? "destructive" : "success"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <LoanListCard
          title="Devoluções atrasadas"
          description="Empréstimos que passaram da data combinada."
          icon={
            <AlertTriangle className="size-4 text-destructive" aria-hidden />
          }
          loans={overdueLoans}
          emptyMessage="Nenhum atraso. Biblioteca em dia!"
          renderMeta={(loan) => (
            <Badge variant="outline" className="shrink-0 text-destructive">
              {Math.abs(daysUntil(loan.dueDate))} dia(s)
            </Badge>
          )}
        />

        <LoanListCard
          title="Próximas devoluções"
          description="Quem devolve nos próximos dias."
          icon={<CalendarClock className="size-4 text-primary" aria-hidden />}
          loans={upcomingLoans}
          emptyMessage="Nenhum empréstimo em aberto."
          renderMeta={(loan) => (
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {formatDateOnly(loan.dueDate)}
            </span>
          )}
        />

        <Card className="glass-panel rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Atalhos</CardTitle>
            <CardDescription>As tarefas mais comuns do dia.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-2">
            {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
              <Button
                key={href}
                asChild
                variant="outline"
                size="lg"
                className="justify-start"
              >
                <Link href={href}>
                  <Icon aria-hidden />
                  {label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoanListCard({
  title,
  description,
  icon,
  loans,
  emptyMessage,
  renderMeta,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  loans: LoanSummary[];
  emptyMessage: string;
  renderMeta: (loan: LoanSummary) => React.ReactNode;
}) {
  return (
    <Card className="glass-panel rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {loans.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {loans.map((loan) => (
              <li
                key={loan.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {loan.user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {loan.book.title}
                  </p>
                </div>
                {renderMeta(loan)}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
