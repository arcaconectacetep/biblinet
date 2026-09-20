/** Unique constraint violation. */
const UNIQUE_CONSTRAINT_CODE = "P2002";

type KnownRequestError = {
  code: string;
  meta?: { target?: unknown };
};

function asKnownRequestError(error: unknown): KnownRequestError | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    return error as KnownRequestError;
  }

  return null;
}

/**
 * True when the write failed because `field` (or any field, when omitted)
 * already exists — used to turn a DB error into a message next to the input.
 */
export function isUniqueConstraintError(error: unknown, field?: string) {
  const knownError = asKnownRequestError(error);

  if (knownError?.code !== UNIQUE_CONSTRAINT_CODE) return false;
  if (!field) return true;

  const target = knownError.meta?.target;

  return Array.isArray(target)
    ? target.includes(field)
    : typeof target === "string" && target.includes(field);
}

/** True when the record targeted by an update or delete no longer exists. */
export function isRecordNotFoundError(error: unknown) {
  return asKnownRequestError(error)?.code === "P2025";
}
