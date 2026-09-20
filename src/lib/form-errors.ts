import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import type { ActionResult } from "@/lib/action-result";

/**
 * Copies the `fieldErrors` returned by a server action onto the matching
 * react-hook-form inputs, so server-side validation shows up in the same place
 * as client-side validation.
 */
export function applyFieldErrors<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  result: Extract<ActionResult<unknown>, { ok: false }>,
) {
  if (!result.fieldErrors) return;

  for (const [field, messages] of Object.entries(result.fieldErrors)) {
    if (!messages?.length) continue;

    setError(field as Path<TFieldValues>, {
      type: "server",
      message: messages[0],
    });
  }
}
