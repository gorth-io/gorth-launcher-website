import { createHash, randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { betterAuth } from "better-auth";
import { electron } from "@better-auth/electron";
import { electronClientId, electronScheme } from "@/lib/auth/contract";
import {
  exportJWK,
  generateKeyPair,
  SignJWT,
} from "@gorth/structure/cores/jose";
import { gorthProvider, validateGorthUser } from "@/lib/auth/provider";

const app = "http://localhost:5504";
const sso = "http://localhost:3000";
const issuer = sso + "/auth";
const clientId = "gorth-test-website";
let auth: ReturnType<typeof fixture>;
let nonce = "";
let subject = "sso-sub-first";
let badNonce = false;
let tamperSignature = false;
let tokenCalls = 0;
let fixedEmail: string | undefined;
let cookies: Map<string, string>;
let key: Awaited<ReturnType<typeof generateKeyPair>>;

function fixture() {
  return betterAuth({
    baseURL: app,
    basePath: "/auth",
    secret: randomBytes(48).toString("base64url"),
    trustedOrigins: [app, `${electronScheme}:/`],
    logger: { disabled: true },
    rateLimit: { enabled: false },
    advanced: {
      disableOriginCheck: false,
      disableCSRFCheck: false,
      cookiePrefix: "gorth",
    },
    plugins: [
      gorthProvider(sso, clientId),
      electron({
        clientID: electronClientId,
        cookiePrefix: "gorth",
        codeExpiresIn: 120,
      }),
    ],
    disabledPaths: [
      "/update-user",
      "/sign-up/email",
      "/sign-in/email",
      "/get-access-token",
      "/refresh-token",
      "/account-info",
    ],
    emailAndPassword: { enabled: false },
    account: { encryptOAuthTokens: true, accountLinking: { enabled: false } },
    user: {
      validateUserInfo: validateGorthUser,
      additionalFields: {
        externalUserId: { type: "string", required: true },
        username: { type: "string", required: false },
        ssoStatus: { type: "string", required: false },
      },
    },
    session: { cookieCache: { enabled: true, maxAge: 120 } },
  });
}

function accept(response: Response) {
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(";");
    const separator = pair.indexOf("=");
    const name = pair.slice(0, separator),
      value = pair.slice(separator + 1);
    if (!value || /max-age=0(?:;|$)/i.test(cookie)) cookies.delete(name);
    else cookies.set(name, value);
  }
  return response;
}
async function request(path: string, body?: object, origin = app) {
  return accept(
    await auth.handler(
      new Request(app + "/auth/" + path, {
        method: body ? "POST" : "GET",
        headers: {
          Origin: origin,
          "Content-Type": "application/json",
          Cookie: [...cookies].map(([k, v]) => k + "=" + v).join("; "),
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
    ),
  );
}
async function start() {
  const response = await request("sign-in/social", {
    provider: "gorth",
    callbackURL: "/account",
    errorCallbackURL: "/auth/error",
  });
  expect(response.status).toBe(200);
  const url = new URL((await response.json()).url);
  nonce = url.searchParams.get("nonce")!;
  return url;
}
async function finish(url: URL) {
  return request(
    "callback/gorth?" +
      new URLSearchParams({
        state: url.searchParams.get("state")!,
        code: "fixture-auth-code",
        iss: issuer,
      }),
  );
}
async function current() {
  return (await request("get-session?disableCookieCache=true")).json();
}

beforeEach(async () => {
  cookies = new Map();
  subject = "sso-sub-first";
  badNonce = false;
  fixedEmail = undefined;
  tamperSignature = false;
  tokenCalls = 0;
  key = await generateKeyPair("RS256");
  const jwk = {
    ...(await exportJWK(key.publicKey)),
    kid: "test-key",
    alg: "RS256",
    use: "sig",
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request | string | URL, init?: RequestInit) => {
      const url = new URL(
        input instanceof Request ? input.url : input.toString(),
      );
      if (url.href === issuer + "/.well-known/openid-configuration")
        return Response.json({
          issuer,
          authorization_endpoint: issuer + "/oauth2/authorize",
          token_endpoint: issuer + "/oauth2/token",
          userinfo_endpoint: issuer + "/oauth2/userinfo",
          end_session_endpoint: issuer + "/oauth2/end-session",
          jwks_uri: issuer + "/jwks",
          id_token_signing_alg_values_supported: ["RS256"],
        });
      if (url.href === issuer + "/jwks") return Response.json({ keys: [jwk] });
      if (url.href === issuer + "/oauth2/token") {
        tokenCalls++;
        const body = new URLSearchParams(
          input instanceof Request ? await input.text() : String(init?.body),
        );
        expect(body.get("client_id")).toBe(clientId);
        expect(body.get("code_verifier")).toBeTruthy();
        expect(body.get("client_secret")).toBeNull();
        let idToken = await new SignJWT({
          nonce: badNonce ? "wrong-nonce" : nonce,
          sid: "central-session-" + subject,
          email: fixedEmail ?? subject + "@example.test",
          email_verified: true,
          name: "Fixture",
          preferred_username: "fixture-user",
          status: "active",
        })
          .setProtectedHeader({ alg: "RS256", kid: "test-key" })
          .setIssuer(issuer)
          .setAudience(clientId)
          .setSubject(subject)
          .setIssuedAt()
          .setExpirationTime("10m")
          .sign(key.privateKey);
        if (tamperSignature) idToken = idToken.slice(0, -8) + "AAAAAAAA";
        return Response.json({
          access_token: "fixture-access",
          refresh_token: "fixture-refresh",
          token_type: "Bearer",
          expires_in: 600,
          id_token: idToken,
        });
      }
      throw new Error("Unexpected network request: " + url.pathname);
    }),
  );
  auth = fixture();
  await auth.$context;
});
afterEach(() => vi.unstubAllGlobals());

describe("native Gorth Generic OAuth", () => {
  it("rejects provisioning from a non-OAuth source, even if credential signup were enabled later", async () => {
    const result = await validateGorthUser(
      {
        user: { externalUserId: "forged", email: "fake@example.test" },
        source: { action: "create-user", method: "email-password" },
      },
      {} as never,
    );
    expect(result).toEqual({ error: "invalid_identity_source" });
  });
  it("rejects a mapped identity that does not match the verified provider sub", async () => {
    const result = await validateGorthUser(
      {
        user: { externalUserId: "forged", email: "fake@example.test" },
        source: {
          action: "create-user",
          method: "oauth",
          oauth: { providerId: "gorth", profile: { sub: "actual-sub" } },
        },
      },
      {} as never,
    );
    expect(result).toEqual({ error: "invalid_identity_source" });
  });
  it("never merges different SSO subjects on a matching email", async () => {
    fixedEmail = "same@example.test";
    await finish(await start());
    const previous = await current();
    expect(previous.user.externalUserId).toBe("sso-sub-first");
    await request("sign-out", {});
    subject = "different-sso-sub";
    const response = await finish(await start());
    expect(response.headers.get("location")).toContain("error=");
    expect(await current()).toBeNull();
  });
  it("does not expose HTTP identity writers", async () => {
    expect(
      (
        await request("sign-up/email", {
          externalUserId: "forged",
          ssoStatus: "active",
        })
      ).status,
    ).toBe(404);
    await finish(await start());
    expect(
      (
        await request("update-user", {
          externalUserId: "forged",
          ssoStatus: "active",
        })
      ).status,
    ).toBe(404);
    expect((await current()).user.externalUserId).toBe(subject);
  });
  it("always requests account selection, PKCE and nonce with the native callback", async () => {
    const url = await start();
    expect(url.searchParams.get("prompt")).toBe("select_account");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
    expect(url.searchParams.get("nonce")).toBeTruthy();
    expect(url.searchParams.get("redirect_uri")).toBe(
      app + "/auth/callback/gorth",
    );
    const response = await finish(url);
    expect(new URL(response.headers.get("location")!, app).href).toBe(
      app + "/account",
    );
    const session = await current();
    expect(session.user.externalUserId).toBe(subject);
    expect(session.user.emailVerified).toBe(true);
    expect(session.user.username).toBe("fixture-user");
    expect(JSON.stringify(session)).not.toContain("fixture-access");
    const stored = await (
      await auth.$context
    ).internalAdapter.findAccounts(session.user.id);
    expect(stored[0].accessToken).not.toBe("fixture-access");
    expect(stored[0].refreshToken).not.toBe("fixture-refresh");
    expect(
      (await request("get-access-token", { accountId: stored[0].id })).status,
    ).toBe(404);
    expect([...cookies.keys()]).toContain("gorth.session_token");
    expect(
      [...cookies.keys()].some((name) => name.includes("access_token")),
    ).toBe(false);
  });
  it("signs out locally, never invokes provider end-session, and can select another account", async () => {
    await finish(await start());
    expect((await current()).user.externalUserId).toBe(subject);
    const logout = await request("sign-out", {});
    expect(logout.status).toBe(200);
    expect(logout.headers.get("location")).toBeNull();
    expect((await logout.json()).url).toBeUndefined();
    expect(await current()).toBeNull();
    subject = "sso-sub-second";
    const url = await start();
    expect(url.searchParams.get("prompt")).toBe("select_account");
    await finish(url);
    expect((await current()).user.externalUserId).toBe(subject);
  });
  it("rejects a callback with unknown state before exchanging tokens", async () => {
    const url = await start();
    url.searchParams.set("state", "wrong-state");
    const response = await finish(url);
    expect(response.headers.get("location")).toContain("error=");
    expect(tokenCalls).toBe(0);
    expect(await current()).toBeNull();
  });
  it("rejects an ID token with the wrong nonce", async () => {
    badNonce = true;
    const response = await finish(await start());
    expect(response.headers.get("location")).toContain("error=");
    expect(await current()).toBeNull();
  });
  it("rejects a forged ID-token signature", async () => {
    tamperSignature = true;
    const response = await finish(await start());
    expect(response.headers.get("location")).toContain("error=");
    expect(await current()).toBeNull();
  });
  it("rejects cross-origin sign-out without ending the local session", async () => {
    await finish(await start());
    expect((await request("sign-out", {}, "https://evil.test")).status).toBe(
      403,
    );
    expect((await current()).user.externalUserId).toBe(subject);
  });
});

it("completes desktop Generic OAuth with official PKCE transfer and keeps web/SSO sessions on desktop logout", async () => {
  const verifier = randomBytes(32).toString("base64url");
  const nativeState = randomBytes(16).toString("base64url");
  const query = new URLSearchParams({
    client_id: electronClientId,
    state: nativeState,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
  });
  const startResponse = await request("sign-in/social?" + query, {
    provider: "gorth",
    callbackURL: "/auth/desktop/complete",
  });
  expect(startResponse.status).toBe(200);
  const authorize = new URL((await startResponse.json()).url);
  nonce = authorize.searchParams.get("nonce")!;
  expect(authorize.searchParams.get("prompt")).toBe("select_account");
  const response = await finish(authorize);
  expect(response.headers.get("location")).toContain("/auth/desktop/complete");
  const redirect = cookies.get("gorth." + electronClientId);
  expect(redirect).toBeTruthy();
  const payload = JSON.parse(
    Buffer.from(decodeURIComponent(redirect!), "base64url").toString(),
  );
  expect(payload.state).toBe(nativeState);
  const body = {
    token: payload.identifier,
    state: nativeState,
    code_verifier: verifier,
  };
  const nativeResponse = await auth.handler(
    new Request(app + "/auth/electron/token", {
      method: "POST",
      headers: {
        Origin: electronScheme + ":/",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
  expect(nativeResponse.status).toBe(200);
  const nativeCookie = nativeResponse.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  expect(nativeCookie).toContain("session_token");
  const nativeUser = await nativeResponse.json();
  expect(nativeUser.user.externalUserId).toBe(subject);
  const replay = await auth.handler(
    new Request(app + "/auth/electron/token", {
      method: "POST",
      headers: {
        Origin: electronScheme + ":/",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
  expect(replay.status).toBe(404);
  const signOut = await auth.handler(
    new Request(app + "/auth/sign-out", {
      method: "POST",
      headers: {
        Origin: electronScheme + ":/",
        "Content-Type": "application/json",
        Cookie: nativeCookie,
      },
      body: "{}",
    }),
  );
  expect(signOut.status).toBe(200);
  expect((await current()).user.externalUserId).toBe(subject);
});
