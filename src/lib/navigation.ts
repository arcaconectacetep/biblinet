import {
  BookMarked,
  BookOpen,
  Bug,
  LayoutDashboard,
  Repeat2,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/generated/prisma/enums";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const STAFF_NAV: NavItem[] = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/books", label: "Acervo", icon: BookMarked },
  { href: "/admin/loans", label: "Empréstimos", icon: Repeat2 },
  { href: "/admin/users", label: "Pessoas", icon: Users },
  { href: "/library", label: "Ver como aluno", icon: BookOpen },
];

const DEV_NAV: NavItem[] = [
  { href: "/admin/reports", label: "Relatos", icon: Bug },
];

const STUDENT_NAV: NavItem[] = [
  { href: "/library", label: "Biblioteca", icon: BookOpen },
];

export function navItemsForRole(role: Role): NavItem[] {
  if (role === "STUDENT") return STUDENT_NAV;

  const items = [...STAFF_NAV];

  if (role === "DEV") {
    // Bug reports live next to the other management screens.
    items.splice(4, 0, ...DEV_NAV);
  }

  return items;
}
