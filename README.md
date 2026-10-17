# Gorth Launcher Website

One fullstack React + Vite + TanStack Router + Hono application, served on one origin.
All three published Gorth libraries remain in use. There is no `src/` tree.
The original Next application is preserved, untouched, in `pkg/`.

## Development

Use Node >=22.18 and pnpm 10. Refresh dependencies after this migration:

```sh
pnpm install
# Configure .env.local from .env.example. Never commit credentials.
pnpm dev
```

Open http://localhost:5504. Vite serves the frontend and dispatches backend
paths to Hono through its official Node adapter; no second server/port or CORS
proxy is needed. Public paths remain domain-first, without an /api prefix.

Public settings use `VITE_PUBLIC_*`. Server-only settings have no `VITE_` prefix.
Vite loads mode-aware env files for build. Node env-file flags load .env and
.env.local for dev, start and database CLI commands. Rename the keys in .env.local and Vercel settings to match .env.example,
keeping their existing values. Do not rotate the session secret: existing encrypted
OAuth tokens depend on it. Standard/database variables such as NODE_ENV, PORT and
DATABASE_URL keep their original names. There are no legacy-key fallbacks.

Private reads are centralized in `utils/environment.ts`. Only explicitly
allowlisted public values are compiled into `utils/client-environment.ts`.
Vite rejects private environment and server-only imports from the browser graph.

## Structure

```text
app/             main.tsx, router.tsx, Hono factory and Node/Vercel entrypoints
pages/           page.tsx files with former App Router paths and route groups
components/      application UI and local adaptations of Next-dependent UI
layouts/         website/dashboard layout and React session guard
providers/       React composition of the existing Primitive contexts
routes/          Hono method/path registration
controllers/     HTTP validation and responses
services/        same-origin client hooks and server domain logic
lib/auth/        official Better Auth client/server, OAuth and Electron setup
database/        existing schema and reviewed migrations (unchanged by this move)
schemas/         validation contracts
utils/           environment, constants, interfaces, caller/fetcher
public/          index.html, icon.svg and static assets
styles/          Tailwind and Primitive styles
scripts/         reviewed database migration tooling
pkg/             original backup, not built or modified
```

Route groups and bracket folders in `pages/` remain organizational. The explicit
TanStack route tree in `app/router.tsx` maps them to the original public URLs.
There is no file-route generator. React links use Primitive's public TanStack
Router export; safe UI components and contexts still come from Primitive.
Next-dependent header/footer/navigation/table components were copied locally and
adapted, rather than patching installed packages.

## Authentication

The Hono integration calls the original official Better Auth handler with the raw
Request. Generic OAuth, encrypted provider tokens, local database sessions and
Electron plugins are retained. Callback is still `/auth/callback/gorth`.
Login still requests SSO account selection; app logout does not sign out SSO.
Secrets, cookies, schema, OAuth client registration and app-specific authorization
have not been replaced by a custom authentication implementation.

`/auth/sign-in`, `/auth/desktop`, `/auth/desktop/complete`, and `/auth/error` are
React screens. Other `/auth/*` paths are backend routes, never SPA fallback.
The React guard is presentation only; protected Hono endpoints verify sessions
and ownership independently. An unavailable session service displays a retry
message instead of repeatedly redirecting.

Keep the existing website/SSO origins, cookie prefix and `SESSION_SECRET`.
No DB migration or SSO callback change is required for this framework migration.
See [auth-structure.md](docs/auth-structure.md) and
[migration-react-vite.md](docs/migration-react-vite.md).

## Build and deployment

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start
```

Build produces `dist/client`, `dist/server`, and `.vercel/output`. Start serves
the built frontend and Hono on the same port. In Vercel use Framework **Other**,
build command `pnpm build`, Node22.x or24.x, and no custom Output Directory override.
Vercel consumes the generated Build Output API artifact, not a Next build or a
static-only SPA deployment. See `vercel.json` and `vite.config.ts`.
Do not deploy until the dependency lockfile has been refreshed with pnpm install.

The frontend is a client-rendered SPA, not SSR. Public title/description/icon,
robots.txt and sitemap.xml remain available; per-route server-rendered HTML and
Next font/image optimization are no longer provided.

Home/download/health work without a database. Downloads remain unavailable until
real release URLs are configured. Auth/account data require the existing database.
Database commands remain available, but do not run historical auth migrations
again on an already migrated deployment.
