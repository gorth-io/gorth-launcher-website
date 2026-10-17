# Application architecture

This website now uses React + Vite + TanStack Router and a same-origin Hono backend.
Do not reintroduce Next.js imports, a src directory, or a second public server port.

- Entrypoints and explicit TanStack route tree: app/.
- UI pages: pages/, preserving route-group and dynamic-folder organization.
- HTML and icons: public/; source HTML entry is public/index.html.
- Backend: routes -> controllers -> services -> database, with the existing Better Auth handler.
- Use the public exports of @gorth/primitive, @gorth/principle and @gorth/structure.
- Copy/adapt Next-dependent shared UI locally; never patch node_modules.
- Keep utils/environment.ts private; expose only allowlisted public values through utils/client-environment.ts.
- Retain the existing VITE_* environment contract, OAuth registrations, session secret and cookie settings unless explicitly migrating them.
- Never read or expose .env.local. Keep pkg/ as an untouched backup, excluded from tooling and deployment.
- Do not modify dependency lockfiles or installed packages without explicit authorization.

Verify pnpm typecheck, pnpm lint, pnpm test and pnpm build. Check generated Node/Vercel entries as well as frontend source.
