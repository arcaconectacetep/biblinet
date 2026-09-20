import Link from "next/link";
import { Compass } from "lucide-react";

import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="glass-panel w-full max-w-md rounded-3xl">
        <CardContent className="space-y-6 p-8 text-center">
          <BrandMark size="lg" className="mx-auto" />

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight">
              Página não encontrada
            </h1>
            <p className="text-sm text-muted-foreground">
              O endereço que você tentou abrir não existe ou foi movido.
            </p>
          </div>

          <Button asChild size="lg" className="w-full">
            <Link href="/">
              <Compass aria-hidden />
              Voltar ao início
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
