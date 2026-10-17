import "server-only";
import { and, count, desc, eq, or, sql } from "drizzle-orm";
import { getDatabase } from "@/database";
import {
  userTable,
  minecraftProfileTable,
  minecraftSessionTable,
  friendshipTable,
} from "@/database/schema";
import {
  profilePreferencesSchema,
  type ProfileUpdate,
} from "@/schemas/profile";
import { RequestError } from "@/lib/http/request";
import { minecraftSigningPrivateKeyBase64 } from "@/utils/environment";

export async function getProfile(userId: string) {
  const [user] = await getDatabase()
    .select({ metadata: userTable.metadata })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  const [profile] = await getDatabase()
    .select()
    .from(minecraftProfileTable)
    .where(eq(minecraftProfileTable.userId, userId))
    .limit(1);
  const metadata = (user?.metadata ?? {}) as { dashboard?: unknown };
  const preferences = profilePreferencesSchema.safeParse(metadata.dashboard);
  return {
    profile: profile ?? null,
    preferences: {
      ...(preferences.success
        ? preferences.data
        : profilePreferencesSchema.parse({})),
      publicSkin: profile?.texturePublic ?? false,
    },
    signingReady: Boolean(minecraftSigningPrivateKeyBase64),
  };
}
export async function updateProfile(userId: string, input: ProfileUpdate) {
  await getDatabase().transaction(async (database) => {
    await database.execute(
      sql`select pg_advisory_xact_lock(hashtext(${userId}))`,
    );
    if (input.action === "preferences") {
      if (input.preferences.publicSkin) {
        const [profile] = await database
          .select({ id: minecraftProfileTable.id })
          .from(minecraftProfileTable)
          .where(eq(minecraftProfileTable.userId, userId))
          .limit(1);
        if (!profile)
          throw new RequestError(
            409,
            "Create your Minecraft profile before publishing a skin.",
          );
      }
      await database
        .update(minecraftProfileTable)
        .set({ texturePublic: input.preferences.publicSkin })
        .where(eq(minecraftProfileTable.userId, userId));
      await database
        .update(userTable)
        .set({
          metadata: sql`jsonb_set(coalesce(${userTable.metadata}, '{}'::jsonb), '{dashboard}', ${JSON.stringify(input.preferences)}::jsonb, true)`,
        })
        .where(eq(userTable.id, userId));
      return;
    }
    const [old] = await database
      .select()
      .from(minecraftProfileTable)
      .where(eq(minecraftProfileTable.userId, userId))
      .limit(1);
    if (old?.name === input.name) return;
    const [used] = await database
      .select({ id: minecraftProfileTable.id })
      .from(minecraftProfileTable)
      .where(
        sql`lower(${minecraftProfileTable.name}) = ${input.name.toLowerCase()}`,
      )
      .limit(1);
    if (used && used.id !== old?.id)
      throw new RequestError(409, "This Minecraft name is already in use.");
    try {
      if (old) {
        await database
          .update(minecraftProfileTable)
          .set({
            name: input.name,
            revision: old.revision + 1,
            updatedAt: new Date(),
          })
          .where(eq(minecraftProfileTable.id, old.id));
        await database
          .delete(minecraftSessionTable)
          .where(eq(minecraftSessionTable.profileId, old.id));
      } else
        await database
          .insert(minecraftProfileTable)
          .values({ userId, name: input.name });
    } catch (error) {
      const code =
        (error as { code?: string; cause?: { code?: string } }).code ??
        (error as { cause?: { code?: string } }).cause?.code;
      if (code === "23505")
        throw new RequestError(409, "This Minecraft name is already in use.");
      throw error;
    }
  });
  return getProfile(userId);
}
export async function listFriends(userId: string) {
  return getDatabase()
    .select({
      id: friendshipTable.id,
      name: minecraftProfileTable.name,
      avatar: userTable.image,
      status: friendshipTable.status,
      incoming: sql<boolean>`${friendshipTable.recipientId} = ${userId}`,
      createdAt: friendshipTable.createdAt,
    })
    .from(friendshipTable)
    .innerJoin(
      minecraftProfileTable,
      eq(
        minecraftProfileTable.userId,
        sql`case when ${friendshipTable.requesterId} = ${userId} then ${friendshipTable.recipientId} else ${friendshipTable.requesterId} end`,
      ),
    )
    .innerJoin(userTable, eq(userTable.id, minecraftProfileTable.userId))
    .where(
      and(
        or(
          eq(friendshipTable.requesterId, userId),
          eq(friendshipTable.recipientId, userId),
        ),
        eq(userTable.status, "active"),
      ),
    )
    .orderBy(desc(friendshipTable.createdAt), desc(friendshipTable.id))
    .limit(200);
}
export async function requestFriend(userId: string, name: string) {
  const [target] = await getDatabase()
    .select({ id: userTable.id })
    .from(minecraftProfileTable)
    .innerJoin(userTable, eq(userTable.id, minecraftProfileTable.userId))
    .where(
      and(
        sql`lower(${minecraftProfileTable.name}) = ${name.toLowerCase()}`,
        eq(userTable.status, "active"),
      ),
    )
    .limit(1);
  if (!target || target.id === userId)
    throw new RequestError(400, "Choose another existing Minecraft profile.");
  await getDatabase().transaction(async (database) => {
    // Stable lock ordering keeps reciprocal requests bounded without deadlocks.
    for (const id of [userId, target.id].sort())
      await database.execute(
        sql`select pg_advisory_xact_lock(hashtext(${id}))`,
      );
    const [own] = await database
      .select({ id: minecraftProfileTable.id })
      .from(minecraftProfileTable)
      .where(eq(minecraftProfileTable.userId, userId))
      .limit(1);
    if (!own)
      throw new RequestError(
        409,
        "Create your Minecraft name before sending requests.",
      );
    const [recipient] = await database
      .select({ metadata: userTable.metadata, status: userTable.status })
      .from(userTable)
      .where(eq(userTable.id, target.id))
      .limit(1);
    if (!recipient || recipient.status !== "active")
      throw new RequestError(400, "Choose another existing Minecraft profile.");
    const preferences = profilePreferencesSchema.safeParse(
      (recipient.metadata as { dashboard?: unknown })?.dashboard,
    );
    if (preferences.success && !preferences.data.allowFriendRequests)
      throw new RequestError(
        403,
        "This profile does not accept friend requests.",
      );
    for (const id of [userId, target.id]) {
      const [total] = await database
        .select({ value: count() })
        .from(friendshipTable)
        .where(
          or(
            eq(friendshipTable.requesterId, id),
            eq(friendshipTable.recipientId, id),
          ),
        );
      if (total.value >= 200)
        throw new RequestError(409, "Friend list limit reached.");
    }
    const inserted = await database
      .insert(friendshipTable)
      .values({ requesterId: userId, recipientId: target.id })
      .onConflictDoNothing()
      .returning({ id: friendshipTable.id });
    if (!inserted.length)
      throw new RequestError(409, "A request or friendship already exists.");
  });
}
export async function changeFriend(
  userId: string,
  id: string,
  action: "accept" | "remove",
) {
  const owner = or(
    eq(friendshipTable.requesterId, userId),
    eq(friendshipTable.recipientId, userId),
  );
  const rows =
    action === "accept"
      ? await getDatabase()
          .update(friendshipTable)
          .set({ status: "accepted" })
          .where(
            and(
              eq(friendshipTable.id, id),
              eq(friendshipTable.recipientId, userId),
              eq(friendshipTable.status, "requested"),
            ),
          )
          .returning({ id: friendshipTable.id })
      : await getDatabase()
          .delete(friendshipTable)
          .where(and(eq(friendshipTable.id, id), owner))
          .returning({ id: friendshipTable.id });
  if (!rows.length) throw new RequestError(404, "Friend request not found.");
}
