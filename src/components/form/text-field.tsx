"use client";

import type { FieldError } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError as FieldErrorMessage,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type TextFieldProps = React.ComponentProps<typeof Input> & {
  label: string;
  error?: FieldError;
  description?: string;
  fieldClassName?: string;
};

/** Label + input + validation message, the layout every form here uses. */
export function TextField({
  label,
  error,
  description,
  fieldClassName,
  id,
  name,
  ...inputProps
}: TextFieldProps) {
  const inputId = id ?? name;

  return (
    <Field data-invalid={Boolean(error)} className={fieldClassName}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Input
        id={inputId}
        name={name}
        aria-invalid={Boolean(error)}
        {...inputProps}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldErrorMessage errors={[error]} />
    </Field>
  );
}
