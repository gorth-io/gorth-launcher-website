import "server-only";
import type { MiddlewareHandler } from "hono";
import type { ApiEnv } from "@/utils/interface";
import { requireUser } from "@/lib/http/request";

export function requireAuth(mutation = false): MiddlewareHandler<ApiEnv> {
  return async (context, next) => {
    context.header("Cache-Control", "no-store");
    // Cookie mutations require the existing same-origin CSRF check and a fresh identity.
    context.set("user", await requireUser(context.req.raw, mutation));
    await next();
  };
}
