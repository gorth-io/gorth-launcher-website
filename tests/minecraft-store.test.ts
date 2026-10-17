import { beforeEach, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
vi.mock("server-only", () => ({}));
const fixture = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  values: vi.fn(),
  delete: vi.fn(),
  execute: vi.fn(),
  revoked: vi.fn(),
  sign: vi.fn(),
  key: vi.fn(),
}));
vi.mock("@/database", () => ({
  getDatabase: () => ({
    ...fixture,
    transaction: async (operation: (db: unknown) => Promise<unknown>) =>
      operation(fixture),
  }),
}));
vi.mock("@/lib/auth/config", () => ({
  getAuthConfig: () => ({ origin: "https://launcher.test" }),
}));
vi.mock("@/services/sso", () => ({ isSsoSessionRevoked: fixture.revoked }));
vi.mock("@/lib/minecraft/keys", async (original) => ({
  ...(await original<typeof import("@/lib/minecraft/keys")>()),
  minecraftKey: fixture.key,
  signTexture: fixture.sign,
}));
import {
  getValidGameSession,
  issueGameSession,
  refreshGameSession,
  joinMinecraft,
  hasJoinedMinecraft,
  getSignedMinecraftProfile,
  getMinecraftTexture,
} from "@/services/minecraft-store";
import { hashGameToken } from "@/lib/minecraft/keys";

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  compact = id.replaceAll("-", "");
const token = "a".repeat(43);
function query(rows: unknown[]) {
  return Object.assign(Promise.resolve(rows), {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
  });
}
function live() {
  return {
    tokenHash: hashGameToken(token),
    clientToken: "client",
    revision: 2,
    profileId: id,
    name: "Player",
    profileRevision: 2,
    userId: "owner",
    nativeSessionId: "parent",
    expiresAt: new Date(Date.now() + 60_000),
    externalUserId: "central-user",
    sid: "central-session",
    status: "active",
    deletedAt: null,
    bannedAt: null,
    banExpires: null,
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  fixture.select.mockReturnValue(query([]));
  fixture.values.mockReturnValue(query([]));
  fixture.insert.mockReturnValue({ values: fixture.values });
  fixture.delete.mockReturnValue(query([]));
  fixture.revoked.mockResolvedValue(false);
  fixture.sign.mockReturnValue("fixture-signature");
});
it("issues opaque, hashed game credentials bounded by the live parent session", async () => {
  const expiresAt = new Date(Date.now() + 60_000);
  fixture.select
    .mockReturnValueOnce(query([{ expiresAt }]))
    .mockReturnValueOnce(query([{ id, name: "Player", revision: 2 }]))
    .mockReturnValueOnce(query([]));
  const response = await issueGameSession("owner", "parent", "client");
  expect(response.accessToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(response.expiresAt).toBe(expiresAt.getTime());
  expect(response.authlibRoot).toBe("https://launcher.test/minecraft");
  expect(response.selectedProfile).toEqual({ id: compact, name: "Player" });
  expect(fixture.values).toHaveBeenCalledWith(
    expect.objectContaining({
      tokenHash: hashGameToken(response.accessToken),
      nativeSessionId: "parent",
      profileId: id,
      revision: 2,
    }),
  );
  expect(JSON.stringify(fixture.values.mock.calls)).not.toContain(
    response.accessToken,
  );
});
it("refuses expired parents, missing profiles and excessive issuance", async () => {
  await expect(
    issueGameSession("owner", "expired", "client"),
  ).rejects.toMatchObject({ status: 401 });
  fixture.select
    .mockReturnValueOnce(query([{ expiresAt: new Date(Date.now() + 60_000) }]))
    .mockReturnValueOnce(query([]));
  await expect(
    issueGameSession("owner", "parent", "client"),
  ).rejects.toMatchObject({ status: 409 });
  fixture.select
    .mockReturnValueOnce(query([{ expiresAt: new Date(Date.now() + 60_000) }]))
    .mockReturnValueOnce(query([{ id, name: "Player", revision: 0 }]))
    .mockReturnValueOnce(
      query(Array.from({ length: 10 }, () => ({ createdAt: new Date() }))),
    );
  await expect(
    issueGameSession("owner", "parent", "client"),
  ).rejects.toMatchObject({ status: 429 });
  expect(fixture.values).not.toHaveBeenCalled();
});
it("rejects missing, revoked, renamed, banned and client-mismatched game sessions", async () => {
  await expect(getValidGameSession(token)).rejects.toMatchObject({
    status: 403,
  });
  for (const patch of [
    { profileRevision: 3 },
    { status: "disabled" },
    { deletedAt: new Date() },
    { bannedAt: new Date(), banExpires: null },
    { sid: null },
  ]) {
    fixture.select.mockReturnValueOnce(query([{ ...live(), ...patch }]));
    await expect(getValidGameSession(token)).rejects.toMatchObject({
      status: 403,
    });
  }
  fixture.select.mockReturnValueOnce(query([live()]));
  await expect(
    getValidGameSession(token, "another-client"),
  ).rejects.toMatchObject({ status: 403 });
  fixture.select.mockReturnValueOnce(query([live()]));
  fixture.revoked.mockResolvedValueOnce(true);
  await expect(getValidGameSession(token)).rejects.toMatchObject({
    status: 403,
  });
});
it("rechecks SSO revocation and rotates once without extending the parent-bound expiry", async () => {
  const row = live();
  fixture.select.mockReturnValueOnce(query([row]));
  fixture.delete.mockReturnValueOnce(query([{ id }]));
  const refreshed = await refreshGameSession(token, "client");
  expect(fixture.revoked).toHaveBeenCalledWith(
    "central-user",
    "central-session",
  );
  expect(refreshed.accessToken).not.toBe(token);
  expect(refreshed.selectedProfile.id).toBe(compact);
  expect(fixture.values).toHaveBeenCalledWith(
    expect.objectContaining({
      expiresAt: row.expiresAt,
      nativeSessionId: "parent",
      revision: 2,
    }),
  );
  fixture.select.mockReturnValueOnce(query([row]));
  fixture.delete.mockReturnValueOnce(query([]));
  await expect(refreshGameSession(token, "client")).rejects.toMatchObject({
    status: 403,
  });
});
it("rejects cross-profile refresh and join without mutating a session", async () => {
  fixture.select.mockReturnValueOnce(query([live()]));
  await expect(
    refreshGameSession(token, "client", { id: "b".repeat(32), name: "Other" }),
  ).rejects.toMatchObject({ status: 403 });
  fixture.select.mockReturnValueOnce(query([live()]));
  await expect(
    joinMinecraft({
      accessToken: token,
      selectedProfile: "b".repeat(32),
      serverId: "123",
    }),
  ).rejects.toMatchObject({ status: 403 });
  expect(fixture.delete).not.toHaveBeenCalled();
  expect(fixture.values).not.toHaveBeenCalled();
});
it("fences a rename/logout racing join and bounds the join proof to 30 seconds", async () => {
  fixture.select
    .mockReturnValueOnce(query([live()]))
    .mockReturnValueOnce(query([]));
  await expect(
    joinMinecraft({
      accessToken: token,
      selectedProfile: compact,
      serverId: "123",
    }),
  ).rejects.toMatchObject({ status: 403 });
  fixture.select
    .mockReturnValueOnce(query([live()]))
    .mockReturnValueOnce(query([{ id: hashGameToken(token) }]))
    .mockReturnValueOnce(query([]));
  const start = Date.now();
  await joinMinecraft({
    accessToken: token,
    selectedProfile: compact,
    serverId: "123",
  });
  const value = fixture.values.mock.calls.at(-1)![0];
  expect(value.expiresAt.getTime()).toBeGreaterThanOrEqual(start + 30_000);
  expect(value.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 30_000);
});
it("fails closed for unsupported IP attestation and absent join proofs", async () => {
  expect(await hasJoinedMinecraft("Player", "123", "127.0.0.1")).toBeNull();
  expect(fixture.select).not.toHaveBeenCalled();
  expect(await hasJoinedMinecraft("Player", "123")).toBeNull();
});
it("consumes a matching live join proof once, with a fresh revocation check", async () => {
  const prepare = () =>
    fixture.select
      .mockReturnValueOnce(
        query([{ profileId: id, tokenHash: hashGameToken(token) }]),
      )
      .mockReturnValueOnce(query([{ clientToken: "client" }]))
      .mockReturnValueOnce(
        query([
          {
            subject: "central-user",
            sid: "central-session",
            revision: 2,
            current: 2,
          },
        ]),
      )
      .mockReturnValueOnce(
        query([{ id, name: "Player", userId: "owner", texturePublic: false }]),
      );
  prepare();
  fixture.delete.mockReturnValueOnce(query([{ id }]));
  expect(await hasJoinedMinecraft("Player", "123")).toMatchObject({
    id: compact,
    name: "Player",
  });
  expect(fixture.revoked).toHaveBeenCalledWith(
    "central-user",
    "central-session",
  );
  prepare();
  fixture.delete.mockReturnValueOnce(query([]));
  expect(await hasJoinedMinecraft("Player", "123")).toBeNull();
});
it("does not even read private skins when the profile has not opted in", async () => {
  fixture.select.mockReturnValueOnce(
    query([{ id, name: "Player", userId: "owner", texturePublic: false }]),
  );
  const result = await getSignedMinecraftProfile(compact);
  expect(fixture.select).toHaveBeenCalledTimes(1);
  expect(
    JSON.parse(Buffer.from(result!.properties[0].value, "base64").toString())
      .textures,
  ).toEqual({});
  expect(result!.properties[0].signature).toBe("fixture-signature");
});
it("signs only active published textures and guards the public PNG lookup with consent", async () => {
  fixture.select
    .mockReturnValueOnce(
      query([{ id, name: "Player", userId: "owner", texturePublic: true }]),
    )
    .mockReturnValueOnce(query([{ checksum: "a".repeat(64), model: "slim" }]));
  const result = await getSignedMinecraftProfile(compact, true);
  const texture = JSON.parse(
    Buffer.from(result!.properties[0].value, "base64").toString(),
  ).textures.SKIN;
  expect(texture).toEqual({
    url: "https://launcher.test/minecraft/texture/" + "a".repeat(64),
    metadata: { model: "slim" },
  });
  expect(result!.properties[0]).not.toHaveProperty("signature");
  const lookup = query([]);
  fixture.select.mockReturnValueOnce(lookup);
  expect(await getMinecraftTexture("a".repeat(64))).toBeNull();
  const filter = new PgDialect().sqlToQuery(lookup.where.mock.calls[0][0]);
  expect(filter.sql).toContain('"minecraft_profile"."texture_public"');
  expect(filter.params).toContain(true);
});
