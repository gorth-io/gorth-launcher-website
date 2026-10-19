# Official Better Auth migration (2026-10-11)

Gorth SSO is the identity provider. This website uses official Generic OAuth
and database sessions, not a separate password/account authority.

## Native responsibilities

- Better Auth: discovery/JWKS, PKCE, state/nonce, ID-token verification,
  callback, local sessions and access-token refresh.
- React SDK: signIn.social, useSession, signOut.
- Hono passes the raw Request to auth.handler without cookie/response rewriting.
- prompt: select_account always opens account selection.
- disableProviderLogout: true keeps sign-out local. It neither calls SSO
  end-session nor automatically revokes already-issued provider grants.
- Access/refresh tokens are encrypted in account; never exported to cookies.
  HTTP token-export/refresh and identity-mutation endpoints are disabled.
- Cookie naming is controlled by OAUTH_COOKIE_PREFIX on the server and
  forwarded as public naming metadata to the Electron proxy. Cookies are not
  isolated by localhost port; use different prefixes if app sessions must coexist.

## Application authorization and remaining glue

Only verified Gorth OAuth profiles may provision users. Bind immutable SSO sub
to externalUserId; do not merge accounts by email. Local roles, moderation and
resource ownership remain application-owned.

Protected APIs validate the native session in DB, local moderation and signed
revocation receipts. Sensitive writes check SSO UserInfo directly; ordinary
protected reads recheck after 120 seconds as a missed-event fallback. Better Auth
owns token refresh. React request caching avoids duplicate RSC checks.

Generic OAuth does not supply an RP backchannel endpoint. The small
/auth/backchannel-logout adapter verifies signed events, stores a receipt and
atomically removes only matching native sessions. The existing Structure
logout-token verifier remains here; it is not a session or OAuth engine.

## Migration and deployment

Run pnpm db:migrate-auth before deploying this code to an existing DB.
The transaction archives old tables as legacy_session/legacy_verification,
creates native session/account/verification/rate_limit and adds email_verified
and sso_status to user. User IDs, domain rows and foreign keys stay unchanged.
Account bindings are backfilled by SSO sub, never email.
Archived tables remain declared in Drizzle, preventing accidental future drops.

Migration was applied to the configured cloud DB and user bindings verified.
Old website sessions require signing in again. No old session becomes a valid
native session, and no user/domain row is removed.

Keep SESSION_SECRET unchanged (private, at least 32 bytes).
VITE_PUBLIC_AUTH_URL is the single fullstack public SSO origin
(https://gorth-auth.vercel.app for the deployed SSO).
Old separate-server and token-cookie env variables are no longer consumed.
No private env file was edited.

Register /auth/callback/gorth on the exact site origin. The two SSO cloud
callbacks have been updated without changing secrets or scopes.
Register production callbacks explicitly; wildcard redirects are not allowed.
Restart the website and SSO processes after deployment.

## Verification

Run pnpm test, pnpm typecheck, pnpm lint and pnpm build (Vite frontend + bundled Hono backend).
Fixtures exercise actual Better Auth handlers with isolated memory storage and
mocked OIDC transport. Production smoke checks exercise discovery, native
authorize URLs and CSRF against localhost SSO without real user credentials.
A real-account UI login remains a user-operated acceptance check.

References: [Generic OAuth](https://better-auth.com/docs/plugins/generic-oauth),
[Hono](https://better-auth.com/docs/integrations/hono),
[Sessions](https://better-auth.com/docs/concepts/session-management).

## Official desktop integration

This backend installs electron({ clientID: "gorth-launcher" }) from @better-auth/electron. trustedOrigins includes "com.gorth.launcher:/"; CSRF/origin validation remains enabled.

The public /auth/desktop page always starts Generic OAuth gorth with account selection. It preserves the SDK client_id/state/code_challenge in fetchOptions.query. /auth/desktop/complete reads the short-lived transfer ticket with the official electronProxyClient getAuthorizationCode action, validates its shape, and retains a fixed-protocol callback link in component memory before clearing the temporary cookie and attempting automatic navigation. Open desktop app is a real anchor, so the click itself launches the custom protocol with a user gesture even if automatic navigation was blocked. No access/refresh/session tokens are copied into that link. The code exchange still validates state, PKCE, expiration and single-use consumption in the SDK/server; desktop logout does not delete the website browser session or the SSO session.

The completion page expires its in-memory retry link after 120 seconds and shows an actionable error if no valid ticket arrives. It never persists the ticket in localStorage/sessionStorage. Do not replace the fixed app-specific protocol with the internal gorth:// page scheme. After deploying this change, start a NEW login from the desktop app: an older completion page whose cookie was already consumed cannot recover the old ticket.

Regression tests cover HTTP and deployed HTTPS origins, the official SDK cookie reader, a blocked automatic launch followed by a retained manual href, malformed tickets, timeout and cleanup. Actual OS protocol registration and a real-account production round trip still need manual verification after redeploy. No auth secrets, trusted-origin checks, CSRF settings or PKCE validation were relaxed.

Desktop VITE_PUBLIC_AUTH_URL points to this website (localhost:5504); website VITE_PUBLIC_AUTH_URL points to the fullstack SSO origin (localhost:3000). The desktop SDK client ID is not this website's OAuth client ID. Keep the existing secret value under SESSION_SECRET so encrypted account tokens remain readable.

## Website login configuration

The website uses the same native Better Auth Generic OAuth and local database
session flow as the six vertical web apps. The Electron plugins extend that flow
for desktop handoff; they do not replace the browser OAuth client.

The four public URL/client/cookie settings alone are not sufficient:

- SESSION_SECRET is required server-side, at least 32 bytes. Generate a
  separate random value for each new website with `openssl rand -base64 48`.
  If a website already has encrypted account tokens, keep its existing secret.
- DATABASE_URL must point to this website's own database with its existing auth
  tables, not the SSO database. No schema migration is introduced by this fix.
- Use this website's app URL/client ID from .env.example, not the other website's.
- Register the exact /auth/callback/gorth URL on that OAuth client in SSO.

Missing/invalid configuration logs only variable names under [auth/config] and
returns 503 auth_unavailable with no-store. It never falls back to a shared secret,
prints credentials, or sends private configuration to browser JavaScript.
Protected server reads without the native session cookie return unauthenticated
before initializing auth/database. A cookie is not proof of authentication:
authenticated requests still undergo native DB session, local policy and
revocation checks.

After changing private env values, restart the Vite/Hono dev process. Do not send secrets in chat.
Run tests without writing dependency caches:
`pnpm exec vitest run --no-cache --no-fsModuleCache --configLoader native`.

Electron introduces no new database table. OAuth/PKCE and session logic belongs to the official plugins. Application code supplies deployment configuration, local account policy and storage.

Tests in tests/generic-oauth.test.ts cover Generic OAuth → Electron transfer, one-time code consumption, independent app logout and SSO identity binding.
