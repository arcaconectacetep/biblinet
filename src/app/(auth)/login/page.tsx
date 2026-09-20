import type { Metadata } from "next";
import { BookOpenText, GraduationCap, ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Entrar",
};

const highlights = [
  {
    icon: BookOpenText,
    title: "Acervo físico e digital",
    description:
      "Busque por título, autor ou gênero e leia os títulos digitais na hora.",
  },
  {
    icon: GraduationCap,
    title: "Alunos",
    description:
      "No primeiro acesso, use a sua data de nascimento (DDMMAAAA) como senha.",
  },
  {
    icon: ShieldCheck,
    title: "Equipe da biblioteca",
    description:
      "Empréstimos, devoluções e cadastros com registro de tudo o que acontece.",
  },
];

export default function LoginPage() {
  return (
    <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_minmax(0,26rem)] lg:gap-16">
      <section className="hidden space-y-8 lg:block">
        <div className="flex items-center gap-4">
          <BrandMark size="xl" priority />
          <div>
            <p className="text-3xl font-semibold tracking-tight">BibliNet</p>
            <p className="text-sm text-muted-foreground">
              Sua porta de entrada para o conhecimento infinito
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            A biblioteca da escola, do acervo ao empréstimo.
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Um só lugar para encontrar um livro, saber onde ele está na estante e
            acompanhar a data de devolução.
          </p>
        </div>

        <ul className="space-y-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex gap-3 rounded-lg border border-border bg-card p-4"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4.5" aria-hidden />
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="space-y-5">
        <Card className="surface rounded-xl">
          <CardContent className="space-y-7 p-7 sm:p-8">
            <div className="space-y-4 text-center lg:text-left">
              <BrandMark size="lg" priority className="mx-auto lg:hidden" />
              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold tracking-tight">
                  Bem-vindo ao BibliNet
                </h2>
                <p className="text-sm text-muted-foreground">
                  Entre com o usuário e a senha da escola.
                </p>
              </div>
            </div>

            <LoginForm />
          </CardContent>
        </Card>

        <div className="space-y-2 lg:hidden">
          {highlights.slice(1).map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex gap-3 rounded-lg border border-border bg-card p-4"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
