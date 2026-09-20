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
        "relative aspect-3/4 w-full overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-primary/25 via-card to-fuchsia-500/10",
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
        <div className="flex size-full flex-col items-center justify-center gap-1.5 overflow-hidden p-2 text-center">
          <BookOpen
            className={cn("text-primary/70", compact ? "size-4" : "size-7")}
            aria-hidden
          />
          {compact ? null : (
            <span className="line-clamp-3 text-[11px] leading-tight font-semibold text-balance text-muted-foreground">
              {title}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
