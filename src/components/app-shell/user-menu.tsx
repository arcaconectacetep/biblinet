"use client";

import { KeyRound, LogOut } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SessionUser } from "@/lib/auth/current-user";
import { ROLE_LABELS } from "@/lib/constants";
import { getInitials } from "@/lib/format";
import { signOut } from "@/server/actions/auth";

export function UserMenu({ user }: { user: SessionUser }) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto gap-2.5 rounded-full py-1.5 pr-3 pl-1.5"
          aria-label="Abrir menu da conta"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-36 text-left leading-tight lg:block">
            <span className="block truncate text-sm font-semibold">
              {user.name.split(" ")[0]}
            </span>
            <span className="block truncate text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              {ROLE_LABELS[user.role]}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="space-y-0.5">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">
            @{user.username}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/change-password">
            <KeyRound aria-hidden />
            Trocar senha
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            startTransition(async () => {
              await signOut();
            });
          }}
        >
          <LogOut aria-hidden />
          {isPending ? "Saindo..." : "Sair"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
