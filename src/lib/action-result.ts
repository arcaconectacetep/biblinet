import type { z } from "zod";

/**
 * Every server action answers with this shape, so forms can show a toast for
 * the general message and attach `fieldErrors` to the matching inputs.
 */
export type ActionResult<TData = undefined> =
  | { ok: true; message?: string; data?: TData }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export function actionError(
  message: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { ok: false, message, fieldErrors };
}

/** Turns a Zod failure into the `fieldErrors` map consumed by the forms. */
export function validationError(
  error: z.ZodError,
  message = "Confira os campos destacados.",
): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "root";
    (fieldErrors[path] ??= []).push(issue.message);
  }

  return { ok: false, message, fieldErrors };
}

export const UNEXPECTED_ERROR_MESSAGE =
  "Não foi possível concluir a operação. Tente novamente.";
