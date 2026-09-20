import { z } from "zod";

/**
 * Server-side environment contract. Parsed once at import time so a missing or
 * malformed variable fails loudly on boot instead of at the first query.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1).optional(),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(
    `Invalid environment variables:\n${issues}\n\nCheck your .env.local file.`,
  );
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
