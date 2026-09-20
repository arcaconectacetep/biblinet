import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// The app keeps every secret in .env.local (loaded automatically by Next.js);
// the Prisma CLI needs to be pointed at it explicitly.
loadEnv({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Schema changes must bypass the transaction pooler, so the CLI uses the
    // direct (session mode) connection while the app uses the pooled one.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
