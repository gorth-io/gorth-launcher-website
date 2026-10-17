CREATE TYPE "skin_model" AS ENUM('classic', 'slim');--> statement-breakpoint
CREATE TYPE "user_status" AS ENUM('active', 'inactive', 'suspended', 'deleted');--> statement-breakpoint
CREATE TABLE "releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"version" text NOT NULL,
	"platform" text NOT NULL,
	"architecture" text NOT NULL,
	"download_url" text NOT NULL,
	"checksum" text,
	"size_bytes" bigint,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"model" "skin_model" DEFAULT 'classic'::"skin_model" NOT NULL,
	"png_base64" text NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"external_user_id" text NOT NULL UNIQUE,
	"name" text DEFAULT '' NOT NULL,
	"username" varchar(64),
	"role" varchar(32) DEFAULT 'user' NOT NULL,
	"status" "user_status" DEFAULT 'active'::"user_status" NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"image" text,
	"ban_expires" timestamp with time zone,
	"banned_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"last_seen_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "releases_variant_unique" ON "releases" ("version","platform","architecture");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_index" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "skin_user_created_idx" ON "skin" ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "skin_active_user_key" ON "skin" ("user_id") WHERE "is_active" = true;--> statement-breakpoint
CREATE INDEX "user_last_seen_at_idx" ON "user" ("last_seen_at");--> statement-breakpoint
CREATE INDEX "user_external_user_id_idx" ON "user" ("external_user_id");--> statement-breakpoint
CREATE INDEX "user_status_idx" ON "user" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_lower_key" ON "user" (lower("username"));--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "skin" ADD CONSTRAINT "skin_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;