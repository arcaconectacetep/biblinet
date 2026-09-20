"use client";

import { usePathname } from "next/navigation";

/**
 * Fades each route in on arrival. Keyed by pathname so the animation replays
 * on navigation instead of only on the first mount.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="enter-fade">
      {children}
    </div>
  );
}
