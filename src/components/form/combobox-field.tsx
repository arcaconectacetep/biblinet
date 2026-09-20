"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import type { SelectOption } from "@/components/form/select-field";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** "José" and "jose" must match each other, both ways. */
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Select with a search box, for lists that grow with the school: every
 * student, every book on the shelf. Small fixed lists keep using `SelectField`.
 */
export function ComboboxField<
  TFieldValues extends FieldValues,
  TContext = unknown,
  TTransformedValues = TFieldValues,
>({
  control,
  name,
  label,
  options,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nada encontrado.",
  description,
  disabled,
  className,
}: {
  control: Control<TFieldValues, TContext, TTransformedValues>;
  name: Path<TFieldValues>;
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected = options.find((option) => option.value === field.value);

        return (
          <Field data-invalid={Boolean(fieldState.error)} className={className}>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={name}
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  aria-invalid={Boolean(fieldState.error)}
                  disabled={disabled || options.length === 0}
                  onBlur={field.onBlur}
                  className="h-9 w-full justify-between px-3 font-normal"
                >
                  <span
                    className={cn(
                      "truncate",
                      !selected && "text-muted-foreground",
                    )}
                  >
                    {selected?.label ?? placeholder}
                  </span>
                  <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
                </Button>
              </PopoverTrigger>

              <PopoverContent
                align="start"
                // At least as wide as the field, but free to grow so long
                // names are not cut off inside a narrow column.
                className="w-max min-w-(--radix-popover-trigger-width) max-w-[min(26rem,calc(100vw-2rem))] p-0"
              >
                <Command
                  filter={(value, search) =>
                    normalize(value).includes(normalize(search)) ? 1 : 0
                  }
                >
                  <CommandInput placeholder={searchPlaceholder} />
                  <CommandList>
                    <CommandEmpty>{emptyMessage}</CommandEmpty>
                    {options.map((option) => (
                      <CommandItem
                        key={option.value}
                        // cmdk searches this string, not the element's markup.
                        value={`${option.label} ${option.value}`}
                        onSelect={() => {
                          field.onChange(option.value);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "size-4",
                            option.value === field.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                          aria-hidden
                        />
                        <span className="truncate">{option.label}</span>
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {description ? (
              <FieldDescription>{description}</FieldDescription>
            ) : null}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
