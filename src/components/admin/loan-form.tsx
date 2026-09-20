"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BookPlus } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { ComboboxField } from "@/components/form/combobox-field";
import type { SelectOption } from "@/components/form/select-field";
import { TextField } from "@/components/form/text-field";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DEFAULT_LOAN_DURATION_DAYS,
  LOAN_DURATION_PRESETS,
} from "@/lib/constants";
import { addDaysToToday } from "@/lib/format";
import { applyFieldErrors } from "@/lib/form-errors";
import { loanSchema } from "@/lib/validations";
import { createLoan } from "@/server/actions/loans";

type LoanFormValues = z.input<typeof loanSchema>;

export function LoanForm({
  students,
  availableBooks,
}: {
  students: SelectOption[];
  availableBooks: SelectOption[];
}) {
  const [isPending, startTransition] = useTransition();

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LoanFormValues, unknown, z.output<typeof loanSchema>>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      userId: "",
      bookId: "",
      dueDate: addDaysToToday(DEFAULT_LOAN_DURATION_DAYS),
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createLoan(values);

      if (!result.ok) {
        applyFieldErrors(setError, result);
        toast.error(result.message);

        return;
      }

      toast.success(result.message ?? "Empréstimo registrado.");
      reset({
        userId: "",
        bookId: "",
        dueDate: addDaysToToday(DEFAULT_LOAN_DURATION_DAYS),
      });
    });
  });

  const noBooksAvailable = availableBooks.length === 0;

  return (
    <Card className="surface rounded-lg">
      <CardHeader>
        <CardTitle className="text-base">Registrar empréstimo</CardTitle>
        <CardDescription>
          Apenas livros físicos disponíveis aparecem na lista.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <ComboboxField
            control={control}
            name="userId"
            label="Aluno"
            placeholder={
              students.length === 0
                ? "Nenhum aluno cadastrado"
                : "Selecione o aluno"
            }
            searchPlaceholder="Buscar por nome ou turma..."
            emptyMessage="Nenhum aluno encontrado."
            options={students}
          />

          <ComboboxField
            control={control}
            name="bookId"
            label="Livro"
            placeholder={
              noBooksAvailable
                ? "Nenhum exemplar disponível"
                : "Selecione o livro"
            }
            searchPlaceholder="Buscar por título ou autor..."
            emptyMessage="Nenhum livro disponível com esse termo."
            options={availableBooks}
          />

          <div className="space-y-2">
            <TextField
              label="Devolver até"
              type="date"
              min={addDaysToToday(0)}
              error={errors.dueDate}
              {...register("dueDate")}
            />

            <div className="flex flex-wrap gap-1.5">
              {LOAN_DURATION_PRESETS.map((days) => (
                <Button
                  key={days}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setValue("dueDate", addDaysToToday(days), {
                      shouldValidate: true,
                    })
                  }
                >
                  {days} dias
                </Button>
              ))}
            </div>
          </div>

          <SubmitButton
            pending={isPending}
            pendingLabel="Registrando..."
            size="lg"
            className="w-full"
            disabled={noBooksAvailable || students.length === 0}
          >
            <BookPlus aria-hidden />
            Registrar empréstimo
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
