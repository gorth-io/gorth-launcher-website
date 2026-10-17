import { defineConfig } from "drizzle-kit";
import { loadEnv } from "vite";
import { resolveDatabaseUrl } from "@/utils/environment";

const databaseUrl = resolveDatabaseUrl(
  loadEnv("development", ".", "DATABASE_URL"),
);

export default defineConfig({
  dialect: "postgresql",
  schema: "./database/schema.ts",
  out: "./database/drizzle",
  ...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
});
