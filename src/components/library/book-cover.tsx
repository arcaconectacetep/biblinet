import { BookOpen } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Covers are optional: without one the book gets a neutral tile with a book
 * glyph. The title is never drawn inside it — every place that shows a cover
 * already prints the title next to it.
 */
export function BookCover({
  title,
  coverUrl,
  className,
  compact = false,
  sizes = "(min-width: 1024px) 220px, 45vw",
}: {
  title: string;
  coverUrl?: string | null;
  className?: string;
  compact?: boolean;
  sizes?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-4/5 w-full overflow-hidden rounded-md border border-border bg-muted",
        className,
      )}
    >
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={`Capa de ${title}`}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <BookOpen
            className={cn(
              "text-muted-foreground/50",
              compact ? "size-4" : "size-8",
            )}
            aria-hidden
          />
        </div>
      )}
    </div>
  );
}
