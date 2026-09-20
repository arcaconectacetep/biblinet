import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * `@db.Date` columns (birth dates, due dates) come back as UTC midnight.
 * Reading them with local getters would shift the day in Brazil, so date-only
 * values are always rebuilt from their UTC parts before being formatted.
 */
function toLocalDateOnly(value: Date | string) {
  const date = new Date(value);

  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
}

/** For `@db.Date` columns. */
export function formatDateOnly(value: Date | string) {
  return format(toLocalDateOnly(value), "dd/MM/yyyy");
}

/** For timestamps. */
export function formatDateTime(value: Date | string) {
  return format(new Date(value), "dd/MM/yyyy 'às' HH:mm");
}

export function formatTime(value: Date | string) {
  return format(new Date(value), "HH:mm");
}

export function formatRelative(value: Date | string) {
  return formatDistanceToNowStrict(new Date(value), {
    addSuffix: true,
    locale: ptBR,
  });
}

/** Days left until a due date — negative once it is overdue. */
export function daysUntil(value: Date | string) {
  return differenceInCalendarDays(toLocalDateOnly(value), new Date());
}

/** Value for an `<input type="date">`. */
export function toDateInputValue(value: Date | string) {
  return format(toLocalDateOnly(value), "yyyy-MM-dd");
}

export function addDaysToToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return format(date, "yyyy-MM-dd");
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** "3º Ano B · Informática", skipping whatever is missing. */
export function formatClassGroup(user: {
  gradeYear?: string | null;
  className?: string | null;
  course?: string | null;
}) {
  const group = [user.gradeYear, user.className].filter(Boolean).join(" ");

  return [group, user.course].filter(Boolean).join(" · ") || "—";
}
