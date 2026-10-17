import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const fixture = vi.hoisted(() => ({
  native: vi.fn(),
  issue: vi.fn(),
  profile: vi.fn(),
  refresh: vi.fn(),
  valid: vi.fn(),
  invalidate: vi.fn(),
  join: vi.fn(),
  hasJoined: vi.fn(),
  texture: vi.fn(),
  lookup: vi.fn(),
}));
vi.mock("@/lib/auth/config", () => ({
  getAuthConfig: () => ({ origin: "https://launcher.test" }),
}));
vi.mock("@/lib/minecraft/keys", () => ({
  minecraftPublicKey: () => "fixture-public-key",
}));
vi.mock("@/services/minecraft-native", () => ({
  getNativeMinecraftIdentity: fixture.native,
}));
vi.mock("@/services/minecraft-store", () => ({
  getMinecraftProfile: fixture.profile,
  issueGameSession: fixture.issue,
  refreshGameSession: fixture.refresh,
  getValidGameSession: fixture.valid,
  invalidateGameSession: fixture.invalidate,
  joinMinecraft: fixture.join,
  hasJoinedMinecraft: fixture.hasJoined,
  getSignedMinecraftProfile: fixture.profile,
  getMinecraftTexture: fixture.texture,
  lookupMinecraftProfiles: fixture.lookup,
}));
// readJson does not need to initialize Better Auth; the real native boundary has its own tests.
vi.mock("@/services/session", () => ({ getUser: vi.fn() }));
import { RequestError } from "@/lib/http/request";
import { createMinecraftRoutes } from "@/routes/minecraft";
const router = createMinecraftRoutes();
function post(path: string, body: unknown) {
  return router.request("http://localhost" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  fixture.native.mockResolvedValue({
    user: { id: "owner" },
    nativeSession: { id: "parent" },
  });
  fixture.issue.mockResolvedValue({ accessToken: "a".repeat(43) });
});
it("never issues game credentials if native authentication fails", async () => {
  fixture.native.mockRejectedValue(new RequestError(403, "Native only"));
  const response = await post("/session", { clientToken: "client" });
  expect(response.status).toBe(403);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(fixture.issue).not.toHaveBeenCalled();
});
it("binds issuance to server-authenticated user/session, ignoring forged body ownership", async () => {
  const response = await post("/session", {
    clientToken: "client",
    userId: "attacker",
    nativeSessionId: "forged",
  });
  expect(response.status).toBe(200);
  expect(fixture.issue).toHaveBeenCalledWith("owner", "parent", "client");
});
it("does not expose a password login and rejects malformed tokens", async () => {
  expect(
    (
      await post("/authserver/authenticate", {
        username: "User",
        password: "never-used",
      })
    ).status,
  ).toBe(403);
  expect(
    (await post("/authserver/validate", { accessToken: "invalid" })).status,
  ).toBe(400);
  expect(fixture.valid).not.toHaveBeenCalled();
  expect(
    (await post("/authserver/validate", { accessToken: "a".repeat(43) }))
      .status,
  ).toBe(204);
});
it("returns standard join statuses without caching private responses", async () => {
  expect(
    (
      await post("/sessionserver/session/minecraft/join", {
        accessToken: "a".repeat(43),
        selectedProfile: "b".repeat(32),
        serverId: "-123abc",
      })
    ).status,
  ).toBe(204);
  fixture.hasJoined.mockResolvedValue(null);
  const response = await router.request(
    "http://localhost/sessionserver/session/minecraft/hasJoined?username=Player&serverId=123",
  );
  expect(response.status).toBe(204);
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it("serves only bounded checksum PNG paths, not arbitrary URLs or files", async () => {
  fixture.texture.mockResolvedValue(Buffer.from([137, 80, 78, 71]));
  const response = await router.request(
    "http://localhost/texture/" + "a".repeat(64),
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/png");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(
    (await router.request("http://localhost/texture/not-a-checksum")).status,
  ).toBe(404);
  expect(fixture.texture).toHaveBeenCalledTimes(1);
});
it("does not expose database or signing-key internals on failures", async () => {
  fixture.issue.mockRejectedValue(new Error("private database URL or key"));
  const response = await post("/session", { clientToken: "client" });
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("private database");
});
