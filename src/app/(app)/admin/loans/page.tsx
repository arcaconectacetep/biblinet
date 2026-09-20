import type { Metadata } from "next";

import { LoanForm } from "@/components/admin/loan-form";
import {
  ActiveLoansTable,
  LoanHistoryTable,
  type AdminLoan,
} from "@/components/admin/loans-table";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireStaff } from "@/lib/auth/current-user";
import { formatClassGroup } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Empréstimos",
};

const loanSelect = {
  id: true,
  dueDate: true,
  returnedAt: true,
  user: {
    select: { name: true, gradeYear: true, className: true, course: true },
  },
  book: { select: { title: true, shelf: true } },
} as const;

export default async function AdminLoansPage() {
  await requireStaff();

  const [activeLoans, history, students, books] = await Promise.all([
    prisma.loan.findMany({
      where: { returnedAt: null },
      orderBy: { dueDate: "asc" },
      select: loanSelect,
    }),
    prisma.loan.findMany({
      where: { returnedAt: { not: null } },
      orderBy: { returnedAt: "desc" },
      take: 50,
      select: loanSelect,
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        registrationNumber: true,
        gradeYear: true,
        className: true,
        course: true,
      },
    }),
    // Only physical copies that are not out on loan can be lent.
    prisma.book.findMany({
      where: { format: "PHYSICAL", loans: { none: { returnedAt: null } } },
      orderBy: { title: "asc" },
      select: { id: true, title: true, author: true, shelf: true },
    }),
  ]);

  const studentOptions = students.map((student) => ({
    value: student.id,
    label: `${student.name} · ${formatClassGroup(student)}`,
  }));

  const bookOptions = books.map((book) => ({
    value: book.id,
    label: `${book.title} — ${book.author}${book.shelf ? ` (${book.shelf})` : ""}`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empréstimos"
        description={`${activeLoans.length} exemplar(es) fora da estante.`}
      />

      <div className="grid gap-6 lg:grid-cols-[21rem_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-22 lg:self-start">
          <LoanForm students={studentOptions} availableBooks={bookOptions} />
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              Em aberto ({activeLoans.length})
            </TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <ActiveLoansTable loans={activeLoans as AdminLoan[]} />
          </TabsContent>

          <TabsContent value="history">
            <LoanHistoryTable loans={history as AdminLoan[]} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
