"use client";

import { Check, Copy, KeyRound } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { resetUserPassword } from "@/server/actions/users";

/**
 * Password recovery is handled in person: the librarian generates a one-time
 * password here and hands it to the student, who must change it on next login.
 */
export function ResetPasswordDialog({
  userId,
  userName,
  trigger,
}: {
  userId: string;
  userName: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setTemporaryPassword(null);
      setCopied(false);
    }
  }

  function handleGenerate() {
    startTransition(async () => {
      const result = await resetUserPassword({ id: userId });

      if (!result.ok || !result.data) {
        toast.error(
          result.ok ? "Não foi possível gerar a senha." : result.message,
        );

        return;
      }

      setTemporaryPassword(result.data.temporaryPassword);
    });
  }

  async function handleCopy() {
    if (!temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
    } catch {
      toast.error("Não foi possível copiar. Anote a senha manualmente.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar senha temporária</DialogTitle>
          <DialogDescription>
            {temporaryPassword
              ? `Entregue esta senha a ${userName}. Ela aparece apenas uma vez.`
              : `Uma nova senha será criada para ${userName}, encerrando as sessões abertas dessa conta.`}
          </DialogDescription>
        </DialogHeader>

        {temporaryPassword ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-center font-mono text-lg font-bold tracking-[0.2em]">
                {temporaryPassword}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                onClick={handleCopy}
                aria-label="Copiar senha"
              >
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              </Button>
            </div>

            <Alert>
              <KeyRound aria-hidden />
              <AlertTitle>Troca obrigatória</AlertTitle>
              <AlertDescription>
                No próximo acesso, a pessoa precisará definir uma senha própria.
              </AlertDescription>
            </Alert>
          </div>
        ) : null}

        <DialogFooter>
          {temporaryPassword ? (
            <Button type="button" onClick={() => handleOpenChange(false)}>
              Concluir
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <SubmitButton
                type="button"
                pending={isPending}
                pendingLabel="Gerando..."
                onClick={handleGenerate}
              >
                <KeyRound aria-hidden />
                Gerar senha
              </SubmitButton>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
