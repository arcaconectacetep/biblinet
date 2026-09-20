import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const valueTones = {
  neutral: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
} as const;

/**
 * Metric tile: the number carries the meaning, so the label sits above it in
 * small type and the icon stays a quiet marker in the corner.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof valueTones;
}) {
  return (
    <div className="surface rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
      </div>

      <p
        data-slot="stat-value"
        className={cn(
          "mt-2 text-[28px] leading-none font-semibold tracking-tight",
          valueTones[tone],
        )}
      >
        {value}
      </p>

      {hint ? (
        <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
