import Image from "next/image";

import { cn } from "@/lib/utils";

const sizes = {
  sm: { box: "size-7 rounded-md", px: 28, text: "text-[15px]" },
  md: { box: "size-9 rounded-lg", px: 36, text: "text-lg" },
  lg: { box: "size-14 rounded-xl", px: 56, text: "text-2xl" },
  xl: { box: "size-20 rounded-2xl", px: 80, text: "text-3xl" },
} as const;

export type BrandSize = keyof typeof sizes;

/** The constellation book from the school's logo. */
export function BrandMark({
  size = "md",
  className,
  priority = false,
}: {
  size?: BrandSize;
  className?: string;
  priority?: boolean;
}) {
  const { box, px } = sizes[size];

  return (
    <span
      className={cn(
        "relative inline-block shrink-0 overflow-hidden border border-border/80",
        box,
        className,
      )}
    >
      <Image
        src={px > 64 ? "/brand/mark.png" : "/brand/mark-sm.png"}
        alt=""
        width={px * 2}
        height={px * 2}
        priority={priority}
        className="size-full object-cover"
      />
    </span>
  );
}

export function Brand({
  size = "md",
  className,
  priority = false,
}: {
  size?: BrandSize;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={size} priority={priority} />
      <span
        className={cn(
          "brand-gradient-text font-extrabold tracking-tight",
          sizes[size].text,
        )}
      >
        BibliNet
      </span>
    </span>
  );
}
