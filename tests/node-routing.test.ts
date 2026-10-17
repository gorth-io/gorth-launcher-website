import { createServer } from "node:http";
import { once } from "node:events";
import { expect, it, vi } from "vitest";
import { getRequestListener } from "@gorth/principle/cores/hono/server";
import { authPagePaths } from "@/app/routing";

vi.mock("@/app/server", () => ({
  default: {
    fetch: async (request: Request) =>
      new Response("API " + new URL(request.url).pathname, {
        status: 201,
        headers: { "Content-Type": "text/plain" },
      }),
  },
}));
import { createNodeApp } from "@/app/node-app";

it("keeps React auth screens outside the API auth catch-all in production Node", async () => {
  const app = createNodeApp({
    staticRoot: "tests/fixtures",
    indexHtml: "tests/fixtures/index.html",
  });
  // Exercise static streams through the same HTTP adapter as production.
  const server = createServer(getRequestListener(app.fetch));
  server.listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing fixture address");
    const origin = "http://127.0.0.1:" + address.port;
    for (const path of ["/", "/account", ...authPagePaths]) {
      const response = await fetch(origin + path + "?fixture=true");
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/html");
      expect(await response.text()).toContain("React website fixture");
    }
    const callback = await fetch(origin + "/auth/callback/gorth?state=fixture");
    expect(callback.status).toBe(201);
    expect(await callback.text()).toBe("API /auth/callback/gorth");
    expect((await fetch(origin + "/assets/missing.js")).status).toBe(404);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
