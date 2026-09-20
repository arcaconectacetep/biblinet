"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SelectOption = { value: string; label: string };

export function toOptions(values: readonly string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }));
}

/**
 * Radix `Select` is a controlled component, so it is wired through a
 * `Controller` instead of `register`.
 */
export function SelectField<
  TFieldValues extends FieldValues,
  TContext = unknown,
  TTransformedValues = TFieldValues,
>({
  control,
  name,
  label,
  options,
  placeholder = "Selecione...",
  description,
  className,
}: {
  control: Control<TFieldValues, TContext, TTransformedValues>;
  name: Path<TFieldValues>;
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
  description?: string;
  className?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={Boolean(fieldState.error)} className={className}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Select
            value={field.value ?? ""}
            onValueChange={field.onChange}
            disabled={field.disabled}
          >
            <SelectTrigger
              id={name}
              onBlur={field.onBlur}
              aria-invalid={Boolean(fieldState.error)}
              className="w-full"
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? (
            <FieldDescription>{description}</FieldDescription>
          ) : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
