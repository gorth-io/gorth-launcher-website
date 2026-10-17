# React/Vite/TanStack Router migration

## Runtime and URL contract

- app/main.tsx mounts React. app/router.tsx registers the complete code-based route tree.
- public/index.html is the source HTML entry, alongside public/icon.svg.
- pages/ keeps the former organizational paths, including (dashboard) and bracket IDs.
- Vite middleware loads app/server.ts and sends backend requests through Hono's Node adapter.
- app/vercel.ts exports the Node function; app/node.ts serves frontend assets and Hono locally after build.
- app/routing.ts is shared by dev, Node and the Vercel packaging script so auth paths cannot fall through to the SPA.
- Existing domain prefixes, callbacks, methods and query strings are unchanged. There is no /api prefix.
- Missing API paths remain API errors; missing compiled assets return404 instead of HTML.

## Authentication preserved

Better Auth1.7.9 still owns Generic OAuth, PKCE, state/nonce, provider token encryption,
native database sessions, CSRF and origin checks. The official Electron plugin and
Electron proxy client still own the desktop transfer. The migration removes Next
routing and next/headers, not these protocol implementations.

Incoming request Headers are passed explicitly to the session service. There is no
fetch back into the same app, server-global user cache, or client-accessible OAuth
token. The UI uses the React SDK's session hook and guards only presentation.
Every protected Hono endpoint retains its server authorization and ownership checks.

Anonymous navigation is committed once per guard mount to avoid a React/TanStack
redirect loop. Session-service failures display retry UI. App-only logout and SSO
account selection retain their existing behavior. Multiple Set-Cookie headers and
Location survive the Node adapter, including on OAuth and Electron callbacks.

No schema change, secret rotation or OAuth registration update is required. Keep
VITE_PUBLIC_APP_URL, VITE_PUBLIC_AUTH_URL, VITE_PUBLIC_OAUTH_CLIENT_ID,
OAUTH_COOKIE_PREFIX and SESSION_SECRET consistent with the existing deployment.
Public settings use VITE_PUBLIC_*; server-only settings have no VITE_ prefix. Rename
the keys in .env.local and Vercel settings while preserving their existing values.
Do not rotate the session secret or change the cookie prefix during this rename.
Standard/database variables retain their own names. Only explicitly allowlisted
public values enter Vite define; there are no legacy-key fallback chains.

## Shared UI and packages

All three Gorth packages remain. Primitive provides safe controls, icons, providers,
styles and TanStack exports. Its Next-dependent header/footer/dashboard navigation
and DataTable were copied into corresponding local paths and adapted. DataTable
keeps its pagination/loading UI without Next progress hooks. ApplicationProvider
composes the existing shared contexts without the Next progress provider.
Installed packages, shared-package source and pkg/ have not been patched.

The frontend build rejects Next, server-only and private environment imports.
Default Vite exposure uses VITE_; only public settings retain that prefix.
Never give server-only variables a VITE_ prefix or inject process.env wholesale. Runtime server configuration is not baked into frontend JS.
The public cookie prefix is a build-time value; rebuild when changing it.

## Vercel

Use Framework Other, Node22.x/24.x, pnpm install, and pnpm build. Remove any
Next-specific build/dev/output overrides in project settings. Leave Output Directory
unset: the SSR writeBundle hook in vite.config.ts creates the Build Output API artifact itself.
Do not use a static-only Vite preset that discards the Hono function.

The generated .vercel/output contains static assets and a bundled Node function.
Routes send public auth screens to HTML and OAuth/API requests to the function
before SPA fallback. Auth/private routes are non-cacheable. Referrer headers avoid
leaking auth query strings, and no auth URL logger is enabled. Vercel environment
settings must be present at both build and runtime, with public HTTPS app origins.
No actual Vercel deployment was performed during this migration.

Use pnpm start (vite preview) to test the built UI and Hono API on one port locally.
Preview loads the compiled API through configurePreviewServer; it is not a production server.
Install the declared tsx dev dependency before using pnpm db:migrate-auth.
Keep the existing production
callback /auth/callback/gorth and the existing Electron trusted scheme origins.

## Verification and acceptance

Run pnpm typecheck, pnpm lint, pnpm test and pnpm build after pnpm install.
The test command uses Vite's runner config loader to avoid config caches under
node_modules. Tests use fixtures; they never require real credentials.

Checks cover native OAuth/Electron handlers, PKCE/nonces, local logout, policies,
URL partitioning, and Node redirects/cookies/body handling. The built Vercel entry
is imported and exercised on loopback; frontend and server bundles are checked
separately. Chrome smoke tests use isolated profiles and fake session responses,
including home/download/dashboard, anonymous redirect, and unavailable SSO UI.

Before production, manually accept a real SSO sign-in, select-account, reload,
app-only logout and Electron handoff against the configured deployment. Those
real-account checks are not replaced by fixture results. No live DB was migrated.

This is a client-rendered SPA. Static metadata, icon, robots.txt and sitemap.xml
remain; Next SSR, font downloading and image optimization are removed. Consider
prerendering separately if search indexing beyond these basic pages becomes a requirement.

## Native single-config build

Run pnpm build (vite build --configLoader runner), or invoke the Vite CLI directly.
vite.config.ts declares client and ssr environments with separate output folders.
An empty builder option opts into Vite's default application builder; there is no
custom CLI build script and no recursive invocation of the build API.

Vite builds both environments using Rolldown. The SSR-only writeBundle integration
emits .vercel/output after server chunks have been written and client output exists.
It is a local deployment-format adapter, not a replacement bundler. Vite itself
does not provide this application-specific Vercel packaging. Failed builds do not
run the packaging hook; a write:false diagnostic never emits deployment output.

The old rolldown.config.ts, scripts/build.mjs and scripts/vercel-output.mjs were
removed. Public metadata is loaded using Vite loadEnv with an explicit allowlist;
private variables remain server runtime values. No app env, pkg backup, dependency
or database migration is required for this build-configuration change.

Reference: https://vite.dev/guide/api-environment-frameworks
