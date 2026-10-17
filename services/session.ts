import "server-only";
import { getSessionCookie } from "better-auth/cookies";
import { oauthCookiePrefix } from "@/utils/environment";
import { and, eq } from "drizzle-orm";
import { createAuthPolicy } from "@gorth/structure/modules/auth/server";
import { getAuth } from "@/lib/auth/server";
import { getDatabase } from "@/database";
import { userTable, accountTable } from "@/database/auth";
import { isSsoSessionRevoked } from "@/services/sso";
import { getSsoUserInfo } from "@/services/sso-userinfo";
import type { AuthUser } from "@/utils/interface";

const authPolicy = createAuthPolicy();

// Authorization uses the native session and a DB-backed local policy check.
// No fetch to our own app, no custom session token or OAuth refresh engine.
export async function getUser(
  fresh: boolean,
  requestHeaders: Headers,
): Promise<AuthUser | null> {
  const incoming = requestHeaders;
  if (!getSessionCookie(incoming, { cookiePrefix: oauthCookiePrefix }))
    return null;
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: incoming,
    query: { disableCookieCache: true },
  });
  if (!session || !session.session.ssoSessionId) return null;
  const [user] = await getDatabase()
    .select()
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1);
  if (
    !user ||
    user.status !== "active" ||
    user.deletedAt ||
    (user.bannedAt && (!user.banExpires || user.banExpires > new Date()))
  )
    return null;
  if (
    await isSsoSessionRevoked(
      user.externalUserId,
      session.session.ssoSessionId ?? null,
    )
  )
    return null;
  if (
    fresh ||
    user.syncedAt.getTime() <= Date.now() - authPolicy.identityMaxAgeMs
  ) {
    // Live checks for sensitive writes and missed logout events. Better Auth
    // owns access-token refresh; this is application authorization policy.
    const [account] = await getDatabase()
      .select({ id: accountTable.id })
      .from(accountTable)
      .where(
        and(
          eq(accountTable.userId, user.id),
          eq(accountTable.providerId, "gorth"),
        ),
      )
      .limit(1);
    if (!account) return null;
    const tokens = await auth.api.getAccessToken({
      headers: incoming,
      body: { accountId: account.id },
    });
    const profile = await getSsoUserInfo(tokens.accessToken);
    if (
      profile.sub !== user.externalUserId ||
      (profile.status && profile.status !== "active")
    )
      return null;
    await getDatabase()
      .update(userTable)
      .set({ syncedAt: new Date() })
      .where(eq(userTable.id, user.id));
    // A provider request can race app logout or a backchannel revocation.
    // Re-read the authoritative native session before granting access.
    const current = await auth.api.getSession({
      headers: incoming,
      query: { disableCookieCache: true },
    });
    if (
      !current ||
      current.session.id !== session.session.id ||
      current.user.id !== user.id ||
      current.session.ssoSessionId !== session.session.ssoSessionId ||
      (await isSsoSessionRevoked(
        user.externalUserId,
        session.session.ssoSessionId,
      ))
    )
      return null;
    const [currentUser] = await getDatabase()
      .select()
      .from(userTable)
      .where(eq(userTable.id, user.id))
      .limit(1);
    if (
      !currentUser ||
      currentUser.status !== "active" ||
      currentUser.deletedAt ||
      (currentUser.bannedAt &&
        (!currentUser.banExpires || currentUser.banExpires > new Date()))
    )
      return null;
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    image: user.image,
  };
}
