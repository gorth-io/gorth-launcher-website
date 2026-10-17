-- Auth contract cloud push applied on 2026-10-09.
-- Audit record only: already pushed; not a Drizzle migration-ledger entry.
-- Historical snapshots remain immutable. Do not replay into a pushed DB.
BEGIN;

ALTER TABLE "public"."auth_transaction" RENAME TO "verification";

ALTER TABLE "public"."session" RENAME CONSTRAINT "sessions_pkey" TO "session_pkey";

ALTER TABLE "public"."verification" RENAME CONSTRAINT "auth_transaction_pkey" TO "verification_pkey";

ALTER INDEX "public"."auth_transaction_expires_idx" RENAME TO "verification_expires_idx";

CREATE TABLE "revocation" (
	"jti" text PRIMARY KEY,
	"sid" text,
	"subject" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);


CREATE TABLE "proof" (
	"key" text PRIMARY KEY,
	"expires_at" timestamp with time zone NOT NULL
);


CREATE INDEX "session_expires_idx" ON "session" ("expires_at");

CREATE INDEX "revocation_sid_idx" ON "revocation" ("sid");

CREATE INDEX "revocation_expires_idx" ON "revocation" ("expires_at");

CREATE INDEX "proof_expires_idx" ON "proof" ("expires_at");

COMMIT;

-- Follow-up: normalize legacy NOT NULL, UNIQUE and FK constraint names.
BEGIN;

ALTER TABLE "public"."session" RENAME CONSTRAINT "sessions_created_at_not_null" TO "session_created_at_not_null";

ALTER TABLE "public"."session" RENAME CONSTRAINT "sessions_expires_at_not_null" TO "session_expires_at_not_null";

ALTER TABLE "public"."session" RENAME CONSTRAINT "sessions_id_not_null" TO "session_id_not_null";

ALTER TABLE "public"."session" RENAME CONSTRAINT "sessions_token_hash_not_null" TO "session_token_hash_not_null";

ALTER TABLE "public"."session" RENAME CONSTRAINT "sessions_user_id_not_null" TO "session_user_id_not_null";

ALTER TABLE "public"."session" RENAME CONSTRAINT "sessions_user_id_user_id_fkey" TO "session_user_id_user_id_fkey";

ALTER TABLE "public"."verification" RENAME CONSTRAINT "auth_transaction_expires_at_not_null" TO "verification_expires_at_not_null";

ALTER TABLE "public"."verification" RENAME CONSTRAINT "auth_transaction_state_hash_not_null" TO "verification_state_hash_not_null";

COMMIT;
