import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const fixture = vi.hoisted(() => ({ user: vi.fn(), session: vi.fn() }));
vi.mock("@/services/session", () => ({ getUser: fixture.user }));
vi.mock("@/lib/auth/server", () => ({
  getAuth: () => ({ api: { getSession: fixture.session } }),
}));
import { getNativeMinecraftIdentity } from "@/services/minecraft-native";
beforeEach(() => {
  vi.resetAllMocks();
  fixture.user.mockResolvedValue({ id: "local-owner" });
  fixture.session.mockResolvedValue({
    user: { id: "local-owner" },
    session: { id: "native-id", ssoSessionId: "central-session" },
  });
});
it("rejects ordinary browsers even when they have a valid website session", async () => {
  const cases: Record<string, string>[] = [
    { Origin: "https://launcher.test" },
    { Origin: "com.gorth.launcher:/", "Sec-Fetch-Site": "same-origin" },
    {},
  ];
  for (const headers of cases) {
    await expect(
      getNativeMinecraftIdentity(
        new Request("https://launcher.test/minecraft/session", { headers }),
      ),
    ).rejects.toMatchObject({ status: 403 });
  }
  expect(fixture.user).not.toHaveBeenCalled();
  expect(fixture.session).not.toHaveBeenCalled();
});
it("does not treat the native Origin as a credential", async () => {
  fixture.user.mockResolvedValue(null);
  await expect(
    getNativeMinecraftIdentity(
      new Request("https://launcher.test/minecraft/session", {
        headers: { Origin: "com.gorth.launcher:/" },
      }),
    ),
  ).rejects.toMatchObject({ status: 401 });
  expect(fixture.session).not.toHaveBeenCalled();
});
it("requires fresh native Better Auth and matching session ownership", async () => {
  const request = new Request("https://launcher.test/minecraft/session", {
    headers: { Origin: "com.gorth.launcher:/", Cookie: "fixture-only" },
  });
  expect(await getNativeMinecraftIdentity(request)).toMatchObject({
    user: { id: "local-owner" },
    nativeSession: { id: "native-id" },
  });
  expect(fixture.user).toHaveBeenCalledWith(true, request.headers);
  expect(fixture.session).toHaveBeenCalledWith({
    headers: request.headers,
    query: { disableCookieCache: true },
  });
  fixture.session.mockResolvedValue({
    user: { id: "other-owner" },
    session: { ssoSessionId: "central-session" },
  });
  await expect(getNativeMinecraftIdentity(request)).rejects.toMatchObject({
    status: 401,
  });
  fixture.session.mockResolvedValue({
    user: { id: "local-owner" },
    session: {},
  });
  await expect(getNativeMinecraftIdentity(request)).rejects.toMatchObject({
    status: 401,
  });
});
