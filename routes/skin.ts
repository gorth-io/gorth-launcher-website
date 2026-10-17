import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "@gorth/structure/cores/zod";
import type { ApiEnv } from "@/utils/interface";
import { RequestError } from "@/lib/http/request";
import { requireAuth } from "@/middlewares/auth";
import {
  listSkins,
  saveSkin,
  deleteSkin,
  getActiveSkin,
  activateSkin,
  getSkin,
} from "@/controllers/skin";

export function createSkinRoutes() {
  const router = new Hono<ApiEnv>();
  router.onError((error, context) => {
    if (error instanceof HTTPException) return error.getResponse();
    const status =
      error instanceof RequestError
        ? (error.status as ContentfulStatusCode)
        : error instanceof z.ZodError
          ? 400
          : 503;
    return context.json(
      {
        error:
          error instanceof RequestError
            ? error.message
            : status === 400
              ? "Invalid skin request."
              : "Skin storage is unavailable.",
      },
      status,
      { "Cache-Control": "no-store" },
    );
  });
  router.get("/", requireAuth(), listSkins);
  router.post("/", requireAuth(true), saveSkin);
  router.delete("/", requireAuth(true), deleteSkin);
  router.get("/active", requireAuth(), getActiveSkin);
  router.post("/active", requireAuth(true), activateSkin);
  router.get("/file", requireAuth(), getSkin);
  return router;
}
