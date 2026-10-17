import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "@gorth/structure/cores/zod";
import type { ApiEnv } from "@/utils/interface";
import { RequestError } from "@/lib/http/request";
import { requireNativeMinecraft } from "@/middlewares/minecraft";
import {
  metadata,
  nativeProfile,
  issueGameSession,
  refreshGameSession,
  validateGameSession,
  invalidateGameSession,
  joinMinecraft,
  hasJoinedMinecraft,
  getMinecraftProfile,
  getMinecraftTexture,
  lookupMinecraftProfiles,
} from "@/controllers/minecraft";

export function createMinecraftRoutes() {
  const router = new Hono<ApiEnv>();
  router.use("*", async (context, next) => {
    context.header("Cache-Control", "no-store");
    await next();
  });
  router.onError((error, context) =>
    error instanceof HTTPException
      ? error.getResponse()
      : context.json(
          {
            error:
              error instanceof RequestError && error.status === 403
                ? "ForbiddenOperationException"
                : error instanceof z.ZodError
                  ? "IllegalArgumentException"
                  : "ServiceUnavailable",
            errorMessage:
              error instanceof RequestError
                ? error.message
                : error instanceof z.ZodError
                  ? "Invalid Minecraft request."
                  : "Minecraft service is unavailable. Check migrations and server configuration.",
          },
          (error instanceof RequestError
            ? error.status
            : error instanceof z.ZodError
              ? 400
              : 503) as ContentfulStatusCode,
          { "Cache-Control": "no-store" },
        ),
  );
  // No cookie-authenticated password endpoint is added. The native app exchanges
  // its official Better Auth session for a separate, bounded game credential.
  router.get("/", metadata);
  router.get("/me", requireNativeMinecraft(), nativeProfile);
  router.post("/session", requireNativeMinecraft(), issueGameSession);
  router.post("/authserver/authenticate", (context) =>
    context.json(
      {
        error: "ForbiddenOperationException",
        errorMessage: "Use Gorth SSO through the native Gorth Launcher.",
      },
      403,
    ),
  );
  router.post("/authserver/signout", (context) =>
    context.json(
      {
        error: "ForbiddenOperationException",
        errorMessage: "Use native Gorth sign out.",
      },
      403,
    ),
  );
  router.post("/authserver/refresh", refreshGameSession);
  router.post("/authserver/validate", validateGameSession);
  router.post("/authserver/invalidate", invalidateGameSession);
  router.post("/sessionserver/session/minecraft/join", joinMinecraft);
  router.get("/sessionserver/session/minecraft/hasJoined", hasJoinedMinecraft);
  router.get(
    "/sessionserver/session/minecraft/profile/:id",
    getMinecraftProfile,
  );
  // These path segments are fixed by the external Yggdrasil protocol, not new app API naming.
  router.post("/api/profiles/minecraft", lookupMinecraftProfiles);
  router.get("/texture/:checksum", getMinecraftTexture);
  return router;
}
