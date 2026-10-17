import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const fixture = vi.hoisted(() => ({ fetcher: vi.fn() }));
vi.mock("@/utils/fetcher", () => ({ fetcher: fixture.fetcher }));
vi.mock("@/lib/auth/config", () => ({
  getAuthConfig: () => ({ ssoOrigin: "https://sso.example.test" }),
}));

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  fixture.fetcher.mockResolvedValue({
    data: { sub: "sso-subject", status: "active" },
  });
});

it("coalesces concurrent SSO checks without caching completed results", async () => {
  let complete!: (value: { data: Record<string, unknown> }) => void;
  fixture.fetcher.mockReturnValueOnce(
    new Promise((resolve) => {
      complete = resolve;
    }),
  );
  const { getSsoUserInfo } = await import("@/services/sso-userinfo");
  const first = getSsoUserInfo("private-access-token");
  const second = getSsoUserInfo("private-access-token");
  await vi.waitFor(() => expect(fixture.fetcher).toHaveBeenCalledTimes(1));
  complete({ data: { sub: "sso-subject", status: "active" } });
  const [one, two] = await Promise.all([first, second]);
  expect(one).toBe(two);
  expect(Object.isFrozen(one)).toBe(true);
  await getSsoUserInfo("private-access-token");
  expect(fixture.fetcher).toHaveBeenCalledTimes(2);
  const input = fixture.fetcher.mock.calls[0][0];
  expect(input.url.href).toBe("https://sso.example.test/auth/oauth2/userinfo");
  expect(input).toMatchObject({
    method: "GET",
    cache: "no-store",
    redirect: "error",
    timeout: 10_000,
    headers: { Authorization: "Bearer private-access-token" },
  });
});

it("never merges identities from different credentials", async () => {
  const { getSsoUserInfo } = await import("@/services/sso-userinfo");
  await Promise.all([
    getSsoUserInfo("access-token-one"),
    getSsoUserInfo("access-token-two"),
  ]);
  expect(fixture.fetcher).toHaveBeenCalledTimes(2);
});

it("fails closed on SSO errors instead of using a previous successful identity", async () => {
  const { getSsoUserInfo } = await import("@/services/sso-userinfo");
  await getSsoUserInfo("private-access-token");
  fixture.fetcher.mockRejectedValueOnce(new Error("SSO unavailable"));
  await expect(getSsoUserInfo("private-access-token")).rejects.toMatchObject({
    code: "unavailable",
  });
  await getSsoUserInfo("private-access-token");
  expect(fixture.fetcher).toHaveBeenCalledTimes(3);
});
