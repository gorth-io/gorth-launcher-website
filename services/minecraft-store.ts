import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, gt, lt, sql, desc, inArray } from "drizzle-orm";
import { getDatabase } from "@/database";
import {
  minecraftProfileTable as profile,
  minecraftSessionTable as gameSession,
  minecraftJoinTable as gameJoin,
  userTable,
  sessionTable,
  skinTable,
} from "@/database/schema";
import { getAuthConfig } from "@/lib/auth/config";
import { RequestError } from "@/lib/http/request";
import { hashGameToken, minecraftKey, signTexture } from "@/lib/minecraft/keys";
import { isSsoSessionRevoked } from "@/services/sso";
import type { GameSessionResponse } from "@/schemas/minecraft";

const tokenLifetime = 8 * 60 * 60_000;
export async function getMinecraftProfile(userId: string) {
  const [row] = await getDatabase()
    .select({ id: profile.id, name: profile.name })
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);
  return row ? { id: row.id.replaceAll("-", ""), name: row.name } : null;
}
export async function issueGameSession(
  userId: string,
  nativeSessionId: string,
  clientToken: string,
): Promise<GameSessionResponse> {
  minecraftKey();
  const accessToken = randomBytes(32).toString("base64url");
  return getDatabase().transaction(async (database) => {
    await database.execute(
      sql`select pg_advisory_xact_lock(hashtext(${userId}))`,
    );
    const [parent] = await database
      .select()
      .from(sessionTable)
      .where(
        and(
          eq(sessionTable.id, nativeSessionId),
          eq(sessionTable.userId, userId),
          gt(sessionTable.expiresAt, new Date()),
        ),
      )
      .limit(1);
    const [player] = await database
      .select()
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);
    if (!parent) throw new RequestError(401, "Native session expired.");
    if (!player)
      throw new RequestError(
        409,
        "Create a Minecraft name on the website Profile page first.",
      );
    const existing = await database
      .select()
      .from(gameSession)
      .where(eq(gameSession.profileId, player.id))
      .orderBy(desc(gameSession.createdAt));
    const now = Date.now();
    if (
      existing.filter((item) => item.createdAt.getTime() > now - 60_000)
        .length >= 10
    )
      throw new RequestError(
        429,
        "Too many game sessions. Please wait one minute.",
      );
    if (existing.length >= 10)
      await database.delete(gameSession).where(
        inArray(
          gameSession.tokenHash,
          existing.slice(9).map((item) => item.tokenHash),
        ),
      );
    const expiresAt = Math.min(now + tokenLifetime, parent.expiresAt.getTime());
    await database.insert(gameSession).values({
      tokenHash: hashGameToken(accessToken),
      profileId: player.id,
      nativeSessionId,
      clientToken,
      revision: player.revision,
      expiresAt: new Date(expiresAt),
    });
    return {
      accessToken,
      clientToken,
      expiresAt,
      selectedProfile: { id: player.id.replaceAll("-", ""), name: player.name },
      authlibRoot: new URL("/minecraft", getAuthConfig().origin).href,
    };
  });
}
export async function getValidGameSession(
  accessToken: string,
  clientToken?: string,
) {
  const [row] = await getDatabase()
    .select({
      tokenHash: gameSession.tokenHash,
      clientToken: gameSession.clientToken,
      revision: gameSession.revision,
      profileId: profile.id,
      name: profile.name,
      profileRevision: profile.revision,
      userId: profile.userId,
      nativeSessionId: sessionTable.id,
      expiresAt: gameSession.expiresAt,
      externalUserId: userTable.externalUserId,
      sid: sessionTable.ssoSessionId,
      status: userTable.status,
      deletedAt: userTable.deletedAt,
      bannedAt: userTable.bannedAt,
      banExpires: userTable.banExpires,
    })
    .from(gameSession)
    .innerJoin(profile, eq(profile.id, gameSession.profileId))
    .innerJoin(sessionTable, eq(sessionTable.id, gameSession.nativeSessionId))
    .innerJoin(userTable, eq(userTable.id, profile.userId))
    .where(
      and(
        eq(gameSession.tokenHash, hashGameToken(accessToken)),
        gt(gameSession.expiresAt, new Date()),
        gt(sessionTable.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (
    !row ||
    row.status !== "active" ||
    row.deletedAt ||
    (row.bannedAt && (!row.banExpires || row.banExpires > new Date())) ||
    row.profileRevision !== row.revision ||
    (clientToken !== undefined && clientToken !== row.clientToken) ||
    !row.sid ||
    (await isSsoSessionRevoked(row.externalUserId, row.sid))
  )
    throw new RequestError(403, "Invalid token.");
  return row;
}
export async function refreshGameSession(
  accessToken: string,
  clientToken?: string,
  selectedProfile?: { id: string; name: string },
) {
  const row = await getValidGameSession(accessToken, clientToken);
  if (
    selectedProfile &&
    selectedProfile.id.toLowerCase() !== row.profileId.replaceAll("-", "")
  )
    throw new RequestError(403, "Invalid token.");
  minecraftKey();
  const replacement = randomBytes(32).toString("base64url");
  const result = await getDatabase().transaction(async (database) => {
    await database.execute(
      sql`select pg_advisory_xact_lock(hashtext(${row.userId}))`,
    );
    const [consumed] = await database
      .delete(gameSession)
      .where(
        and(
          eq(gameSession.tokenHash, row.tokenHash),
          gt(gameSession.expiresAt, new Date()),
        ),
      )
      .returning({ id: gameSession.profileId });
    if (!consumed) throw new RequestError(403, "Invalid token.");
    await database.insert(gameSession).values({
      tokenHash: hashGameToken(replacement),
      profileId: row.profileId,
      nativeSessionId: row.nativeSessionId,
      clientToken: row.clientToken,
      revision: row.revision,
      expiresAt: row.expiresAt,
    });
    return {
      accessToken: replacement,
      clientToken: row.clientToken,
      selectedProfile: {
        id: row.profileId.replaceAll("-", ""),
        name: row.name,
      },
    };
  });
  return result;
}
export async function invalidateGameSession(accessToken: string) {
  await getDatabase()
    .delete(gameSession)
    .where(eq(gameSession.tokenHash, hashGameToken(accessToken)));
}
export async function joinMinecraft(input: {
  accessToken: string;
  selectedProfile: string;
  serverId: string;
}) {
  const row = await getValidGameSession(input.accessToken);
  if (input.selectedProfile.toLowerCase() !== row.profileId.replaceAll("-", ""))
    throw new RequestError(403, "Invalid token.");
  await getDatabase().transaction(async (database) => {
    await database.execute(
      sql`select pg_advisory_xact_lock(hashtext(${row.userId}))`,
    );
    // Recheck the live token after acquiring the lock (rename/logout may race).
    const [live] = await database
      .select({ id: gameSession.tokenHash })
      .from(gameSession)
      .where(
        and(
          eq(gameSession.tokenHash, row.tokenHash),
          gt(gameSession.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (!live) throw new RequestError(403, "Invalid token.");
    await database
      .delete(gameJoin)
      .where(
        and(
          eq(gameJoin.profileId, row.profileId),
          lt(gameJoin.expiresAt, new Date()),
        ),
      );
    const existing = await database
      .select({ serverId: gameJoin.serverId })
      .from(gameJoin)
      .where(eq(gameJoin.profileId, row.profileId))
      .limit(31);
    if (
      existing.length >= 30 &&
      !existing.some((item) => item.serverId === input.serverId)
    )
      throw new RequestError(429, "Too many pending joins.");
    const expiresAt = new Date(Date.now() + 30_000);
    await database
      .insert(gameJoin)
      .values({
        profileId: row.profileId,
        serverId: input.serverId,
        tokenHash: row.tokenHash,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [gameJoin.profileId, gameJoin.serverId],
        set: { tokenHash: row.tokenHash, expiresAt },
      });
  });
}
export async function getSignedMinecraftProfile(id: string, unsigned = false) {
  const [row] = await getDatabase()
    .select({
      id: profile.id,
      name: profile.name,
      userId: profile.userId,
      texturePublic: profile.texturePublic,
    })
    .from(profile)
    .innerJoin(userTable, eq(userTable.id, profile.userId))
    .where(
      and(
        sql`replace(${profile.id}::text,'-','') = ${id.toLowerCase()}`,
        eq(userTable.status, "active"),
        sql`${userTable.deletedAt} is null`,
        sql`(${userTable.bannedAt} is null or (${userTable.banExpires} is not null and ${userTable.banExpires} <= now()))`,
      ),
    )
    .limit(1);
  if (!row) return null;
  const [skin] = row.texturePublic
    ? await getDatabase()
        .select({ checksum: skinTable.checksum, model: skinTable.model })
        .from(skinTable)
        .where(
          and(eq(skinTable.userId, row.userId), eq(skinTable.isActive, true)),
        )
        .limit(1)
    : [];
  const value = Buffer.from(
    JSON.stringify({
      timestamp: Date.now(),
      profileId: row.id.replaceAll("-", ""),
      profileName: row.name,
      textures: skin
        ? {
            SKIN: {
              url: new URL(
                "/minecraft/texture/" + skin.checksum,
                getAuthConfig().origin,
              ).href,
              metadata: { model: skin.model === "slim" ? "slim" : "default" },
            },
          }
        : {},
    }),
  ).toString("base64");
  return {
    id: row.id.replaceAll("-", ""),
    name: row.name,
    properties: [
      {
        name: "textures",
        value,
        ...(unsigned ? {} : { signature: signTexture(value) }),
      },
    ],
  };
}
export async function hasJoinedMinecraft(
  username: string,
  serverId: string,
  ip?: string,
) {
  // No trusted client IP is available at this serverless boundary. Never pretend
  // to enforce prevent-proxy-connections using a spoofable forwarded header.
  if (ip) return null;
  const [proof] = await getDatabase()
    .select({ profileId: gameJoin.profileId, tokenHash: gameJoin.tokenHash })
    .from(gameJoin)
    .innerJoin(profile, eq(profile.id, gameJoin.profileId))
    .where(
      and(
        eq(gameJoin.serverId, serverId),
        eq(profile.name, username),
        gt(gameJoin.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!proof) return null;
  const [token] = await getDatabase()
    .select({ clientToken: gameSession.clientToken })
    .from(gameSession)
    .where(eq(gameSession.tokenHash, proof.tokenHash))
    .limit(1);
  if (!token) return null;
  // Re-validate the parent native session and SSO revocation without accepting a decoded token.
  const [live] = await getDatabase()
    .select({
      native: sessionTable.id,
      subject: userTable.externalUserId,
      sid: sessionTable.ssoSessionId,
      revision: gameSession.revision,
      current: profile.revision,
    })
    .from(gameSession)
    .innerJoin(sessionTable, eq(sessionTable.id, gameSession.nativeSessionId))
    .innerJoin(profile, eq(profile.id, gameSession.profileId))
    .innerJoin(userTable, eq(userTable.id, profile.userId))
    .where(
      and(
        eq(gameSession.tokenHash, proof.tokenHash),
        gt(gameSession.expiresAt, new Date()),
        gt(sessionTable.expiresAt, new Date()),
        eq(userTable.status, "active"),
      ),
    )
    .limit(1);
  if (
    !live ||
    !live.sid ||
    live.revision !== live.current ||
    (await isSsoSessionRevoked(live.subject, live.sid))
  )
    return null;
  const [consumed] = await getDatabase()
    .delete(gameJoin)
    .where(
      and(
        eq(gameJoin.profileId, proof.profileId),
        eq(gameJoin.serverId, serverId),
        eq(gameJoin.tokenHash, proof.tokenHash),
        gt(gameJoin.expiresAt, new Date()),
      ),
    )
    .returning({ id: gameJoin.profileId });
  return consumed
    ? getSignedMinecraftProfile(consumed.id.replaceAll("-", ""))
    : null;
}
export async function getMinecraftTexture(checksum: string) {
  const [skin] = await getDatabase()
    .select({ png: skinTable.pngBase64 })
    .from(skinTable)
    .innerJoin(profile, eq(profile.userId, skinTable.userId))
    .innerJoin(userTable, eq(userTable.id, skinTable.userId))
    .where(
      and(
        eq(skinTable.checksum, checksum),
        eq(skinTable.isActive, true),
        eq(profile.texturePublic, true),
        eq(userTable.status, "active"),
        sql`${userTable.deletedAt} is null`,
        sql`(${userTable.bannedAt} is null or (${userTable.banExpires} is not null and ${userTable.banExpires} <= now()))`,
      ),
    )
    .limit(1);
  return skin ? Buffer.from(skin.png, "base64") : null;
}
export async function lookupMinecraftProfiles(names: string[]) {
  const rows = await getDatabase()
    .select({ id: profile.id, name: profile.name })
    .from(profile)
    .innerJoin(userTable, eq(userTable.id, profile.userId))
    .where(
      and(
        inArray(
          sql`lower(${profile.name})`,
          names.map((name) => name.toLowerCase()),
        ),
        eq(userTable.status, "active"),
        sql`${userTable.deletedAt} is null`,
        sql`(${userTable.bannedAt} is null or (${userTable.banExpires} is not null and ${userTable.banExpires} <= now()))`,
      ),
    )
    .limit(100);
  return rows.map((row) => ({
    id: row.id.replaceAll("-", ""),
    name: row.name,
  }));
}
