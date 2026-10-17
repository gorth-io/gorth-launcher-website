import "server-only";
import postgres from "@gorth/structure/cores/postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { databaseUrl } from "@/utils/environment";

function connect() {
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
  return drizzle({ client: postgres(databaseUrl, { max: 5, prepare: false }) });
}

const globalDatabase = globalThis as typeof globalThis & {
  websiteDatabase?: ReturnType<typeof connect>;
};

// Importing a page/config must not open a database connection.
export function getDatabase() {
  return (globalDatabase.websiteDatabase ??= connect());
}
