import type { Metadata } from "next";
import { UserPlus } from "lucide-react";

import { UserFormDialog } from "@/components/admin/user-form-dialog";
import { UsersTable, type AdminUser } from "@/components/admin/users-table";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Pessoas",
};

export default async function AdminUsersPage() {
  const actor = await requireStaff();
  const canManageStaff = actor.role === "DEV";

  const users = await prisma.user.findMany({
    // Administrators only ever see and manage student accounts.
    where: canManageStaff ? undefined : { role: "STUDENT" },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      registrationNumber: true,
      birthDate: true,
      course: true,
      gradeYear: true,
      className: true,
      taxId: true,
      phone: true,
      address: true,
      mustChangePassword: true,
      _count: { select: { loans: { where: { returnedAt: null } } } },
    },
  });

  const rows: AdminUser[] = users.map(({ _count, ...user }) => ({
    ...user,
    activeLoanCount: _count.loans,
  }));

  const studentCount = rows.filter((user) => user.role === "STUDENT").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pessoas"
        description={`${studentCount} aluno(s) cadastrado(s)${
          canManageStaff ? ` · ${rows.length - studentCount} da equipe` : ""
        }.`}
        action={
          <UserFormDialog
            canManageStaff={canManageStaff}
            trigger={
              <Button size="lg">
                <UserPlus aria-hidden />
                Nova pessoa
              </Button>
            }
          />
        }
      />

      <UsersTable
        users={rows}
        canManageStaff={canManageStaff}
        currentUserId={actor.id}
      />
    </div>
  );
}
