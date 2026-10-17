import "server-only";
import { oauthCookiePrefix } from "@/utils/environment";
import {
  AuthError,
  assertMutationOrigin,
} from "@gorth/structure/modules/auth/server";
import {
  sessionSecret,
  appUrl,
  authUrl,
  oauthClientId,
  databaseUrl,
} from "@/utils/environment";

export function getAuthConfig() {
  const missingVariables = Object.entries({
    VITE_PUBLIC_APP_URL: appUrl,
    VITE_PUBLIC_AUTH_URL: authUrl,
    VITE_PUBLIC_OAUTH_CLIENT_ID: oauthClientId,
    SESSION_SECRET: sessionSecret,
    DATABASE_URL: databaseUrl,
    OAUTH_COOKIE_PREFIX: oauthCookiePrefix,
  })
    .filter(([, value]) => !value)
    .map(([name]) => name);
  const invalidVariables =
    sessionSecret && Buffer.byteLength(sessionSecret) < 32
      ? ["SESSION_SECRET"]
      : [];
  if (oauthCookiePrefix && !/^[A-Za-z0-9_.-]+$/.test(oauthCookiePrefix))
    invalidVariables.push("OAUTH_COOKIE_PREFIX");
  if (
    !appUrl ||
    !authUrl ||
    !oauthClientId ||
    !sessionSecret ||
    !databaseUrl ||
    !oauthCookiePrefix ||
    invalidVariables.length
  ) {
    console.error(
      "[auth/config] " + JSON.stringify({ missingVariables, invalidVariables }),
    );
    throw new AuthError("invalid_configuration");
  }
  function origin(value: string, variable: string) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      console.error(
        "[auth/config] " +
          JSON.stringify({
            missingVariables: [],
            invalidVariables: [variable],
          }),
      );
      throw new AuthError("invalid_configuration");
    }
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    ) {
      console.error(
        "[auth/config] " +
          JSON.stringify({
            missingVariables: [],
            invalidVariables: [variable],
          }),
      );
      throw new AuthError("invalid_configuration");
    }
    return url.origin;
  }
  return {
    origin: origin(appUrl, "VITE_PUBLIC_APP_URL"),
    ssoOrigin: origin(authUrl, "VITE_PUBLIC_AUTH_URL"),
    clientId: oauthClientId,
    secret: sessionSecret,
  };
}

export function assertSameOrigin(request: Request) {
  const origin = getAuthConfig().origin;
  if (new URL(request.url).origin !== origin)
    throw new Error("Invalid request origin");
  assertMutationOrigin(request.headers, [origin]);
}
