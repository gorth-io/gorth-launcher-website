import { beforeEach, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
vi.mock("server-only", () => ({}));
vi.mock("@/utils/environment", () => ({
  minecraftSigningPrivateKeyBase64: "",
}));
const fixture = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  insert: vi.fn(),
  execute: vi.fn(),
}));
vi.mock("@/database", () => ({
  getDatabase: () => ({
    ...fixture,
    transaction: async (operation: (db: unknown) => Promise<unknown>) =>
      operation(fixture),
  }),
}));
import { updateProfile, changeFriend } from "@/services/profile-store";
function query(rows: unknown[]) {
  return Object.assign(Promise.resolve(rows), {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  fixture.select.mockReturnValue(query([]));
  fixture.update.mockReturnValue({ set: fixture.set });
  fixture.set.mockReturnValue(query([]));
  fixture.delete.mockReturnValue(query([]));
});
it("renames the same stable profile, increments revision and revokes its game sessions", async () => {
  fixture.select
    .mockReturnValueOnce(
      query([{ id: "stable-uuid", name: "Before", revision: 7 }]),
    )
    .mockReturnValueOnce(query([]));
  await updateProfile("owner", { action: "name", name: "After" });
  expect(fixture.set).toHaveBeenCalledWith(
    expect.objectContaining({ name: "After", revision: 8 }),
  );
  expect(fixture.delete).toHaveBeenCalledTimes(1);
  expect(fixture.set.mock.calls[0][0]).not.toHaveProperty("id");
  expect(fixture.set.mock.calls[0][0]).not.toHaveProperty("texturePublic");
});
it("rejects conflicting names before changing any game session", async () => {
  fixture.select
    .mockReturnValueOnce(query([{ id: "mine", name: "Before", revision: 0 }]))
    .mockReturnValueOnce(query([{ id: "theirs" }]));
  await expect(
    updateProfile("owner", { action: "name", name: "Taken" }),
  ).rejects.toMatchObject({ status: 409 });
  expect(fixture.update).not.toHaveBeenCalled();
  expect(fixture.delete).not.toHaveBeenCalled();
});
it("only changes publication through an explicit saved preference", async () => {
  fixture.select.mockReturnValueOnce(query([{ id: "profile" }]));
  await updateProfile("owner", {
    action: "preferences",
    preferences: {
      language: "en",
      allowFriendRequests: true,
      friendNotifications: true,
      publicSkin: true,
    },
  });
  expect(fixture.set).toHaveBeenCalledWith({ texturePublic: true });
  fixture.select.mockReturnValueOnce(query([]));
  await expect(
    updateProfile("other", {
      action: "preferences",
      preferences: {
        language: "en",
        allowFriendRequests: true,
        friendNotifications: true,
        publicSkin: true,
      },
    }),
  ).rejects.toMatchObject({ status: 409 });
});
it("restricts acceptance to the recipient and removal to participants", async () => {
  const acceptance = query([{ id: "friendship" }]);
  fixture.set.mockReturnValueOnce(acceptance);
  await changeFriend("recipient", "friendship", "accept");
  const compiled = new PgDialect().sqlToQuery(
    acceptance.where.mock.calls[0][0],
  );
  expect(compiled.sql).toContain('"friendship"."recipient_id"');
  expect(compiled.params).toContain("recipient");
  expect(compiled.params).toContain("requested");
  const removal = query([]);
  fixture.delete.mockReturnValueOnce(removal);
  await expect(
    changeFriend("outsider", "friendship", "remove"),
  ).rejects.toMatchObject({ status: 404 });
  const filter = new PgDialect().sqlToQuery(removal.where.mock.calls[0][0]);
  expect(filter.sql).toContain('"friendship"."requester_id"');
  expect(filter.sql).toContain('"friendship"."recipient_id"');
  expect(filter.params).toContain("outsider");
});
