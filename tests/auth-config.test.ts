import { beforeEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const valid = {
  appUrl: "http://localhost:5504",
  authUrl: "https://gorth-auth.vercel.app",
  oauthClientId: "website-fixture",
  oauthCookiePrefix: "gorth",
  sessionSecret: "fixture-only-session-secret-at-least-32-bytes",
  databaseUrl:
    "postgresql://fixture:private-password@database.example.test/app",
};

beforeEach(() => {
  vi.resetModules();
});

it("uses the deployed SSO origin and this website's own origin/client", async () => {
  vi.doMock("@/utils/environment", () => ({ ...valid }));
  const { getAuthConfig } = await import("@/lib/auth/config");
  expect(getAuthConfig()).toEqual({
    origin: valid.appUrl,
    ssoOrigin: valid.authUrl,
    clientId: valid.oauthClientId,
    secret: valid.sessionSecret,
  });
});

it("identifies the missing session secret without logging any values", async () => {
  vi.doMock("@/utils/environment", () => ({
    ...valid,
    sessionSecret: undefined,
  }));
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const { getAuthConfig } = await import("@/lib/auth/config");
  expect(getAuthConfig).toThrow("Authentication invalid configuration");
  expect(log).toHaveBeenCalledExactlyOnceWith(
    '[auth/config] {"missingVariables":["SESSION_SECRET"],"invalidVariables":[]}',
  );
  expect(JSON.stringify(log.mock.calls)).not.toContain(valid.databaseUrl);
});

it("requires a local database rather than substituting SSO storage", async () => {
  vi.doMock("@/utils/environment", () => ({
    ...valid,
    databaseUrl: undefined,
  }));
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const { getAuthConfig } = await import("@/lib/auth/config");
  expect(getAuthConfig).toThrow("Authentication invalid configuration");
  expect(log.mock.calls[0][0]).toContain('"DATABASE_URL"');
  expect(JSON.stringify(log.mock.calls)).not.toContain(valid.sessionSecret);
});

it("rejects short secrets instead of generating a fallback", async () => {
  vi.doMock("@/utils/environment", () => ({
    ...valid,
    sessionSecret: "short-private-value",
  }));
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const { getAuthConfig } = await import("@/lib/auth/config");
  expect(getAuthConfig).toThrow("Authentication invalid configuration");
  expect(log).toHaveBeenCalledExactlyOnceWith(
    '[auth/config] {"missingVariables":[],"invalidVariables":["SESSION_SECRET"]}',
  );
});

it.each(["", "not a prefix", "bad;prefix"])(
  "rejects invalid cookie prefix %s",
  async (prefix) => {
    vi.doMock("@/utils/environment", () => ({
      ...valid,
      oauthCookiePrefix: prefix,
    }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { getAuthConfig } = await import("@/lib/auth/config");
    expect(getAuthConfig).toThrow("Authentication invalid configuration");
  },
);

it.each([
  "https://sso.example.test/auth",
  "http://untrusted.example.test",
  "https://name:private-password@sso.example.test",
  "https://sso.example.test/?key=private",
  "not-a-url",
])(
  "rejects invalid SSO origins without printing their values",
  async (authUrl) => {
    vi.doMock("@/utils/environment", () => ({ ...valid, authUrl }));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getAuthConfig } = await import("@/lib/auth/config");
    expect(getAuthConfig).toThrow("Authentication invalid configuration");
    expect(log).toHaveBeenCalledExactlyOnceWith(
      '[auth/config] {"missingVariables":[],"invalidVariables":["VITE_PUBLIC_AUTH_URL"]}',
    );
  },
);
