import { Library } from "lucide-react";

import { cn } from "@/lib/utils";

const sizes = {
  sm: { box: "size-7 rounded-md", icon: "size-4", text: "text-[15px]" },
  md: { box: "size-9 rounded-lg", icon: "size-5", text: "text-lg" },
  lg: { box: "size-11 rounded-lg", icon: "size-6", text: "text-2xl" },
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
        "inline-flex items-center justify-center bg-primary text-primary-foreground",
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
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      <span
        className={cn("font-semibold tracking-tight", sizes[size].text)}
      >
        Biblinet
      </span>
    </span>
  );
}
