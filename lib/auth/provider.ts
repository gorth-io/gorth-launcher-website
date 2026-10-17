import { genericOAuth } from "better-auth/plugins/generic-oauth";
import { createOAuthIdentityValidator } from "@gorth/structure/modules/auth/server";

export const validateGorthUser = createOAuthIdentityValidator({
  providerId: "gorth",
  subject: (user) => user.externalUserId,
  allowed: (profile) => !profile.status || profile.status === "active",
});

// The protocol implementation (PKCE, state, nonce, discovery and ID-token
// verification) belongs to Better Auth, not the application.
export function gorthProvider(origin: string, clientId: string) {
  return genericOAuth({
    config: [
      {
        providerId: "gorth",
        name: "Gorth SSO",
        clientId,
        discoveryUrl: new URL("/auth/.well-known/openid-configuration", origin)
          .href,
        tokenEndpointAuth: { method: "none" },
        requireIdTokenVerification: true,
        scopes: ["openid", "profile", "email", "offline_access"],
        prompt: "select_account",
        disableProviderLogout: true,
        mapProfileToUser(profile) {
          return {
            externalUserId: String(profile.sub),
            emailVerified: profile.email_verified === true,
            username:
              typeof profile.preferred_username === "string"
                ? profile.preferred_username
                : null,
            image:
              typeof profile.picture === "string" ? profile.picture : undefined,
            ssoStatus:
              typeof profile.status === "string" ? profile.status : "active",
          };
        },
      },
    ],
  });
}
