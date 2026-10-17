import "server-only";
import { getDownloads } from "@/services/download";
import { appUrl, releaseVersion } from "@/utils/environment";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { configureHono } from "@gorth/principle/configs/hono";
import { AuthError } from "@gorth/structure/modules/auth/server";
import type { ApiEnv } from "@/utils/interface";
import { createAuthRoutes } from "@/routes/auth";
import { createSkinRoutes } from "@/routes/skin";
import { createProfileRoutes } from "@/routes/profile";
import { createMinecraftRoutes } from "@/routes/minecraft";

export function createApi() {
  const api = new Hono<ApiEnv>();
  configureHono(api, {
    logger: false, // OAuth callback query strings must never reach logs.
    timing: false,
    cors: false, // The API stays same-origin.
    // Existing origin checks protect every cookie mutation; the backchannel
    // instead verifies a signed logout token. Do not apply browser CSRF to it.
    csrf: false,
    // Existing bounded stream readers and explicit response headers remain authoritative.
    bodyLimit: false,
    secureHeaders: false,
    timeout: false,
    onError: (error, context) =>
      error instanceof HTTPException
        ? error.getResponse()
        : error instanceof AuthError && error.code === "invalid_configuration"
          ? context.json({ error: "auth_unavailable" }, 503, {
              "Cache-Control": "no-store",
            })
          : context.json({ error: "Internal Server Error" }, 500, {
              "Cache-Control": "no-store",
            }),
  });
  api.use("*", async (context, next) => {
    context.header("X-Content-Type-Options", "nosniff");
    context.header(
      "Referrer-Policy",
      context.req.path.startsWith("/auth") ? "no-referrer" : "same-origin",
    );
    await next();
  });
  api.get("/health", (context) => context.json({ status: "ok" }));
  api.get("/download/catalog", (context) =>
    context.json({ version: releaseVersion || null, items: getDownloads() }),
  );
  api.get("/robots.txt", (context) => {
    const origin = appUrl || new URL(context.req.url).origin;
    return context.text(
      "User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /auth/\nDisallow: /sync\nDisallow: /profile\nDisallow: /skin\nDisallow: /minecraft/me\nDisallow: /minecraft/session\nSitemap: " +
        new URL("/sitemap.xml", origin).href +
        "\n",
    );
  });
  api.get("/sitemap.xml", (context) => {
    const origin = appUrl || new URL(context.req.url).origin;
    const escape = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    context.header("Content-Type", "application/xml; charset=utf-8");
    return context.body(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
        ["/", "/download"]
          .map(
            (url) =>
              "<url><loc>" + escape(new URL(url, origin).href) + "</loc></url>",
          )
          .join("") +
        "</urlset>",
    );
  });
  // The catch-all exports all verbs; retain the API's 405/Allow and automatic
  // OPTIONS behavior rather than treating a known path as a missing endpoint.
  api.use("*", async (context, next) => {
    const methods = new Set(
      api.routes
        .filter(
          (route) => route.path === context.req.path && route.method !== "ALL",
        )
        .map((route) => route.method),
    );
    if (methods.size) {
      if (methods.has("GET")) methods.add("HEAD");
      methods.add("OPTIONS");
      const allow = [...methods].sort().join(", ");
      if (context.req.method === "OPTIONS")
        return context.body(null, 204, { Allow: allow });
      if (!methods.has(context.req.method))
        return context.body(null, 405, { Allow: allow });
    }
    await next();
  });
  api.route("/auth", createAuthRoutes());
  api.route("/skin", createSkinRoutes());
  api.route("/profile", createProfileRoutes());
  api.route("/minecraft", createMinecraftRoutes());
  return api;
}
