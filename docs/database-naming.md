# Database naming

Current table names: `user`, `session`, `verification`, `revocation`, `proof`, `release`, `skin`.

Drizzle table symbols use singular names with a `Table` suffix. Array payload
fields such as `tabs`, `bookmarks`, and `instances` remain plural collections.
Legacy names in migration maps, old fixture seeds and previously generated
migrations/snapshots are intentional; applied migration history is immutable.

On 2026-10-09, `sessions` and `releases` were renamed along with their named
indexes. The cloud change was applied with `pnpm db:push` after reviewing its
`--explain` SQL and supplying explicit rename hints. No table was dropped or
recreated. User/session row counts were preserved; subsequent schema diff is empty.

As with earlier pushes, this does not create migration-ledger entries. Baseline
an already pushed database before switching to `db:migrate`; do not replay
historical CREATE TABLE migrations against an existing pushed database.
