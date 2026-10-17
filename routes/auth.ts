import "server-only";
import { Hono } from "hono";
import { getAuth } from "@/lib/auth/server";
import { backchannelLogout } from "@/controllers/auth";
import type { ApiEnv } from "@/utils/interface";

export function createAuthRoutes() {
  const routes = new Hono<ApiEnv>();
  routes.post("/backchannel-logout", backchannelLogout);
  // Raw Web Request/Response preserves Better Auth's body and Set-Cookie handling.
  routes.on(["GET", "POST"], "/*", (context) =>
    getAuth().handler(context.req.raw),
  );
  return routes;
}
