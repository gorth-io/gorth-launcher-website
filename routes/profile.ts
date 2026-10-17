import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "@gorth/structure/cores/zod";
import type { ApiEnv } from "@/utils/interface";
import { requireAuth } from "@/middlewares/auth";
import { RequestError } from "@/lib/http/request";
import {
  getProfile,
  updateProfile,
  listFriends,
  requestFriend,
  changeFriend,
} from "@/controllers/profile";
export function createProfileRoutes() {
  const router = new Hono<ApiEnv>();
  router.onError((error, context) =>
    error instanceof HTTPException
      ? error.getResponse()
      : context.json(
          {
            error:
              error instanceof RequestError
                ? error.message
                : error instanceof z.ZodError
                  ? "Invalid profile input."
                  : "Profile storage is unavailable. Check the dashboard migration.",
          },
          (error instanceof RequestError
            ? error.status
            : error instanceof z.ZodError
              ? 400
              : 503) as ContentfulStatusCode,
          { "Cache-Control": "no-store" },
        ),
  );
  router.get("/", requireAuth(), getProfile);
  router.patch("/", requireAuth(true), updateProfile);
  router.get("/friend", requireAuth(), listFriends);
  router.post("/friend", requireAuth(true), requestFriend);
  router.patch("/friend", requireAuth(true), changeFriend);
  return router;
}
