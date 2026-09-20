import Link from "next/link";

import { MobileNav } from "@/components/app-shell/mobile-nav";
import { NavLinks } from "@/components/app-shell/nav-links";
import { UserMenu } from "@/components/app-shell/user-menu";
import { Brand } from "@/components/brand";
import { BugReportDialog } from "@/components/bug-report-dialog";
import type { SessionUser } from "@/lib/auth/current-user";
import { homePathForRole } from "@/lib/auth/current-user";
import { cn } from "@/lib/utils";

/**
 * Plain divider instead of `Separator`: the component ships a
 * `data-vertical:self-stretch` rule whose specificity beats any alignment
 * class passed in, which pinned the line to the top of the header.
 */
function HeaderDivider({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("h-6 w-px shrink-0 self-center bg-border", className)}
    />
  );
}

export function AppHeader({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <MobileNav role={user.role} />

        <Link
          href={homePathForRole(user.role)}
          className="shrink-0 rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Brand size="sm" />
          <span className="sr-only">Ir para a página inicial</span>
        </Link>

        <HeaderDivider className="hidden md:block" />

        <div className="hidden min-w-0 md:block">
          <NavLinks role={user.role} />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <BugReportDialog />
          <HeaderDivider />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
