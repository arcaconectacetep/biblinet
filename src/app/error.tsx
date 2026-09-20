"use client";

import { useEffect } from "react";
import { RefreshCw, ServerCrash } from "lucide-react";

import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Last line of defence: if the database is unreachable mid-demo, visitors get
 * a readable screen and a retry button instead of a stack trace.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="glass-panel w-full max-w-md rounded-3xl">
        <CardContent className="space-y-6 p-8 text-center">
          <BrandMark size="lg" className="mx-auto" />

          <div className="space-y-2">
            <h1 className="flex items-center justify-center gap-2 text-2xl font-extrabold tracking-tight">
              <ServerCrash className="size-6 text-destructive" aria-hidden />
              Algo deu errado
            </h1>
            <p className="text-sm text-muted-foreground">
              Não conseguimos carregar esta página. Verifique a conexão com a
              internet e tente novamente.
            </p>
            {error.digest ? (
              <p className="font-mono text-[10px] text-muted-foreground">
                código: {error.digest}
              </p>
            ) : null}
          </div>

          <Button size="lg" className="w-full" onClick={reset}>
            <RefreshCw aria-hidden />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
