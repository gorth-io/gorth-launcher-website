BEGIN;
CREATE TABLE IF NOT EXISTS minecraft_profile (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
 name varchar(16) NOT NULL CONSTRAINT minecraft_profile_name_check CHECK (name ~ '^[A-Za-z0-9_]{3,16}$'), texture_public boolean NOT NULL DEFAULT false, revision integer NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS minecraft_profile_name_key ON minecraft_profile (lower(name));
CREATE TABLE IF NOT EXISTS minecraft_session (
 token_hash text PRIMARY KEY, profile_id uuid NOT NULL REFERENCES minecraft_profile(id) ON DELETE CASCADE,
 native_session_id uuid NOT NULL REFERENCES session(id) ON DELETE CASCADE,
 client_token text NOT NULL, revision integer NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS minecraft_session_profile_idx ON minecraft_session(profile_id);
CREATE INDEX IF NOT EXISTS minecraft_session_native_idx ON minecraft_session(native_session_id);
CREATE TABLE IF NOT EXISTS minecraft_join (
 profile_id uuid NOT NULL REFERENCES minecraft_profile(id) ON DELETE CASCADE, server_id varchar(64) NOT NULL,
 token_hash text NOT NULL REFERENCES minecraft_session(token_hash) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL, PRIMARY KEY(profile_id, server_id)
);
CREATE TABLE IF NOT EXISTS friendship (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), requester_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 recipient_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE, status varchar(16) NOT NULL DEFAULT 'requested',
 created_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT friendship_not_self_check CHECK(requester_id <> recipient_id), CONSTRAINT friendship_status_check CHECK(status IN ('requested','accepted'))
);
CREATE UNIQUE INDEX IF NOT EXISTS friendship_pair_key ON friendship(least(requester_id,recipient_id), greatest(requester_id,recipient_id));
CREATE INDEX IF NOT EXISTS friendship_requester_idx ON friendship(requester_id);
CREATE INDEX IF NOT EXISTS friendship_recipient_idx ON friendship(recipient_id);
COMMIT;
