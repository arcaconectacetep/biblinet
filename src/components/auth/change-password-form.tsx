"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { applyFieldErrors } from "@/lib/form-errors";
import { changePasswordSchema } from "@/lib/validations";
import { changePassword } from "@/server/actions/auth";

type ChangePasswordValues = z.input<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<
    ChangePasswordValues,
    unknown,
    z.output<typeof changePasswordSchema>
  >({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      const result = await changePassword(values);

      if (result && !result.ok) {
        applyFieldErrors(setError, result);
        setFormError(result.message);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Field data-invalid={Boolean(errors.currentPassword)}>
        <FieldLabel htmlFor="currentPassword">Senha atual</FieldLabel>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.currentPassword)}
          className="h-11"
          {...register("currentPassword")}
        />
        <FieldError errors={[errors.currentPassword]} />
      </Field>

      <Field data-invalid={Boolean(errors.newPassword)}>
        <FieldLabel htmlFor="newPassword">Nova senha</FieldLabel>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.newPassword)}
          className="h-11"
          {...register("newPassword")}
        />
        <FieldDescription>
          Pelo menos 8 caracteres, combinando letras e números.
        </FieldDescription>
        <FieldError errors={[errors.newPassword]} />
      </Field>

      <Field data-invalid={Boolean(errors.confirmPassword)}>
        <FieldLabel htmlFor="confirmPassword">Confirmar nova senha</FieldLabel>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          className="h-11"
          {...register("confirmPassword")}
        />
        <FieldError errors={[errors.confirmPassword]} />
      </Field>

      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <SubmitButton
        pending={isPending}
        pendingLabel="Salvando..."
        size="lg"
        className="h-11 w-full text-sm"
      >
        <KeyRound aria-hidden />
        Salvar nova senha
      </SubmitButton>
    </form>
  );
}
