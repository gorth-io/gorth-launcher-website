import { readFile } from "node:fs/promises";
import { databaseUrl } from "../utils/environment.ts";
import postgres from "@gorth/structure/cores/postgres";

if (!databaseUrl) throw new Error("DATABASE_URL is required");
const database = postgres(databaseUrl, { max: 1, prepare: false });
try {
  const migration = await readFile(
    new URL("../database/migrations/20261011-better-auth.sql", import.meta.url),
    "utf8",
  );
  const result = await database.begin(async (transaction) => {
    await transaction`SELECT pg_advisory_xact_lock(hashtextextended('gorth:better-auth-migration', 0))`;
    const before = await transaction`SELECT id FROM public."user" ORDER BY id`;
    await transaction.unsafe(migration);
    const after = await transaction`SELECT id FROM public."user" ORDER BY id`;
    if (JSON.stringify(before) !== JSON.stringify(after))
      throw new Error("User identities changed; rollback");
    const missing =
      await transaction`SELECT count(*)::int AS count FROM public."user" u
      WHERE NOT EXISTS (SELECT 1 FROM public.account a WHERE a.user_id = u.id AND a.provider_id = 'gorth' AND a.account_id = u.external_user_id)`;
    if (missing[0].count !== 0)
      throw new Error("Account bindings are incomplete; rollback");
    return { usersPreserved: after.length, accountBindingsVerified: true };
  });
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(
    "Migration failed; transaction rolled back.",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
} finally {
  await database.end();
}
