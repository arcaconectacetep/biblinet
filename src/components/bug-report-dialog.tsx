"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bug, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { SelectField, toOptions } from "@/components/form/select-field";
import { SubmitButton } from "@/components/submit-button";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { BUG_CATEGORIES } from "@/lib/constants";
import { applyFieldErrors } from "@/lib/form-errors";
import { bugReportSchema } from "@/lib/validations";
import { submitBugReport } from "@/server/actions/community";

type BugReportValues = z.input<typeof bugReportSchema>;

export function BugReportDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<BugReportValues, unknown, z.output<typeof bugReportSchema>>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: { category: BUG_CATEGORIES[0], description: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await submitBugReport(values);

      if (!result.ok) {
        applyFieldErrors(setError, result);
        toast.error(result.message);

        return;
      }

      toast.success(result.message ?? "Relato enviado.");
      reset();
      setOpen(false);
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          aria-label="Relatar um problema"
          title="Relatar um problema"
        >
          <Bug aria-hidden />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Relatar um problema</DialogTitle>
          <DialogDescription>
            Encontrou algo errado? Conte o que aconteceu para a equipe corrigir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <SelectField
            control={control}
            name="category"
            label="Categoria"
            options={toOptions(BUG_CATEGORIES)}
          />

          <Field data-invalid={Boolean(errors.description)}>
            <FieldLabel htmlFor="description">Descrição</FieldLabel>
            <Textarea
              id="description"
              rows={5}
              placeholder="Descreva o que aconteceu e em qual tela."
              aria-invalid={Boolean(errors.description)}
              {...register("description")}
            />
            <FieldError errors={[errors.description]} />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <SubmitButton pending={isPending} pendingLabel="Enviando...">
              <Send aria-hidden />
              Enviar relato
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
