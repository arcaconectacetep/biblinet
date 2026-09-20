import type { Metadata } from "next";
import { BookMarked, CalendarClock, CheckCircle2, GraduationCap } from "lucide-react";

import { BoardPanel } from "@/components/board/board-panel";
import { Catalog } from "@/components/library/catalog";
import { MyLoans } from "@/components/library/my-loans";
import { StatCard } from "@/components/stat-card";
import { requireUser } from "@/lib/auth/current-user";
import { formatClassGroup } from "@/lib/format";
import {
  getBoardMessages,
  getCatalog,
  getStudentLoans,
} from "@/server/queries/library";

export const metadata: Metadata = {
  title: "Biblioteca",
};

export default async function LibraryPage() {
  const user = await requireUser();

  const [catalog, loans, boardMessages] = await Promise.all([
    getCatalog(),
    getStudentLoans(user.id),
    getBoardMessages(),
  ]);

  const activeLoans = loans.filter((loan) => !loan.returnedAt);
  const isStudent = user.role === "STUDENT";
  const availableCount = catalog.filter(
    (book) => book.format === "DIGITAL" || !book.isLent,
  ).length;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Olá, {user.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Explore o acervo, acompanhe as suas devoluções e converse com a turma.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Comigo agora"
          value={activeLoans.length}
          hint={
            activeLoans.length === 1
              ? "1 livro para devolver"
              : `${activeLoans.length} livros para devolver`
          }
          icon={CalendarClock}
          tone={activeLoans.length > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Acervo"
          value={catalog.length}
          hint={`${catalog.filter((book) => book.format === "DIGITAL").length} títulos digitais`}
          icon={BookMarked}
        />
        {isStudent ? (
          <StatCard
            label="Minha turma"
            value={user.gradeYear ?? "—"}
            hint={formatClassGroup(user)}
            icon={GraduationCap}
          />
        ) : (
          <StatCard
            label="Disponíveis"
            value={availableCount}
            hint="prontos para empréstimo ou leitura"
            icon={CheckCircle2}
            tone="success"
          />
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-8">
          {isStudent || activeLoans.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-bold tracking-tight">
                Meus empréstimos
              </h2>
              <MyLoans loans={loans} />
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight">Acervo</h2>
            <Catalog books={catalog} />
          </section>
        </div>

        <aside className="xl:sticky xl:top-22 xl:self-start">
          <BoardPanel
            currentUserId={user.id}
            canModerate={!isStudent}
            initialMessages={boardMessages.map((message) => ({
              ...message,
              createdAt: message.createdAt.toISOString(),
            }))}
          />
        </aside>
      </div>
    </div>
  );
}
