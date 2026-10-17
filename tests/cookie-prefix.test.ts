import { randomBytes } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
import { betterAuth } from "better-auth";
import { getSessionCookie } from "better-auth/cookies";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("uses OAUTH_COOKIE_PREFIX for native cookie issuance and reading", async () => {
  vi.stubEnv("OAUTH_COOKIE_PREFIX", "fixture-prefix");
  vi.resetModules();
  const { oauthCookiePrefix } = await import("@/utils/environment");
  expect(oauthCookiePrefix).toBe("fixture-prefix");
  const origin = "https://prefix.example.test";
  const auth = betterAuth({
    baseURL: origin,
    basePath: "/auth",
    secret: randomBytes(48).toString("base64url"),
    logger: { disabled: true },
    rateLimit: { enabled: false },
    advanced: { cookiePrefix: oauthCookiePrefix },
    emailAndPassword: { enabled: true },
    session: { cookieCache: { enabled: true, maxAge: 120 } },
  });
  const response = await auth.handler(
    new Request(origin + "/auth/sign-up/email", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Fixture",
        email: "prefix@example.test",
        password: "fixture-password-long-enough",
      }),
    }),
  );
  expect(response.status).toBe(200);
  const setCookies = response.headers.getSetCookie();
  expect(
    setCookies.some(
      (cookie) =>
        cookie.startsWith("__Secure-fixture-prefix.session_token=") ||
        cookie.startsWith("fixture-prefix.session_token="),
    ),
  ).toBe(true);
  expect(
    setCookies.some((cookie) =>
      cookie.includes("fixture-prefix.session_data="),
    ),
  ).toBe(true);
  const incoming = new Headers({
    Cookie: setCookies.map((cookie) => cookie.split(";")[0]).join("; "),
  });
  expect(
    getSessionCookie(incoming, { cookiePrefix: oauthCookiePrefix }),
  ).toBeTruthy();
  expect(
    getSessionCookie(incoming, { cookiePrefix: "wrong-prefix" }),
  ).toBeNull();
  expect((await auth.api.getSession({ headers: incoming }))?.user.email).toBe(
    "prefix@example.test",
  );
});
