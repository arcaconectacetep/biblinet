import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { BrandMark } from "@/components/brand";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/current-user";

export const metadata: Metadata = {
  title: "Trocar senha",
};

export default async function ChangePasswordPage() {
  const user = await requireUser();

  return (
    <Card className="surface mx-auto w-full max-w-md rounded-xl">
      <CardContent className="space-y-7 p-7 sm:p-9">
        <div className="space-y-4 text-center">
          <BrandMark size="lg" className="mx-auto" />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              {user.mustChangePassword ? "Crie a sua senha" : "Trocar senha"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Olá, {user.name.split(" ")[0]}. Escolha uma senha que só você
              conheça.
            </p>
          </div>
        </div>

        {user.mustChangePassword ? (
          <Alert>
            <ShieldAlert aria-hidden />
            <AlertTitle>Primeiro acesso</AlertTitle>
            <AlertDescription>
              Por segurança, a senha inicial precisa ser trocada antes de usar o
              sistema.
            </AlertDescription>
          </Alert>
        ) : null}

        <ChangePasswordForm />
      </CardContent>
    </Card>
  );
}
