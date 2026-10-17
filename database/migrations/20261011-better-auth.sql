-- Idempotent, additive migration. Run with scripts/migrate-better-auth.mjs.
-- A transaction preserves existing user IDs and domain foreign keys.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'session' AND column_name = 'token_hash') THEN
    IF to_regclass('public.legacy_session') IS NOT NULL THEN RAISE EXCEPTION 'legacy_session already exists; inspect before migrating'; END IF;
    ALTER TABLE public.session RENAME TO legacy_session;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'verification' AND column_name = 'state_hash') THEN
    IF to_regclass('public.legacy_verification') IS NOT NULL THEN RAISE EXCEPTION 'legacy_verification already exists; inspect before migrating'; END IF;
    ALTER TABLE public.verification RENAME TO legacy_verification;
  END IF;
END $$;

ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS sso_status text NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS public.session (
  id uuid CONSTRAINT native_session_pkey PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  sso_session_id text
);
CREATE INDEX IF NOT EXISTS native_session_user_idx ON public.session(user_id);
CREATE INDEX IF NOT EXISTS native_session_sid_idx ON public.session(sso_session_id);

CREATE TABLE IF NOT EXISTS public.account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  account_id text NOT NULL,
  provider_id text NOT NULL,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  sso_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS account_provider_subject_unique ON public.account(provider_id, account_id);
CREATE INDEX IF NOT EXISTS account_user_idx ON public.account(user_id);

CREATE TABLE IF NOT EXISTS public.verification (
  id uuid CONSTRAINT native_verification_pkey PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS native_verification_identifier_idx ON public.verification(identifier);

CREATE TABLE IF NOT EXISTS public.rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  count bigint NOT NULL,
  last_request bigint NOT NULL
);

-- Link by immutable SSO sub, NEVER by email. The next OAuth sign-in updates
-- verified email/profile and writes encrypted provider tokens through Better Auth.
INSERT INTO public.account (user_id, account_id, provider_id)
SELECT id, external_user_id, 'gorth' FROM public."user"
ON CONFLICT (provider_id, account_id) DO NOTHING;
