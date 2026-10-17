import "server-only";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { getDatabase } from "@/database";
import { skinTable } from "@/database/schema";
import { skinSelection } from "@/schemas/skin";
import { RequestError } from "@/lib/http/request";
export async function listSkins(userId: string) {
  return getDatabase()
    .select(skinSelection)
    .from(skinTable)
    .where(eq(skinTable.userId, userId))
    .orderBy(desc(skinTable.createdAt), desc(skinTable.id))
    .limit(100);
}
export async function saveSkin(
  userId: string,
  input: {
    name: string;
    model: "classic" | "slim";
    pngBase64: string;
    checksum: string;
  },
) {
  return getDatabase().transaction(async (database) => {
    await database.execute(
      sql`select pg_advisory_xact_lock(hashtext(${userId}))`,
    );
    const [total] = await database
      .select({ value: count() })
      .from(skinTable)
      .where(eq(skinTable.userId, userId));
    if (total.value >= 100)
      throw new RequestError(
        409,
        "You can store up to 100 skins. Delete a skin first.",
      );
    const [skin] = await database
      .insert(skinTable)
      .values({ ...input, userId, isActive: false })
      .returning(skinSelection);
    return skin;
  });
}
export async function getSkin(userId: string, id: string) {
  const [skin] = await getDatabase()
    .select({ ...skinSelection, pngBase64: skinTable.pngBase64 })
    .from(skinTable)
    .where(and(eq(skinTable.id, id), eq(skinTable.userId, userId)))
    .limit(1);
  if (!skin) throw new RequestError(404, "Skin not found.");
  return skin;
}
export async function activateSkin(userId: string, id: string) {
  await getDatabase().transaction(async (database) => {
    await database.execute(
      sql`select pg_advisory_xact_lock(hashtext(${userId}))`,
    );
    const [skin] = await database
      .select({ id: skinTable.id })
      .from(skinTable)
      .where(and(eq(skinTable.id, id), eq(skinTable.userId, userId)))
      .limit(1);
    if (!skin) throw new RequestError(404, "Skin not found.");
    await database
      .update(skinTable)
      .set({ isActive: false })
      .where(and(eq(skinTable.userId, userId), eq(skinTable.isActive, true)));
    await database
      .update(skinTable)
      .set({ isActive: true })
      .where(and(eq(skinTable.id, id), eq(skinTable.userId, userId)));
  });
}
export async function deleteSkin(userId: string, id: string) {
  await getDatabase().transaction(async (database) => {
    await database.execute(
      sql`select pg_advisory_xact_lock(hashtext(${userId}))`,
    );
    const [deleted] = await database
      .delete(skinTable)
      .where(and(eq(skinTable.id, id), eq(skinTable.userId, userId)))
      .returning({ id: skinTable.id });
    if (!deleted) throw new RequestError(404, "Skin not found.");
  });
}
