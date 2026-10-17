import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { createRemoteJWKSet } from "@gorth/structure/cores/jose";
import {
  AuthError,
  createLogoutVerifier,
  type VerifiedLogout,
} from "@gorth/structure/modules/auth/server";
import { getAuthConfig } from "@/lib/auth/config";
import { getDatabase } from "@/database";
import { revocationTable, sessionTable, userTable } from "@/database/auth";

export { AuthError };
let verifier: ReturnType<typeof createLogoutVerifier> | undefined;
export async function verifyLogoutToken(token: string) {
  if (!verifier) {
    const config = getAuthConfig();
    const keys = createRemoteJWKSet(new URL("/auth/jwks", config.ssoOrigin));
    verifier = createLogoutVerifier({
      issuer: new URL("/auth", config.ssoOrigin).href,
      clientId: config.clientId,
      requireSid: false,
      getVerificationKey: async () => keys,
      storage: {
        apply: endSsoSessions,
        isRevoked: async ({ subject, sid }) =>
          isSsoSessionRevoked(subject, sid ?? null),
      },
    });
  }
  return verifier.verify(token);
}

// Generic OAuth has no RP backchannel endpoint. This thin event adapter retains
// SSO-driven invalidation; native sessions still belong to Better Auth.
export async function endSsoSessions(logout: VerifiedLogout) {
  // Fail closed even if an internal caller bypasses the token verifier.
  if (!logout.sid && !logout.subject) throw new AuthError("rejected");
  const subject = logout.subject
    ? sql`${sessionTable.userId} IN
    (SELECT ${userTable.id} FROM ${userTable} WHERE ${userTable.externalUserId} = ${logout.subject})`
    : undefined;
  const filter = logout.sid
    ? and(eq(sessionTable.ssoSessionId, logout.sid), subject)
    : subject;
  if (!filter) throw new AuthError("rejected");
  return getDatabase().transaction(async (transaction) => {
    const receipt = await transaction
      .insert(revocationTable)
      .values({
        jti: logout.jti,
        sid: logout.sid ?? null,
        subject: logout.subject ?? null,
        expiresAt: new Date(logout.revokeUntil),
      })
      .onConflictDoNothing()
      .returning({ id: revocationTable.jti });
    if (!receipt.length) return false;
    await transaction.delete(sessionTable).where(filter);
    return true;
  });
}

export async function isSsoSessionRevoked(subject: string, sid: string | null) {
  const [receipt] = await getDatabase()
    .select({ id: revocationTable.jti })
    .from(revocationTable)
    .where(
      sql`
    ${revocationTable.expiresAt} > NOW() AND (
      (${revocationTable.sid} = ${sid} AND (${revocationTable.subject} IS NULL OR ${revocationTable.subject} = ${subject}))
      OR (${revocationTable.sid} IS NULL AND ${revocationTable.subject} = ${subject})
    )`,
    )
    .limit(1);
  return Boolean(receipt);
}
