import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-shell/app-header";
import { PageTransition } from "@/components/page-transition";
import { requireUser } from "@/lib/auth/current-user";

/**
 * The database lives in Supabase's sa-east-1 region, so the server code
 * runs in São Paulo to keep each query on the same continent.
 */
export const preferredRegion = ["gru1"];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // Nobody reaches the app with a first-access password still in place.
  if (user.mustChangePassword) redirect("/change-password");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <PageTransition>{children}</PageTransition>
      </main>
      <footer className="border-t border-border py-6">
        <p className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground sm:px-6">
          BibliNet · Projeto de biblioteca escolar para a feira de ciências
        </p>
      </footer>
    </div>
  );
}
