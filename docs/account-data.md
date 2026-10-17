# Accounts and skins

## Reference implementation

The homepage adapts the Freesm Launcher website's centered hero, download-first
actions and wide launcher preview, while keeping Gorth's shared components/themes.
Reference: `gorth-launcher/packages/freesmlauncher-website/src/components/Hero`.

The account schema is not copied from Freesm's visitor analytics.
It preserves the original local `user` projection: `id`, `externalUserId`, `name`, `username`,
`role`, `status`, `email`, `image`, `banExpires`, `bannedAt`, `deletedAt`,
`metadata`, `lastSeenAt`, `syncedAt`, `createdAt`, `updatedAt`;
The Better Auth migration adds `emailVerified` and `ssoStatus`, preserving
existing IDs, moderation fields and skin ownership.

A verified Gorth SSO subject is the immutable `externalUserId`.
Profile synchronization preserves local role, status, moderation and metadata.
Inactive, suspended, deleted or banned users cannot create/use website sessions.
There is no local password login. Better Auth stores encrypted access/refresh
credentials in the server-side account table, never in browser JavaScript.

## Skin management

Sign in with Gorth and open `/account/skin`. Upload a PNG, choose classic/slim,
mark one skin active, download or delete it.

- `GET /skin`: list the signed-in owner's skin summaries.
- `POST /skin`: multipart fields `file`, `name`, `model`.
- `GET /skin/active`: that owner's selected skin summary or null.
- `POST /skin/active`: JSON `{ "id": "<uuid>" }`.
- `GET /skin/file?id=<uuid>`: download that owner's PNG.
- `GET /skin/file?id=<uuid>&preview=1`: private inline texture preview.
- `DELETE /skin?id=<uuid>`: delete that owner's skin.

The website session is required, including for PNG previews/downloads.
Mutations require the exact configured Origin; ownership is enforced in every
database query and no caller-supplied user ID is trusted.
The API has no public skin/profile listing or wildcard CORS.

Uploads are limited to 256 KB (multipart request 300 KB), 64×64 pixels or classic
64×32. The PNG parser validates chunk boundaries, CRCs, header fields, compressed
scanline size and filter bytes. It supports non-interlaced 8-bit RGB/RGBA only,
rejects animated/palette PNGs, strips ancillary metadata and re-encodes the image.
It does not trust MIME/extension alone and does not fetch a caller-provided URL.

Canonical PNG data is stored in PostgreSQL `skin.png_base64`, not temporary
local files. Its SHA-256 checksum is saved alongside model, name, owner and timestamp.
Maximum 100 skins/account; owner-scoped transaction locks serialize quota checks
and active-skin changes. A partial unique index permits at most one active skin
per user. The first upload becomes active; deleting it leaves no active selection
until another skin is chosen. Deleting the user cascades to skins/sessions.

## Persistence and rollout

SQL migrations are generated under `database/drizzle`. The schema was applied
with `pnpm drizzle-kit push` on 2026-10-09 and the website client was registered
in SSO. Push does not create migration history; do not replay initial SQL over
this already-pushed database. Real-account login has not been tested.
Browser and Launcher need separate PostgreSQL databases/schemas because their
initial migrations both create shared authentication/release table names.

If the previous scaffold schema was already applied, do not apply this initial
migration over it. Review a preserving rename/backfill migration instead.

## Minecraft integration: not yet implemented

Setting an active skin currently records the Gorth account's skin preference.
It does **not** claim to change a Minecraft character's texture.

The desktop Launcher has authlib-injector support in its game installer, but
`lib/auth/service.ts` currently reports `gorthGame: false` and
`resolveGameSession` accepts offline accounts only. The Gorth game adapter points
to a separately configured Yggdrasil-compatible service; website SSO is not a
Minecraft game authentication session. That service is not implemented here.

To make this skin visible in game, the Gorth game service must bind a Minecraft
profile to the same immutable SSO subject, expose authenticated skin management
and compatible texture/profile endpoints, and configure the launcher injector.
Texture-publication/privacy and online/multiplayer authentication need an explicit
product decision; do not expose private website skins or re-use website ID tokens
as game credentials. Native Better Auth manages only the website session;
this task does not add Ely auth or change desktop game login.

A future desktop profile UI can consume the skin API using an authorized website
session or a properly registered audience/scope-bound resource token. Do not
bypass the guard or export OAuth credentials to renderer code.

The 2026-10-11 cloud migration archives old auth tables and preserves users and
skin data. Native-handler Vitest tests and production HTTP smoke checks were
performed; real-account login and Minecraft integration remain untested.
See `auth-structure.md` for the migration and verification details.
