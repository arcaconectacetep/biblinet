import { BookOpen } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Covers are optional: without one, the book still gets a distinctive tile
 * instead of a broken image. Thumbnails (`compact`) show only the icon — the
 * title would be unreadable and spill out of a 40px-wide box.
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
        <div className="flex size-full flex-col items-center justify-center gap-2 overflow-hidden p-3 text-center">
          <BookOpen
            className={cn("text-muted-foreground/60", compact ? "size-4" : "size-6")}
            aria-hidden
          />
          {compact ? null : (
            <span className="line-clamp-4 text-xs leading-snug font-medium text-balance text-foreground/70">
              {title}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
