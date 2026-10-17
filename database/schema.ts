import { userTable, sessionTable } from "./auth";
export {
  userStatus,
  userTable,
  sessionTable,
  accountTable,
  rateLimitTable,
  legacySessionTable,
  legacyVerificationTable,
  verificationTable,
  revocationTable,
  proofTable,
} from "./auth";
import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  integer,
  primaryKey,
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const skinModel = pgEnum("skin_model", ["classic", "slim"]);

export const minecraftProfileTable = pgTable(
  "minecraft_profile",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => userTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 16 }).notNull(),
    texturePublic: boolean("texture_public").notNull().default(false),
    revision: integer("revision").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("minecraft_profile_name_key").on(sql`lower(${table.name})`),
    check(
      "minecraft_profile_name_check",
      sql`${table.name} ~ '^[A-Za-z0-9_]{3,16}$'`,
    ),
  ],
);
export const minecraftSessionTable = pgTable(
  "minecraft_session",
  {
    tokenHash: text("token_hash").primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => minecraftProfileTable.id, { onDelete: "cascade" }),
    nativeSessionId: uuid("native_session_id")
      .notNull()
      .references(() => sessionTable.id, { onDelete: "cascade" }),
    clientToken: text("client_token").notNull(),
    revision: integer("revision").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("minecraft_session_profile_idx").on(table.profileId),
    index("minecraft_session_native_idx").on(table.nativeSessionId),
  ],
);
export const minecraftJoinTable = pgTable(
  "minecraft_join",
  {
    profileId: uuid("profile_id")
      .notNull()
      .references(() => minecraftProfileTable.id, { onDelete: "cascade" }),
    serverId: varchar("server_id", { length: 64 }).notNull(),
    tokenHash: text("token_hash")
      .notNull()
      .references(() => minecraftSessionTable.tokenHash, {
        onDelete: "cascade",
      }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.profileId, table.serverId] })],
);
export const friendshipTable = pgTable(
  "friendship",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 16 })
      .$type<"requested" | "accepted">()
      .notNull()
      .default("requested"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("friendship_pair_key").on(
      sql`least(${table.requesterId},${table.recipientId})`,
      sql`greatest(${table.requesterId},${table.recipientId})`,
    ),
    index("friendship_requester_idx").on(table.requesterId),
    index("friendship_recipient_idx").on(table.recipientId),
    check(
      "friendship_not_self_check",
      sql`${table.requesterId} <> ${table.recipientId}`,
    ),
    check(
      "friendship_status_check",
      sql`${table.status} in ('requested','accepted')`,
    ),
  ],
);

export const releaseTable = pgTable(
  "release",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    version: text("version").notNull(),
    platform: text("platform", {
      enum: ["macos", "windows", "linux"],
    }).notNull(),
    architecture: text("architecture", { enum: ["arm64", "x64"] }).notNull(),
    downloadUrl: text("download_url").notNull(),
    checksum: text("checksum"),
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    published: boolean("published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("release_variant_unique").on(
      table.version,
      table.platform,
      table.architecture,
    ),
  ],
);

// Canonical, bounded PNG data stays private in PostgreSQL; no temporary files.
export const skinTable = pgTable(
  "skin",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    model: skinModel("model").notNull().default("classic"),
    pngBase64: text("png_base64").notNull(),
    checksum: varchar("checksum", { length: 64 }).notNull(),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("skin_user_created_idx").on(table.userId, table.createdAt),
    uniqueIndex("skin_active_user_key")
      .on(table.userId)
      .where(sql`${table.isActive} = true`),
  ],
);
