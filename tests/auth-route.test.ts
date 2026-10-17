import { beforeEach, expect, it, vi } from "vitest";
import { AuthError } from "@gorth/structure/modules/auth/server";

vi.mock("server-only", () => ({}));
const fixture = vi.hoisted(() => ({ getAuth: vi.fn() }));
vi.mock("@/lib/auth/server", () => ({ getAuth: fixture.getAuth }));
vi.mock("@/controllers/auth", () => ({
  backchannelLogout: () => new Response(null, { status: 200 }),
}));
vi.mock("@/routes/skin", () => ({ createSkinRoutes: () => new Hono() }));
import { Hono } from "hono";

import { createApi } from "@/app/api";

beforeEach(() => {
  vi.resetAllMocks();
});

it.each(["get-session", "sign-in/social"])(
  "reports missing auth config as unavailable for %s",
  async (path) => {
    fixture.getAuth.mockImplementation(() => {
      throw new AuthError("invalid_configuration");
    });
    const api = createApi();
    const response = await api.request("http://localhost:5504/auth/" + path, {
      method: path === "get-session" ? "GET" : "POST",
    });
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
  },
);

it("preserves native Better Auth status, redirects and all cookies", async () => {
  const headers = new Headers({ Location: "/account" });
  headers.append("Set-Cookie", "first=fixture; HttpOnly; Path=/");
  headers.append("Set-Cookie", "second=fixture; HttpOnly; Path=/");
  const handler = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 302, headers }));
  fixture.getAuth.mockReturnValue({ handler });
  const request = new Request(
    "http://localhost:5504/auth/callback/gorth?state=fixture",
  );
  const response = await createApi().fetch(request);
  expect(handler).toHaveBeenCalledWith(request);
  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe("/account");
  expect(response.headers.getSetCookie()).toHaveLength(2);
});
