import { Library } from "lucide-react";

import { cn } from "@/lib/utils";

const sizes = {
  sm: { box: "size-9 rounded-xl", icon: "size-4.5", text: "text-base" },
  md: { box: "size-11 rounded-2xl", icon: "size-5.5", text: "text-xl" },
  lg: { box: "size-16 rounded-3xl", icon: "size-8", text: "text-3xl" },
} as const;

export function BrandMark({
  size = "md",
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center border border-primary/30 bg-gradient-to-br from-primary/30 via-primary/15 to-fuchsia-500/10 text-primary shadow-lg shadow-primary/20",
        sizes[size].box,
        className,
      )}
    >
      <Library className={sizes[size].icon} aria-hidden />
    </span>
  );
}

export function Brand({
  size = "md",
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <BrandMark size={size} />
      <span
        className={cn(
          "font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent",
          sizes[size].text,
        )}
      >
        Biblinet
      </span>
    </span>
  );
}
