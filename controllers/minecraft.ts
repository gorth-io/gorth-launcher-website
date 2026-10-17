import "server-only";
import type { Context } from "hono";
import type { ApiEnv } from "@/utils/interface";
import { readJson, RequestError } from "@/lib/http/request";
import { getAuthConfig } from "@/lib/auth/config";
import { minecraftPublicKey } from "@/lib/minecraft/keys";
import {
  issueGameSessionSchema,
  gameTokenInputSchema,
  gameJoinSchema,
  gameHasJoinedSchema,
  gameUuidSchema,
  gameNamesSchema,
} from "@/schemas/minecraft";
import {
  getMinecraftProfile as getMinecraftProfileServices,
  issueGameSession as issueGameSessionServices,
  getValidGameSession as getValidGameSessionServices,
  refreshGameSession as refreshGameSessionServices,
  invalidateGameSession as invalidateGameSessionServices,
  joinMinecraft as joinMinecraftServices,
  getSignedMinecraftProfile as getSignedMinecraftProfileServices,
  hasJoinedMinecraft as hasJoinedMinecraftServices,
  getMinecraftTexture as getMinecraftTextureServices,
  lookupMinecraftProfiles as lookupMinecraftProfilesServices,
} from "@/services/minecraft-store";

export async function metadata(context: Context<ApiEnv>) {
  const config = getAuthConfig();
  return context.json(
    {
      meta: {
        serverName: "Gorth Minecraft",
        implementationName: "Gorth",
        "feature.non_email_login": false,
        "feature.enable_profile_key": false,
      },
      skinDomains: [new URL(config.origin).hostname],
      signaturePublickey: minecraftPublicKey(),
    },
    200,
  );
}
export async function nativeProfile(context: Context<ApiEnv>) {
  return context.json(
    { profile: await getMinecraftProfileServices(context.get("user").id) },
    200,
  );
}
export async function issueGameSession(context: Context<ApiEnv>) {
  const input = issueGameSessionSchema.parse(
    await readJson(context.req.raw, 1024),
  );
  return context.json(
    await issueGameSessionServices(
      context.get("user").id,
      context.get("minecraftNativeSessionId"),
      input.clientToken,
    ),
    200,
  );
}
export async function refreshGameSession(context: Context<ApiEnv>) {
  const input = gameTokenInputSchema.parse(
    await readJson(context.req.raw, 2048),
  );
  return context.json(
    await refreshGameSessionServices(
      input.accessToken,
      input.clientToken,
      input.selectedProfile,
    ),
    200,
  );
}
export async function validateGameSession(context: Context<ApiEnv>) {
  const input = gameTokenInputSchema.parse(
    await readJson(context.req.raw, 1024),
  );
  await getValidGameSessionServices(input.accessToken, input.clientToken);
  return context.body(null, 204);
}
export async function invalidateGameSession(context: Context<ApiEnv>) {
  const input = gameTokenInputSchema.parse(
    await readJson(context.req.raw, 1024),
  );
  await invalidateGameSessionServices(input.accessToken);
  return context.body(null, 204);
}
export async function joinMinecraft(context: Context<ApiEnv>) {
  const input = gameJoinSchema.parse(await readJson(context.req.raw, 2048));
  await joinMinecraftServices(input);
  return context.body(null, 204);
}
export async function hasJoinedMinecraft(context: Context<ApiEnv>) {
  const input = gameHasJoinedSchema.parse(context.req.query());
  const profile = await hasJoinedMinecraftServices(
    input.username,
    input.serverId,
    input.ip,
  );
  return profile ? context.json(profile, 200) : context.body(null, 204);
}
export async function getMinecraftProfile(context: Context<ApiEnv>) {
  const id = gameUuidSchema.parse(context.req.param("id"));
  const profile = await getSignedMinecraftProfileServices(
    id,
    context.req.query("unsigned") !== "false",
  );
  return profile ? context.json(profile, 200) : context.body(null, 204);
}
export async function getMinecraftTexture(context: Context<ApiEnv>) {
  const id = context.req.param("checksum");
  if (!id || !/^[a-f0-9]{64}$/.test(id))
    throw new RequestError(404, "Texture not found.");
  const bytes = await getMinecraftTextureServices(id);
  if (!bytes) throw new RequestError(404, "Texture not found.");
  return context.body(new Uint8Array(bytes), 200, {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'",
  });
}
export async function lookupMinecraftProfiles(context: Context<ApiEnv>) {
  const names = gameNamesSchema.parse(await readJson(context.req.raw, 4096));
  return context.json(await lookupMinecraftProfilesServices(names), 200);
}
