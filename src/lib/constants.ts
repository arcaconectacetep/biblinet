import type { BookFormat, BugStatus, Role } from "@/generated/prisma/enums";

export const COURSES = [
  "Agro",
  "Informática",
  "Logística",
  "Administração",
] as const;

export const GRADE_YEARS = ["1º Ano", "2º Ano", "3º Ano"] as const;

export const CLASS_NAMES = ["A", "B", "C"] as const;

export const GENRES = [
  "Romance",
  "Ficção Científica",
  "Fantasia",
  "Terror / Horror",
  "Mistério / Suspense",
  "Aventura",
  "História",
  "Biografia / Autobiografia",
  "Poesia",
  "Didático / Acadêmico",
  "Autoajuda",
  "HQ / Mangá",
  "Conto / Crônica",
  "Drama",
  "Tecnologia / Informática",
] as const;

export const BUG_CATEGORIES = [
  "Erro visual / Layout",
  "Falha ao abrir um PDF",
  "Erro no empréstimo ou devolução",
  "Problema para entrar na conta",
  "Outro problema",
] as const;

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Aluno",
  ADMIN: "Administrador",
  DEV: "Desenvolvedor",
};

export const BOOK_FORMAT_LABELS: Record<BookFormat, string> = {
  PHYSICAL: "Físico",
  DIGITAL: "Digital",
};

export const BUG_STATUS_LABELS: Record<BugStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em análise",
  RESOLVED: "Resolvido",
};

/** Quick-pick loan durations offered on the loan form, in days. */
export const LOAN_DURATION_PRESETS = [7, 14, 30] as const;

export const DEFAULT_LOAN_DURATION_DAYS = 14;

/**
 * Cover images are rendered through the Next.js image optimizer, which fetches
 * the URL server-side — so only well-known book-cover hosts are accepted.
 */
export const ALLOWED_COVER_HOSTS = [
  "covers.openlibrary.org",
  "images.unsplash.com",
  "m.media-amazon.com",
  "books.google.com",
  "upload.wikimedia.org",
] as const;

/** Public message board: messages disappear after this window. */
export const BOARD_MESSAGE_TTL_HOURS = 24;

export const BOARD_MESSAGE_MAX_LENGTH = 280;

/** Seconds a user must wait between two board messages. */
export const BOARD_MESSAGE_COOLDOWN_SECONDS = 10;

/** Failed sign-in attempts tolerated before the account is briefly locked. */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;

export const LOGIN_LOCK_MINUTES = 15;
