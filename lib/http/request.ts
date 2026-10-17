import "server-only";
import { getUser } from "@/services/session";
import { assertSameOrigin, getAuthConfig } from "@/lib/auth/config";
export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function requireUser(request: Request, mutation = false) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" ||
      (origin && origin !== getAuthConfig().origin))
    throw new RequestError(403, "Request origin is not allowed.");
  if (mutation) {
    try {
      assertSameOrigin(request);
    } catch {
      throw new RequestError(403, "Request origin is not allowed.");
    }
  }
  const user = await getUser(mutation, request.headers);
  if (!user) throw new RequestError(401, "Sign in with Gorth to continue.");
  return user;
}
export async function readBody(request: Request, maximum: number) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maximum) throw new RequestError(413, "The file is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "A request body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) {
        await reader.cancel();
        throw new RequestError(413, "The file is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
export async function readJson(request: Request, maximum: number) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
    throw new RequestError(415, "Use application/json.");
  const bytes = await readBody(request, maximum);
  try {
    return JSON.parse(bytes.toString("utf8")) as unknown;
  } catch {
    throw new RequestError(400, "Invalid JSON document.");
  }
}
