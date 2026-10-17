import "server-only";
import type { MiddlewareHandler } from "hono";
import type { ApiEnv } from "@/utils/interface";
import { getNativeMinecraftIdentity } from "@/services/minecraft-native";

export function requireNativeMinecraft(): MiddlewareHandler<ApiEnv> {
  return async (context, next) => {
    const identity = await getNativeMinecraftIdentity(context.req.raw);
    context.set("user", identity.user);
    context.set("minecraftNativeSessionId", identity.nativeSession.id);
    await next();
  };
}
