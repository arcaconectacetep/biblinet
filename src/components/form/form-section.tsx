import { Separator } from "@/components/ui/separator";

/**
 * Labelled divider between groups of fields. Rendered as a block above the
 * grid so the label never lands on top of an input.
 */
export function FormSection({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}
