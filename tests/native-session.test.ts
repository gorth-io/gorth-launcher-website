import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/utils/environment", () => ({ oauthCookiePrefix: "gorth" }));
const fixture = vi.hoisted(() => ({
  session: vi.fn(),
  token: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  revoked: vi.fn(),
  fetcher: vi.fn(),
}));
vi.mock("@/lib/auth/server", () => ({
  getAuth: () => ({
    api: { getSession: fixture.session, getAccessToken: fixture.token },
  }),
}));
vi.mock("@/database", () => ({
  getDatabase: () => ({ select: fixture.select, update: fixture.update }),
}));
vi.mock("@/services/sso", () => ({ isSsoSessionRevoked: fixture.revoked }));
vi.mock("@/utils/fetcher", () => ({ fetcher: fixture.fetcher }));
vi.mock("@/lib/auth/config", () => ({
  getAuthConfig: () => ({ ssoOrigin: "https://sso.example.test" }),
}));
import { getUser } from "@/services/session";

const incoming = new Headers({
  Cookie: "gorth.session_token=fixture-native-session",
});
const user = () => ({
  id: "local-id",
  externalUserId: "central-sub",
  status: "active",
  deletedAt: null,
  bannedAt: null,
  banExpires: null,
  syncedAt: new Date(),
  name: "User",
  email: "user@example.test",
  username: null,
  image: null,
});
const native = () => ({
  user: { id: "local-id" },
  session: { id: "native-id", ssoSessionId: "central-sid" },
});
function rows(data: unknown[]) {
  return { from: () => ({ where: () => ({ limit: async () => data }) }) };
}
beforeEach(() => {
  vi.resetAllMocks();
  fixture.session.mockResolvedValue(native());
  fixture.select
    .mockReturnValueOnce(rows([user()]))
    .mockReturnValueOnce(rows([{ id: "account-id" }]))
    .mockReturnValueOnce(rows([user()]));
  fixture.update.mockReturnValue({
    set: () => ({ where: async () => undefined }),
  });
  fixture.revoked.mockResolvedValue(false);
  fixture.token.mockResolvedValue({ accessToken: "private-provider-token" });
  fixture.fetcher.mockResolvedValue({
    data: { sub: "central-sub", status: "active" },
  });
});
it("authenticates a fresh native app session without an OAuth token", async () => {
  expect(await getUser(false, incoming)).toMatchObject({ id: "local-id" });
  expect(fixture.token).not.toHaveBeenCalled();
  expect(fixture.fetcher).not.toHaveBeenCalled();
  expect(fixture.session).toHaveBeenCalledWith({
    headers: incoming,
    query: { disableCookieCache: true },
  });
});
it("does not initialize auth or query the database without this app's native cookie", async () => {
  for (const cookie of ["", "unrelated=value", "other.session_token=fixture"]) {
    expect(await getUser(false, new Headers({ Cookie: cookie }))).toBeNull();
  }
  expect(fixture.session).not.toHaveBeenCalled();
  expect(fixture.select).not.toHaveBeenCalled();
});
it("rejects absent sessions and sessions without a central binding", async () => {
  fixture.session.mockResolvedValue(null);
  expect(await getUser(false, incoming)).toBeNull();
  fixture.session.mockResolvedValue({
    ...native(),
    session: { id: "unbound" },
  });
  expect(await getUser(false, incoming)).toBeNull();
  expect(fixture.token).not.toHaveBeenCalled();
});
it("checks SSO for sensitive operations using native token refresh", async () => {
  expect(await getUser(true, incoming)).toMatchObject({ id: "local-id" });
  expect(fixture.token).toHaveBeenCalledWith({
    headers: incoming,
    body: { accountId: "account-id" },
  });
  expect(fixture.session).toHaveBeenCalledTimes(2);
  expect(fixture.revoked).toHaveBeenCalledTimes(2);
});
it("fences logout racing a successful SSO check", async () => {
  fixture.session.mockResolvedValueOnce(native()).mockResolvedValueOnce(null);
  expect(await getUser(true, incoming)).toBeNull();
});
it("fences a backchannel revocation racing a successful SSO check", async () => {
  fixture.revoked.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  expect(await getUser(true, incoming)).toBeNull();
});
it("rejects another SSO subject and never exposes provider credentials", async () => {
  fixture.fetcher.mockResolvedValue({
    data: { sub: "different-subject", status: "active" },
  });
  expect(await getUser(true, incoming)).toBeNull();
  expect(fixture.session).toHaveBeenCalledTimes(1);
});
