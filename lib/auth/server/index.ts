import { oauthCookiePrefix } from "@/utils/environment";
import "server-only";
import { APIError, betterAuth } from "better-auth";
import { electron } from "@better-auth/electron";
import { electronClientId, electronScheme } from "@/lib/auth/contract";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { decodeJwt } from "@gorth/structure/cores/jose";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/database";
import {
  accountTable,
  sessionTable,
  userTable,
  verificationTable,
  rateLimitTable,
} from "@/database/auth";
import { getAuthConfig } from "@/lib/auth/config";
import { gorthProvider, validateGorthUser } from "@/lib/auth/provider";
import {
  nodeEnv,
  sessionMaxAgeSeconds,
  rateLimitEnabled,
} from "@/utils/environment";

function createAuth() {
  const config = getAuthConfig();
  const database = getDatabase();
  const expiresIn = Number(sessionMaxAgeSeconds ?? 2592000);
  if (
    !Number.isSafeInteger(expiresIn) ||
    expiresIn < 120 ||
    expiresIn > 2592000
  )
    throw new Error("Invalid session lifetime");
  return betterAuth({
    appName: "Gorth Launcher Website",
    baseURL: config.origin,
    basePath: "/auth",
    secret: config.secret,
    trustedOrigins: [config.origin, `${electronScheme}:/`],
    // Credentials stay server-only; identities remain managed by Gorth SSO.
    disabledPaths: [
      "/get-access-token",
      "/refresh-token",
      "/account-info",
      "/link-social",
      "/unlink-account",
      "/update-user",
      "/delete-user",
      "/sign-up/email",
      "/sign-in/email",
    ],
    emailAndPassword: { enabled: false },
    database: drizzleAdapter(database, {
      provider: "pg",
      schema: {
        user: userTable,
        session: sessionTable,
        account: accountTable,
        verification: verificationTable,
        rateLimit: rateLimitTable,
      },
    }),
    plugins: [
      gorthProvider(config.ssoOrigin, config.clientId),
      electron({
        clientID: electronClientId,
        cookiePrefix: oauthCookiePrefix,
        codeExpiresIn: 120,
      }),
    ],
    user: {
      additionalFields: {
        externalUserId: { type: "string", required: true },
        username: { type: "string", required: false },
        ssoStatus: { type: "string", required: false },
      },
      validateUserInfo: validateGorthUser,
    },
    account: {
      encryptOAuthTokens: true,
      accountLinking: { enabled: false },
      additionalFields: {
        ssoSessionId: { type: "string", required: false, input: false },
      },
    },
    session: {
      expiresIn,
      cookieCache: { enabled: true, maxAge: 120 },
      additionalFields: {
        ssoSessionId: { type: "string", required: false, input: false },
      },
    },
    rateLimit: {
      enabled: nodeEnv === "production" || rateLimitEnabled,
      storage: "database",
    },
    advanced: {
      database: { generateId: false },
      cookiePrefix: oauthCookiePrefix,
    },
    databaseHooks: {
      account: {
        create: {
          before: async (account) => ({
            data: {
              ...account,
              // Better Auth verified the ID token before persisting this account.
              ssoSessionId: account.idToken
                ? String(decodeJwt(account.idToken).sid ?? "")
                : null,
            },
          }),
        },
        update: {
          before: async (account) => ({
            data: {
              ...account,
              ...(account.idToken
                ? { ssoSessionId: String(decodeJwt(account.idToken).sid ?? "") }
                : {}),
            },
          }),
        },
      },
      session: {
        create: {
          before: async (session) => {
            const [localUser] = await database
              .select()
              .from(userTable)
              .where(eq(userTable.id, session.userId))
              .limit(1);
            if (
              !localUser ||
              localUser.status !== "active" ||
              localUser.deletedAt ||
              (localUser.bannedAt &&
                (!localUser.banExpires || localUser.banExpires > new Date()))
            )
              throw new APIError("FORBIDDEN", {
                message: "Account is unavailable",
              });
            const [account] = await database
              .select({ sid: accountTable.ssoSessionId })
              .from(accountTable)
              .where(
                and(
                  eq(accountTable.userId, session.userId),
                  eq(accountTable.providerId, "gorth"),
                ),
              )
              .limit(1);
            if (!account?.sid)
              throw new APIError("UNAUTHORIZED", {
                message: "SSO session identity is missing",
              });
            return { data: { ...session, ssoSessionId: account?.sid ?? null } };
          },
        },
      },
    },
  });
}

let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  return (instance ??= createAuth());
}
