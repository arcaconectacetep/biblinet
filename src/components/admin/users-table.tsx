"use client";

import { KeyRound, Pencil, Search, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog";
import {
  UserFormDialog,
  type EditableUser,
} from "@/components/admin/user-form-dialog";
import { ConfirmAction } from "@/components/confirm-action";
import { ResponsiveTable, type Column } from "@/components/responsive-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/lib/constants";
import { formatClassGroup, getInitials } from "@/lib/format";
import { deleteUser } from "@/server/actions/users";

export type AdminUser = EditableUser & {
  activeLoanCount: number;
  mustChangePassword: boolean;
};

const ROLE_BADGE_VARIANT: Record<Role, "default" | "secondary" | "outline"> = {
  DEV: "default",
  ADMIN: "secondary",
  STUDENT: "outline",
};

function UserIdentity({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Avatar className="size-9">
        <AvatarFallback className="bg-primary/15 text-[11px] font-bold text-primary">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-semibold">
          {user.name}
          {isSelf ? (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              (você)
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          @{user.username}
          {user.registrationNumber ? ` · ${user.registrationNumber}` : ""}
        </p>
      </div>
    </div>
  );
}

function UserBadges({ user }: { user: AdminUser }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={ROLE_BADGE_VARIANT[user.role]}>
        {ROLE_LABELS[user.role]}
      </Badge>
      {user.mustChangePassword ? (
        <Badge variant="outline" className="text-warning">
          Senha provisória
        </Badge>
      ) : null}
      {user.activeLoanCount > 0 ? (
        <Badge variant="outline">
          {user.activeLoanCount} em aberto
        </Badge>
      ) : null}
    </div>
  );
}

export function UsersTable({
  users,
  canManageStaff,
  currentUserId,
}: {
  users: AdminUser[];
  canManageStaff: boolean;
  currentUserId: string;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === "ALL" ||
        (roleFilter === "ADMIN"
          ? user.role !== "STUDENT"
          : user.role === roleFilter);
      const matchesTerm =
        !term ||
        `${user.name} ${user.username} ${user.registrationNumber ?? ""}`
          .toLowerCase()
          .includes(term);

      return matchesRole && matchesTerm;
    });
  }, [users, search, roleFilter]);

  function renderActions(user: AdminUser) {
    const isSelf = user.id === currentUserId;
    const canManage = canManageStaff || user.role === "STUDENT";

    if (!canManage) {
      return (
        <span className="shrink-0 text-xs text-muted-foreground">
          Somente o dev gerencia
        </span>
      );
    }

    return (
      <div className="flex shrink-0 justify-end gap-1">
        <UserFormDialog
          user={user}
          canManageStaff={canManageStaff}
          trigger={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar ${user.name}`}
            >
              <Pencil aria-hidden />
            </Button>
          }
        />

        <ResetPasswordDialog
          userId={user.id}
          userName={user.name}
          trigger={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Gerar senha temporária para ${user.name}`}
            >
              <KeyRound aria-hidden />
            </Button>
          }
        />

        {!isSelf ? (
          <ConfirmAction
            title="Excluir cadastro"
            description={`O cadastro de ${user.name} e o histórico de empréstimos dessa pessoa serão apagados. Esta ação não pode ser desfeita.`}
            confirmLabel="Excluir"
            onConfirm={() => deleteUser({ id: user.id })}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Excluir ${user.name}`}
              >
                <Trash2 aria-hidden />
              </Button>
            }
          />
        ) : null}
      </div>
    );
  }

  const columns: Column<AdminUser>[] = [
    {
      id: "person",
      header: "Pessoa",
      cell: (user) => (
        <UserIdentity user={user} isSelf={user.id === currentUserId} />
      ),
    },
    {
      id: "class",
      header: "Turma",
      className: "hidden lg:table-cell text-xs text-muted-foreground",
      cell: (user) => (user.role === "STUDENT" ? formatClassGroup(user) : "—"),
    },
    {
      id: "profile",
      header: "Perfil",
      cell: (user) => <UserBadges user={user} />,
    },
    {
      id: "actions",
      header: "Ações",
      align: "end",
      className: "w-32",
      cell: (user) => renderActions(user),
    },
  ];

  if (users.length === 0) {
    return (
      <Empty className="rounded-2xl border border-dashed border-border/60">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Nenhuma pessoa cadastrada</EmptyTitle>
          <EmptyDescription>
            Cadastre os alunos para que possam entrar no sistema.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, login ou matrícula"
            aria-label="Buscar pessoa"
            className="h-10 pl-9"
          />
        </div>

        {canManageStaff ? (
          <Tabs
            value={roleFilter}
            onValueChange={(value) => setRoleFilter(value as "ALL" | Role)}
          >
            <TabsList>
              <TabsTrigger value="ALL">Todos</TabsTrigger>
              <TabsTrigger value="STUDENT">Alunos</TabsTrigger>
              <TabsTrigger value="ADMIN">Equipe</TabsTrigger>
            </TabsList>
          </Tabs>
        ) : null}
      </div>

      <ResponsiveTable
        items={filtered}
        columns={columns}
        getRowKey={(user) => user.id}
        emptyMessage="Ninguém corresponde à busca."
        renderCard={(user) => (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <UserIdentity user={user} isSelf={user.id === currentUserId} />
              {renderActions(user)}
            </div>

            <UserBadges user={user} />

            {user.role === "STUDENT" ? (
              <p className="text-xs text-muted-foreground">
                {formatClassGroup(user)}
              </p>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}
