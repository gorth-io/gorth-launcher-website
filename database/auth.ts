import { sql } from "drizzle-orm";
import {
  boolean,
  bigint,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Better Auth owns app-local sessions; Gorth SSO remains the identity provider.
export const userStatus = pgEnum("user_status", [
  "active",
  "inactive",
  "suspended",
  "deleted",
]);

export const userTable = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalUserId: text("external_user_id").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    ssoStatus: text("sso_status").notNull().default("active"),
    name: text("name").notNull().default(""),
    username: varchar("username", { length: 64 }),
    role: varchar("role", { length: 32 }).notNull().default("user"),
    status: userStatus("status").notNull().default("active"),
    email: varchar("email", { length: 255 }).notNull().unique(),
    image: text("image"),
    banExpires: timestamp("ban_expires", { mode: "date", withTimezone: true }),
    bannedAt: timestamp("banned_at", { mode: "date", withTimezone: true }),
    deletedAt: timestamp("deleted_at", { mode: "date", withTimezone: true }),
    metadata: jsonb("metadata")
      .notNull()
      .default(sql`'{}'::jsonb`),
    lastSeenAt: timestamp("last_seen_at", { mode: "date", withTimezone: true }),
    syncedAt: timestamp("synced_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("user_last_seen_at_idx").on(table.lastSeenAt),
    index("user_external_user_id_idx").on(table.externalUserId),
    index("user_status_idx").on(table.status),
    uniqueIndex("user_username_lower_key").on(sql`lower(${table.username})`),
  ],
);

// Native Better Auth schemas; legacy auth rows are archived, never converted
// into valid sessions or deleted during this migration.
export const sessionTable = pgTable(
  "session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ssoSessionId: text("sso_session_id"),
  },
  (table) => [
    index("native_session_user_idx").on(table.userId),
    index("native_session_sid_idx").on(table.ssoSessionId),
  ],
);

export const accountTable = pgTable(
  "account",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    ssoSessionId: text("sso_session_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("account_provider_subject_unique").on(
      table.providerId,
      table.accountId,
    ),
    index("account_user_idx").on(table.userId),
  ],
);

export const verificationTable = pgTable(
  "verification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("native_verification_identifier_idx").on(table.identifier)],
);

export const rateLimitTable = pgTable("rate_limit", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  count: bigint("count", { mode: "number" }).notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const legacySessionTable = pgTable(
  "legacy_session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull(),
    credentials: text("credentials"),
    ssoSessionId: text("sso_session_id"),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("session_token_hash_unique").on(table.tokenHash),
    index("session_user_index").on(table.userId),
    index("session_sso_session_index").on(table.ssoSessionId),
    index("session_expires_idx").on(table.expiresAt),
  ],
);

export const legacyVerificationTable = pgTable(
  "legacy_verification",
  {
    stateHash: text("state_hash").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("verification_expires_idx").on(table.expiresAt)],
);

// Signed logout receipts; sid may be absent for a subject-wide logout.
export const revocationTable = pgTable(
  "revocation",
  {
    jti: text("jti").primaryKey(),
    sid: text("sid"),
    subject: text("subject"),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("revocation_sid_idx").on(table.sid),
    index("revocation_expires_idx").on(table.expiresAt),
  ],
);

// Consumed DPoP proof keys, not the JWT/proof itself. Reservation must be atomic.
export const proofTable = pgTable(
  "proof",
  {
    key: text("key").primaryKey(),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => [index("proof_expires_idx").on(table.expiresAt)],
);
