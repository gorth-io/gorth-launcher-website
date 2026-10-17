import { createServer } from "node:http";
import { once } from "node:events";
import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { getRequestListener } from "@gorth/principle/cores/hono/server";

describe("Hono Node adapter used by Vite and Vercel", () => {
  it("preserves callback URL, redirects, multiple cookies and request bodies", async () => {
    const app = new Hono();
    app.get("/auth/callback/gorth", (context) => {
      context.header(
        "Set-Cookie",
        "gorth.session_token=fixture; HttpOnly; Path=/; SameSite=Lax",
        { append: true },
      );
      context.header(
        "Set-Cookie",
        "gorth.oauth_state=; Max-Age=0; HttpOnly; Path=/; SameSite=Lax",
        { append: true },
      );
      return context.redirect(
        "/account?from=" + context.req.query("state"),
        302,
      );
    });
    app.post("/echo", async (context) =>
      context.json(await context.req.json()),
    );
    const server = createServer(getRequestListener(app.fetch));
    server.listen(0, "127.0.0.1");
    try {
      await once(server, "listening");
      const address = server.address();
      if (!address || typeof address === "string")
        throw new Error("Missing test server address");
      const origin = "http://127.0.0.1:" + address.port;
      const response = await fetch(
        origin + "/auth/callback/gorth?state=fixture",
        { redirect: "manual" },
      );
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe("/account?from=fixture");
      expect(response.headers.getSetCookie()).toHaveLength(2);
      expect(response.headers.getSetCookie().join(";")).toContain("HttpOnly");
      const echo = await fetch(origin + "/echo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixture: true }),
      });
      expect(await echo.json()).toEqual({ fixture: true });
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
