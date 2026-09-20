import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tones = {
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
}) {
  return (
    <Card className="glass-panel rounded-2xl">
      <CardContent className="flex items-start gap-3 p-4">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            tones[tone],
          )}
        >
          <Icon className="size-4.5" aria-hidden />
        </span>

        <div className="min-w-0 space-y-0.5">
          <p className="text-[11px] leading-tight font-semibold tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="text-2xl leading-none font-extrabold tracking-tight">
            {value}
          </p>
          {hint ? (
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
