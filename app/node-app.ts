import { Hono } from "hono";
import { configureHono } from "@gorth/principle/configs/hono";
import { serveStatic } from "@gorth/principle/cores/hono/server";
import api from "@/app/server";
import { isBackendPath } from "@/app/routing";

export function createNodeApp({
  staticRoot = "dist/client",
  indexHtml = "dist/client/public/index.html",
} = {}) {
  const app = new Hono();
  configureHono(app, {
    logger: false,
    timing: false,
    cors: false,
    csrf: false,
    bodyLimit: false,
    secureHeaders: false,
    timeout: false,
    onError: (_error, context) =>
      context.json({ error: "Internal Server Error" }, 500),
  });
  app.use("*", async (context, next) => {
    const path = context.req.path;
    const privatePage = ["/account", "/group", "/workspace"].some(
      (prefix) => path === prefix || path.startsWith(prefix + "/"),
    );
    context.header("X-Content-Type-Options", "nosniff");
    context.header(
      "Referrer-Policy",
      path.startsWith("/auth") ? "no-referrer" : "same-origin",
    );
    if (path.startsWith("/auth") || privatePage)
      context.header("Cache-Control", "no-store");
    if (privatePage) context.header("X-Robots-Tag", "noindex, nofollow");
    // Dispatch before mounting the API: its /auth/* catch-all must not consume
    // /auth/desktop or the other explicitly listed React auth screens.
    if (isBackendPath(path)) return api.fetch(context.req.raw);
    await next();
  });
  app.use("*", serveStatic({ root: staticRoot }));
  app.get("*", async (context, next) => {
    if (context.req.path.startsWith("/assets/"))
      return context.json({ error: "Not Found" }, 404);
    context.header("Cache-Control", "no-store");
    const response = await serveStatic({ path: indexHtml })(context, next);
    return response || context.res;
  });
  return app;
}
