import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(".env");
} catch {
  /* variables fournies par l'environnement (Vercel) */
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL! },
});
