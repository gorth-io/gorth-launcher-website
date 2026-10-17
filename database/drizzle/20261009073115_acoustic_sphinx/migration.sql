ALTER TABLE "releases" RENAME TO "release";--> statement-breakpoint
ALTER TABLE "sessions" RENAME TO "session";--> statement-breakpoint
ALTER INDEX "releases_variant_unique" RENAME TO "release_variant_unique";--> statement-breakpoint
ALTER INDEX "sessions_token_hash_unique" RENAME TO "session_token_hash_unique";--> statement-breakpoint
ALTER INDEX "sessions_user_index" RENAME TO "session_user_index";--> statement-breakpoint
ALTER INDEX "sessions_sso_session_index" RENAME TO "session_sso_session_index";