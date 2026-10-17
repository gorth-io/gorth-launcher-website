import "server-only";
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
} from "node:crypto";
import { minecraftSigningPrivateKeyBase64 } from "@/utils/environment";
import { RequestError } from "@/lib/http/request";

export function minecraftKey() {
  if (!minecraftSigningPrivateKeyBase64)
    throw new RequestError(503, "Minecraft texture signing is not configured.");
  try {
    const key = createPrivateKey(
      Buffer.from(minecraftSigningPrivateKeyBase64, "base64").toString("utf8"),
    );
    if (
      key.asymmetricKeyType !== "rsa" ||
      (key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048
    )
      throw new Error("invalid RSA key");
    return key;
  } catch {
    throw new RequestError(
      503,
      "Minecraft signing key must be a valid RSA private key of at least 2048 bits.",
    );
  }
}
export function minecraftPublicKey() {
  return createPublicKey(minecraftKey())
    .export({ type: "spki", format: "pem" })
    .toString();
}
export function signTexture(value: string) {
  // SHA1withRSA is required by the Yggdrasil texture protocol, not used for passwords or token storage.
  return sign("RSA-SHA1", Buffer.from(value), minecraftKey()).toString(
    "base64",
  );
}
export function hashGameToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
