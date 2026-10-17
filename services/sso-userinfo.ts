import "server-only";
import { createIdentityCache } from "@gorth/structure/modules/auth/server";
import { getAuthConfig } from "@/lib/auth/config";
import { fetcher } from "@/utils/fetcher";

// Only coalesce simultaneous checks for the same credential. Do not cache a
// completed result: sensitive operations must still check SSO directly.
const identity = createIdentityCache<Readonly<Record<string, unknown>>>({
  maxAgeMs: 0,
  capacity: 512,
  async load(accessToken) {
    const { data } = await fetcher<Record<string, unknown>>({
      url: new URL("/auth/oauth2/userinfo", getAuthConfig().ssoOrigin),
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      redirect: "error",
      timeout: 10_000,
    });
    return Object.freeze(data);
  },
});

export async function getSsoUserInfo(accessToken: string) {
  return await identity.get(accessToken, { fresh: true });
}
