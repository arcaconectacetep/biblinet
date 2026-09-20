# Biblinet

Sistema de biblioteca escolar: acervo físico e digital, empréstimos e devoluções,
portal do aluno e mural da turma. Projeto de feira de ciências, reescrito a partir
do protótipo original (`legacy/`, HTML + Flask + SQLite).

## Stack

| Camada    | Tecnologia                                      |
| --------- | ----------------------------------------------- |
| Framework | Next.js 16 (App Router, Server Actions)         |
| Linguagem | TypeScript                                      |
| Banco     | Supabase (PostgreSQL) via Prisma 7 + `adapter-pg` |
| UI        | Tailwind CSS v4, shadcn/ui sobre Radix, lucide-react |
| Formulários | react-hook-form + Zod (mesmo schema no cliente e no servidor) |
| Sessão    | JWT assinado (`jose`) em cookie HttpOnly        |
| Senhas    | bcrypt (12 rounds)                              |

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencha com as credenciais do Supabase
npm run db:generate          # gera o Prisma Client
npm run db:push              # cria as tabelas no Supabase
npm run db:seed              # cria as contas iniciais e um acervo de exemplo
npm run dev
```

O `db:seed` imprime as senhas geradas **uma única vez** — anote-as. Para definir
senhas fixas, use `SEED_DEV_PASSWORD` / `SEED_ADMIN_PASSWORD` no `.env.local`.

### Scripts

| Comando              | O que faz                                        |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Servidor de desenvolvimento                      |
| `npm run build`      | Build de produção                                |
| `npm run lint`       | ESLint                                           |
| `npm run db:push`    | Aplica o schema no banco (fluxo recomendado com Supabase) |
| `npm run db:seed`    | Popula o banco (idempotente: não sobrescreve senhas existentes) |
| `npm run db:studio`  | Prisma Studio para inspecionar os dados          |

## Perfis de acesso

| Perfil          | Pode                                                                 |
| --------------- | -------------------------------------------------------------------- |
| **Aluno**       | Ver o acervo, abrir PDFs, acompanhar os próprios empréstimos, escrever no mural, relatar problemas |
| **Administrador** | Tudo do aluno + gerenciar alunos, acervo, empréstimos e devoluções |
| **Desenvolvedor** | Tudo do administrador + gerenciar contas da equipe e os relatos de problemas |

Regra importante: administradores só gerenciam contas de **aluno**. Criar, editar
ou excluir contas de administração é exclusivo do perfil desenvolvedor.

### Senhas

- Alunos entram no primeiro acesso com a **data de nascimento** no formato
  `DDMMAAAA` e são obrigados a definir uma senha própria antes de usar o sistema.
- Esqueceu a senha? A recuperação é presencial: a equipe gera uma **senha
  temporária** na tela *Pessoas*, que aparece uma única vez e também exige troca
  no próximo acesso.
- Toda troca de senha invalida as sessões abertas daquela conta.

## O que mudou em relação ao protótipo

O código original está preservado em `legacy/` para comparação na feira.

**Correções de segurança**

| Antes                                                            | Agora                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------ |
| Senhas em texto puro no banco                                     | bcrypt com 12 rounds                                          |
| Rotas da API sem autenticação (qualquer um listava/editava/apagava usuários) | Sessão obrigatória + verificação de papel em toda página e ação |
| Login guardado só no JavaScript do navegador                      | Cookie de sessão HttpOnly, assinado e com expiração de 8h     |
| Chaves de API (Google AI e Pollinations) escritas no HTML          | Nenhum segredo no cliente; tudo em variáveis de ambiente      |
| "Esqueci a senha" exibia o código no próprio `alert()`             | Senha temporária gerada pela equipe no painel                 |
| Mural inseria HTML direto na página (XSS)                          | Conteúdo renderizado como texto pelo React                    |
| Sem limite de tentativas de login                                  | 5 tentativas e bloqueio temporário de 15 minutos              |
| Dados de entrada sem validação                                     | Zod validando no cliente **e** de novo no servidor            |

**Melhorias de produto**

- Livro digital e livro físico deixaram de dividir o mesmo campo "local":
  agora são `shelf` (estante) e `fileUrl` (link do PDF), cada um validado.
- Um exemplar físico não pode ser emprestado duas vezes ao mesmo tempo
  (garantido dentro de uma transação), e livro digital não gera empréstimo.
- Devolução não apaga mais o registro: fica o histórico com data.
- Não é possível excluir aluno ou livro com empréstimo em aberto.
- Painel com atrasos, próximas devoluções e totais do acervo.
- Busca e filtros no acervo, tema escuro consistente e layout responsivo.

## Estrutura

```
prisma/
  schema.prisma          modelo de dados
  seed.ts                dados iniciais
src/
  app/
    (auth)/              login e troca de senha
    (app)/               área autenticada (portal do aluno + painel)
    api/board/           leitura do mural (consultado periodicamente)
  components/            UI da aplicação (ui/ = shadcn)
  lib/                   env, sessão, validações, formatação, constantes
  server/
    actions/             Server Actions (toda escrita passa por aqui)
    queries/             leituras reaproveitadas pelas páginas
  proxy.ts               primeiro filtro de rotas autenticadas
legacy/                  protótipo original, apenas como referência
```

### Onde ficam as regras de segurança

1. `src/proxy.ts` — barra visitantes anônimos antes de renderizar qualquer página.
2. `src/lib/auth/current-user.ts` — resolve a sessão contra o banco (`requireUser`,
   `requireStaff`, `requireRole`).
3. `src/server/actions/*` — toda ação revalida os dados com Zod e confere o papel
   do usuário antes de escrever. O cliente nunca é fonte de verdade.

## Antes de tornar o repositório público

O protótipo em `legacy/` tinha duas chaves de API escritas direto no código
(Google AI Studio e Pollinations). Elas foram **substituídas por um marcador**
para não irem ao GitHub, mas continuam válidas nos serviços de origem: revogue
as duas nos respectivos painéis. Os arquivos `.db` em `legacy/` guardam apenas
os usuários de teste do protótipo.

## Notas

- O schema é aplicado com `prisma db push`. `prisma migrate dev` exigiria um
  *shadow database* e um reset do schema `public`, o que mexeria em objetos
  gerenciados pelo próprio Supabase.
- Capas de livro são carregadas pelo otimizador de imagens do Next.js, então só
  são aceitas de uma lista fixa de sites (`ALLOWED_COVER_HOSTS` em
  `src/lib/constants.ts`).
- `npm audit` aponta avisos vindos de dependências internas da CLI do Prisma
  (`mysql2`, `deepmerge-ts`). Elas não vão para o build de produção — o app usa
  `@prisma/client` e `@prisma/adapter-pg`.
