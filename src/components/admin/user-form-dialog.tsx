"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { FormSection } from "@/components/form/form-section";
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
import type { Role } from "@/generated/prisma/enums";
import {
  CLASS_NAMES,
  COURSES,
  GRADE_YEARS,
  ROLE_LABELS,
} from "@/lib/constants";
import { toDateInputValue } from "@/lib/format";
import { applyFieldErrors } from "@/lib/form-errors";
import { buildUserFormSchema } from "@/lib/validations";
import { createUser, updateUser } from "@/server/actions/users";

export type EditableUser = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: Role;
  registrationNumber: string | null;
  birthDate: Date | string | null;
  course: string | null;
  gradeYear: string | null;
  className: string | null;
  taxId: string | null;
  phone: string | null;
  address: string | null;
};

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as Role[]).map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

type UserFormValues = z.input<ReturnType<typeof buildUserFormSchema>>;

function toFormValues(user?: EditableUser): UserFormValues {
  return {
    role: user?.role ?? "STUDENT",
    name: user?.name ?? "",
    username: user?.username ?? "",
    email: user?.email ?? "",
    taxId: user?.taxId ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
    registrationNumber: user?.registrationNumber ?? "",
    birthDate: user?.birthDate ? toDateInputValue(user.birthDate) : "",
    course: user?.course ?? COURSES[0],
    gradeYear: user?.gradeYear ?? GRADE_YEARS[0],
    className: user?.className ?? CLASS_NAMES[0],
    password: "",
  };
}

export function UserFormDialog({
  user,
  canManageStaff,
  trigger,
}: {
  user?: EditableUser;
  canManageStaff: boolean;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(user);

  // A password is only asked for when creating a staff account; students get
  // their birth date and existing accounts use the reset action instead.
  const schema = useMemo(
    () => buildUserFormSchema({ requirePassword: !isEditing }),
    [isEditing],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UserFormValues, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(user),
  });

  const role = useWatch({ control, name: "role" });
  const isStudent = role === "STUDENT";

  useEffect(() => {
    if (open) reset(toFormValues(user));
  }, [open, user, reset]);

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateUser({ ...values, id: user!.id })
        : await createUser(values);

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
            {isEditing ? "Editar cadastro" : "Nova pessoa"}
          </DialogTitle>
          <DialogDescription>
            {isStudent
              ? "No primeiro acesso, o aluno entra com a data de nascimento (DDMMAAAA) e define a própria senha."
              : "Contas da equipe recebem uma senha inicial que precisa ser trocada no primeiro acesso."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* Only the developer account chooses roles; for administrators the
              form stays on the default, STUDENT. */}
          {canManageStaff ? (
            <SelectField
              control={control}
              name="role"
              label="Tipo de conta"
              options={ROLE_OPTIONS}
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nome completo"
              placeholder="Maria Souza"
              autoComplete="name"
              error={errors.name}
              fieldClassName="sm:col-span-2"
              {...register("name")}
            />

            <TextField
              label="Login"
              placeholder="maria.souza"
              autoCapitalize="none"
              spellCheck={false}
              description="Usado para entrar no sistema."
              error={errors.username}
              {...register("username")}
            />

            <TextField
              label="E-mail"
              type="email"
              placeholder="maria@escola.edu.br"
              error={errors.email}
              {...register("email")}
            />

            {!isStudent && !isEditing ? (
              <TextField
                label="Senha inicial"
                type="password"
                autoComplete="new-password"
                description="Mínimo de 8 caracteres, com letras e números."
                error={errors.password}
                fieldClassName="sm:col-span-2"
                {...register("password")}
              />
            ) : null}
          </div>

          {isStudent ? (
            <>
              <FormSection label="Dados escolares" />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Matrícula"
                  placeholder="2026001"
                  error={errors.registrationNumber}
                  {...register("registrationNumber")}
                />

                <TextField
                  label="Data de nascimento"
                  type="date"
                  description="Também é a senha do primeiro acesso."
                  error={errors.birthDate}
                  {...register("birthDate")}
                />

                <SelectField
                  control={control}
                  name="course"
                  label="Curso"
                  options={toOptions(COURSES)}
                />

                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    control={control}
                    name="gradeYear"
                    label="Ano"
                    options={toOptions(GRADE_YEARS)}
                  />
                  <SelectField
                    control={control}
                    name="className"
                    label="Turma"
                    options={toOptions(CLASS_NAMES)}
                  />
                </div>
              </div>
            </>
          ) : null}

          <FormSection label="Contato (opcional)" />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Telefone"
              type="tel"
              placeholder="(00) 00000-0000"
              error={errors.phone}
              {...register("phone")}
            />

            <TextField
              label="CPF"
              placeholder="000.000.000-00"
              error={errors.taxId}
              {...register("taxId")}
            />

            <TextField
              label="Endereço"
              placeholder="Rua, número, bairro"
              error={errors.address}
              fieldClassName="sm:col-span-2"
              {...register("address")}
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
              {isEditing ? "Salvar alterações" : "Cadastrar"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
