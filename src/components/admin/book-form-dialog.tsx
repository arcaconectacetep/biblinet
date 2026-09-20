"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { SelectField, toOptions } from "@/components/form/select-field";
import { TextField } from "@/components/form/text-field";
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
import type { BookFormat } from "@/generated/prisma/enums";
import { ALLOWED_COVER_HOSTS, BOOK_FORMAT_LABELS, GENRES } from "@/lib/constants";
import { applyFieldErrors } from "@/lib/form-errors";
import { bookFormSchema } from "@/lib/validations";
import { createBook, updateBook } from "@/server/actions/books";

type BookFormValues = z.input<typeof bookFormSchema>;

export type EditableBook = {
  id: string;
  title: string;
  author: string;
  genre: string;
  format: BookFormat;
  shelf: string | null;
  fileUrl: string | null;
  coverUrl: string | null;
};

const FORMAT_OPTIONS = (
  Object.keys(BOOK_FORMAT_LABELS) as BookFormat[]
).map((value) => ({ value, label: BOOK_FORMAT_LABELS[value] }));

function toFormValues(book?: EditableBook): BookFormValues {
  return {
    title: book?.title ?? "",
    author: book?.author ?? "",
    genre: (book?.genre ?? GENRES[0]) as BookFormValues["genre"],
    format: book?.format ?? "PHYSICAL",
    shelf: book?.shelf ?? "",
    fileUrl: book?.fileUrl ?? "",
    coverUrl: book?.coverUrl ?? "",
  };
}

export function BookFormDialog({
  book,
  trigger,
}: {
  book?: EditableBook;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(book);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<BookFormValues, unknown, z.output<typeof bookFormSchema>>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: toFormValues(book),
  });

  const format = useWatch({ control, name: "format" });

  // Reopening the dialog should always show the stored values again.
  useEffect(() => {
    if (open) reset(toFormValues(book));
  }, [open, book, reset]);

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateBook({ ...values, id: book!.id })
        : await createBook(values);

      if (!result.ok) {
        applyFieldErrors(setError, result);
        toast.error(result.message);

        return;
      }

      toast.success(result.message ?? "Salvo.");
      setOpen(false);
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar livro" : "Adicionar livro ao acervo"}
          </DialogTitle>
          <DialogDescription>
            Livros físicos ficam disponíveis para empréstimo; digitais são lidos
            online pelo link do PDF.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Título"
              placeholder="Dom Casmurro"
              error={errors.title}
              fieldClassName="sm:col-span-2"
              {...register("title")}
            />

            <TextField
              label="Autor"
              placeholder="Machado de Assis"
              error={errors.author}
              {...register("author")}
            />

            <SelectField
              control={control}
              name="genre"
              label="Gênero"
              options={toOptions(GENRES)}
            />

            <SelectField
              control={control}
              name="format"
              label="Formato"
              options={FORMAT_OPTIONS}
            />

            {format === "DIGITAL" ? (
              <TextField
                label="Link do PDF"
                type="url"
                inputMode="url"
                placeholder="https://exemplo.com/livro.pdf"
                error={errors.fileUrl}
                {...register("fileUrl")}
              />
            ) : (
              <TextField
                label="Estante / prateleira"
                placeholder="Estante A-3"
                error={errors.shelf}
                {...register("shelf")}
              />
            )}

            <TextField
              label="Capa (opcional)"
              type="url"
              inputMode="url"
              placeholder="https://covers.openlibrary.org/b/id/000-L.jpg"
              description={`Aceita imagens de: ${ALLOWED_COVER_HOSTS.join(", ")}.`}
              error={errors.coverUrl}
              fieldClassName="sm:col-span-2"
              {...register("coverUrl")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <SubmitButton pending={isPending} pendingLabel="Salvando...">
              <Save aria-hidden />
              {isEditing ? "Salvar alterações" : "Adicionar livro"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
