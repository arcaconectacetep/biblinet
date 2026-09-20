import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Students receive their birth date (DDMMYYYY) as the first-access password and
 * are forced to replace it on login, which keeps enrolment simple for the
 * library desk without leaving a guessable password in place.
 */
export function buildFirstAccessPassword(birthDate: Date): string {
  const day = `${birthDate.getUTCDate()}`.padStart(2, "0");
  const month = `${birthDate.getUTCMonth() + 1}`.padStart(2, "0");
  const year = `${birthDate.getUTCFullYear()}`;

  return `${day}${month}${year}`;
}

const TEMPORARY_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Human-readable one-time password handed out by an administrator. */
export function generateTemporaryPassword(length = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(
    bytes,
    (byte) => TEMPORARY_PASSWORD_ALPHABET[byte % TEMPORARY_PASSWORD_ALPHABET.length],
  ).join("");
}
