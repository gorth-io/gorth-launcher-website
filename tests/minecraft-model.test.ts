import { beforeEach, expect, it, vi } from "vitest";
import { generateKeyPairSync, verify } from "node:crypto";
vi.mock("server-only", () => ({}));
const config = vi.hoisted(() => ({ key: "" }));
vi.mock("@/utils/environment", () => ({
  get minecraftSigningPrivateKeyBase64() {
    return config.key;
  },
}));
import {
  hashGameToken,
  minecraftPublicKey,
  signTexture,
} from "@/lib/minecraft/keys";
import { skinParts, skinFaces } from "@/utils/skin-model";
import {
  minecraftNameSchema,
  profilePreferencesSchema,
} from "@/schemas/profile";
import {
  gameTokenSchema,
  gameUuidSchema,
  gameHasJoinedSchema,
} from "@/schemas/minecraft";
beforeEach(() => {
  config.key = "";
});
it("defaults to private skins and validates protocol identifiers without trailing newlines", () => {
  expect(profilePreferencesSchema.parse({}).publicSkin).toBe(false);
  for (const name of ["ab", "has space", "Bình", "valid\n", "x".repeat(17)])
    expect(minecraftNameSchema.safeParse(name).success).toBe(false);
  expect(minecraftNameSchema.parse("Gorth_Player_1")).toBe("Gorth_Player_1");
  expect(gameTokenSchema.safeParse("a".repeat(43) + "\n").success).toBe(false);
  expect(gameUuidSchema.safeParse("a".repeat(32) + "\n").success).toBe(false);
  expect(
    gameHasJoinedSchema.safeParse({ username: "User", serverId: "123\n" })
      .success,
  ).toBe(false);
});
it("keeps all six cube faces within modern and legacy texture atlases", () => {
  for (const [slim, legacy] of [
    [false, false],
    [true, false],
    [false, true],
  ]) {
    for (const part of skinParts(slim, legacy)) {
      const faces = skinFaces(part);
      expect(faces).toHaveLength(6);
      for (const face of faces) {
        expect(face.u).toBeGreaterThanOrEqual(0);
        expect(face.v).toBeGreaterThanOrEqual(0);
        expect(face.u + face.w).toBeLessThanOrEqual(64);
        expect(face.v + face.h).toBeLessThanOrEqual(legacy ? 32 : 64);
      }
    }
  }
  expect(
    skinParts(true, false).find((part) => part.name === "left-arm")?.w,
  ).toBe(3);
  expect(
    skinParts(false, true).find((part) => part.name === "left-leg")?.mirror,
  ).toBe(true);
});
it("requires a configured strong RSA key; no generated fallback is published", () => {
  expect(() => minecraftPublicKey()).toThrow("not configured");
  config.key = Buffer.from("not-a-key").toString("base64");
  expect(() => minecraftPublicKey()).toThrow("valid RSA");
  config.key = Buffer.from(
    generateKeyPairSync("rsa", { modulusLength: 1024 })
      .privateKey.export({ type: "pkcs8", format: "pem" })
      .toString(),
  ).toString("base64");
  expect(() => minecraftPublicKey()).toThrow("2048");
});
it("signs texture properties with the protocol RSA signature and hashes tokens separately with SHA256", () => {
  config.key = Buffer.from(
    generateKeyPairSync("rsa", { modulusLength: 2048 })
      .privateKey.export({ type: "pkcs8", format: "pem" })
      .toString(),
  ).toString("base64");
  const value = Buffer.from('{"textures":{}}').toString("base64"),
    signature = signTexture(value);
  expect(
    verify(
      "RSA-SHA1",
      Buffer.from(value),
      minecraftPublicKey(),
      Buffer.from(signature, "base64"),
    ),
  ).toBe(true);
  expect(
    verify(
      "RSA-SHA1",
      Buffer.from(value + "tampered"),
      minecraftPublicKey(),
      Buffer.from(signature, "base64"),
    ),
  ).toBe(false);
  expect(hashGameToken("fixture-token")).toHaveLength(64);
  expect(hashGameToken("fixture-token")).not.toContain("fixture");
});
