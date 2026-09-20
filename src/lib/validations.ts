import { z } from "zod";

import {
  ALLOWED_COVER_HOSTS,
  BOARD_MESSAGE_MAX_LENGTH,
  BUG_CATEGORIES,
  GENRES,
} from "@/lib/constants";

const trimmed = z.string().trim();

const optionalText = (max: number) =>
  trimmed
    .max(max, `Use no máximo ${max} caracteres.`)
    .optional()
    .transform((value) => (value ? value : null));

export const passwordSchema = trimmed
  .min(8, "A senha precisa de pelo menos 8 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.")
  .refine((value) => /[A-Za-zÀ-ÿ]/.test(value) && /\d/.test(value), {
    message: "Combine letras e números para uma senha mais segura.",
  });

export const usernameSchema = trimmed
  .min(3, "O login precisa de pelo menos 3 caracteres.")
  .max(40, "O login pode ter no máximo 40 caracteres.")
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "Use apenas letras, números, ponto, hífen ou sublinhado.",
  )
  .transform((value) => value.toLowerCase());

export const loginSchema = z.object({
  username: trimmed
    .min(1, "Informe o seu usuário.")
    .transform((value) => value.toLowerCase()),
  password: trimmed.min(1, "Informe a sua senha."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: trimmed.min(1, "Informe a senha atual."),
    newPassword: passwordSchema,
    confirmPassword: trimmed.min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    message: "A nova senha precisa ser diferente da atual.",
  });

const baseUserSchema = z.object({
  name: trimmed
    .min(3, "Informe o nome completo.")
    .max(120, "Nome muito longo."),
  username: usernameSchema,
  email: z
    .union([z.literal(""), z.email("Informe um e-mail válido.")])
    .optional()
    .transform((value) => (value ? value.toLowerCase() : null)),
  taxId: optionalText(20),
  phone: optionalText(20),
  address: optionalText(180),
});

export const studentSchema = baseUserSchema.extend({
  role: z.literal("STUDENT"),
  registrationNumber: trimmed
    .min(1, "Informe a matrícula.")
    .max(30, "Matrícula muito longa."),
  birthDate: z.iso.date("Informe a data de nascimento."),
  course: trimmed.min(1, "Selecione o curso."),
  gradeYear: trimmed.min(1, "Selecione o ano."),
  className: trimmed.min(1, "Selecione a turma."),
});

export const staffSchema = baseUserSchema.extend({
  role: z.enum(["ADMIN", "DEV"]),
  password: passwordSchema,
});

export const userSchema = z.discriminatedUnion("role", [
  studentSchema,
  staffSchema,
]);

/** Editing never touches the password: that goes through the reset action. */
export const userUpdateSchema = z.discriminatedUnion("role", [
  studentSchema,
  staffSchema.omit({ password: true }),
]);

const withId = { id: trimmed.min(1, "Registro inválido.") };

export const userUpdateWithIdSchema = z.discriminatedUnion("role", [
  studentSchema.extend(withId),
  staffSchema.omit({ password: true }).extend(withId),
]);

const coverUrlSchema = z
  .union([z.literal(""), z.url("Informe uma URL válida (https).")])
  .optional()
  .transform((value) => (value ? value : null))
  .refine(
    (value) => {
      if (!value) return true;

      try {
        const url = new URL(value);

        return (
          url.protocol === "https:" &&
          (ALLOWED_COVER_HOSTS as readonly string[]).includes(url.hostname)
        );
      } catch {
        return false;
      }
    },
    {
      message: `A capa precisa vir de um destes sites: ${ALLOWED_COVER_HOSTS.join(", ")}.`,
    },
  );

const baseBookSchema = z.object({
  title: trimmed.min(1, "Informe o título.").max(180, "Título muito longo."),
  author: trimmed.min(1, "Informe o autor.").max(120, "Nome muito longo."),
  genre: z.enum(GENRES, "Selecione um gênero."),
  coverUrl: coverUrlSchema,
});

export const bookSchema = z.discriminatedUnion("format", [
  baseBookSchema.extend({
    format: z.literal("PHYSICAL"),
    shelf: trimmed
      .min(1, "Informe a estante ou prateleira.")
      .max(60, "Localização muito longa."),
  }),
  baseBookSchema.extend({
    format: z.literal("DIGITAL"),
    fileUrl: z
      .url("Informe o link do PDF (https).")
      .refine((value) => value.startsWith("https://"), {
        message: "O link precisa começar com https://.",
      }),
  }),
]);

export const bookUpdateWithIdSchema = z.discriminatedUnion("format", [
  baseBookSchema.extend({
    format: z.literal("PHYSICAL"),
    shelf: trimmed
      .min(1, "Informe a estante ou prateleira.")
      .max(60, "Localização muito longa."),
    ...withId,
  }),
  baseBookSchema.extend({
    format: z.literal("DIGITAL"),
    fileUrl: z
      .url("Informe o link do PDF (https).")
      .refine((value) => value.startsWith("https://"), {
        message: "O link precisa começar com https://.",
      }),
    ...withId,
  }),
]);

/**
 * The dialogs keep every field in one flat object (react-hook-form cannot
 * switch field names mid-form), validate it here, and send it to the action,
 * where the stricter discriminated unions above pick the right branch.
 */
export const bookFormSchema = z
  .object({
    title: trimmed.min(1, "Informe o título.").max(180, "Título muito longo."),
    author: trimmed.min(1, "Informe o autor.").max(120, "Nome muito longo."),
    genre: z.enum(GENRES, "Selecione um gênero."),
    format: z.enum(["PHYSICAL", "DIGITAL"]),
    shelf: trimmed.max(60, "Localização muito longa.").optional(),
    fileUrl: trimmed.optional(),
    coverUrl: coverUrlSchema,
  })
  .superRefine((data, ctx) => {
    if (data.format === "PHYSICAL" && !data.shelf) {
      ctx.addIssue({
        code: "custom",
        path: ["shelf"],
        message: "Informe a estante ou prateleira.",
      });
    }

    if (data.format === "DIGITAL" && !data.fileUrl?.startsWith("https://")) {
      ctx.addIssue({
        code: "custom",
        path: ["fileUrl"],
        message: "Informe o link do PDF começando com https://.",
      });
    }
  });

export function buildUserFormSchema({
  requirePassword,
}: {
  requirePassword: boolean;
}) {
  return z
    .object({
      role: z.enum(["STUDENT", "ADMIN", "DEV"]),
      name: trimmed.min(3, "Informe o nome completo.").max(120, "Nome muito longo."),
      username: usernameSchema,
      email: z
        .union([z.literal(""), z.email("Informe um e-mail válido.")])
        .optional(),
      taxId: trimmed.max(20).optional(),
      phone: trimmed.max(20).optional(),
      address: trimmed.max(180).optional(),
      registrationNumber: trimmed.max(30).optional(),
      birthDate: trimmed.optional(),
      course: trimmed.optional(),
      gradeYear: trimmed.optional(),
      className: trimmed.optional(),
      password: trimmed.optional(),
    })
    .superRefine((data, ctx) => {
      if (data.role === "STUDENT") {
        const requiredStudentFields = [
          ["registrationNumber", "Informe a matrícula."],
          ["birthDate", "Informe a data de nascimento."],
          ["course", "Selecione o curso."],
          ["gradeYear", "Selecione o ano."],
          ["className", "Selecione a turma."],
        ] as const;

        for (const [field, message] of requiredStudentFields) {
          if (!data[field]) {
            ctx.addIssue({ code: "custom", path: [field], message });
          }
        }

        return;
      }

      if (requirePassword) {
        const result = passwordSchema.safeParse(data.password ?? "");

        if (!result.success) {
          ctx.addIssue({
            code: "custom",
            path: ["password"],
            message: result.error.issues[0].message,
          });
        }
      }
    });
}

export const loanSchema = z.object({
  userId: trimmed.min(1, "Selecione o aluno."),
  bookId: trimmed.min(1, "Selecione o livro."),
  dueDate: z.iso.date("Informe a data de devolução."),
});

export const boardMessageSchema = z.object({
  content: trimmed
    .min(1, "Escreva uma mensagem.")
    .max(
      BOARD_MESSAGE_MAX_LENGTH,
      `A mensagem pode ter no máximo ${BOARD_MESSAGE_MAX_LENGTH} caracteres.`,
    ),
});

export const bugReportSchema = z.object({
  category: z.enum(BUG_CATEGORIES, "Selecione a categoria."),
  description: trimmed
    .min(10, "Descreva o problema com pelo menos 10 caracteres.")
    .max(1000, "Descrição muito longa."),
});

export const bugStatusSchema = z.object({
  id: trimmed.min(1),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
});

export const idSchema = z.object({ id: trimmed.min(1, "Registro inválido.") });

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type BookInput = z.infer<typeof bookSchema>;
export type LoanInput = z.infer<typeof loanSchema>;
