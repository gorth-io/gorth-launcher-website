CREATE TABLE "auth_transaction" (
	"state_hash" text PRIMARY KEY,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "credentials" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "sso_session_id" text;--> statement-breakpoint
CREATE INDEX "auth_transaction_expires_idx" ON "auth_transaction" ("expires_at");--> statement-breakpoint
CREATE INDEX "sessions_sso_session_index" ON "sessions" ("sso_session_id");