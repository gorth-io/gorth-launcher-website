import "server-only";
import type { Context } from "hono";
import type { ApiEnv } from "@/utils/interface";
import { verifyLogoutToken, endSsoSessions, AuthError } from "@/services/sso";

export async function backchannelLogout(context: Context<ApiEnv>) {
  const request = context.req.raw;
  let verified = false;
  context.header("Cache-Control", "no-store");
  try {
    if (
      !request.headers
        .get("content-type")
        ?.startsWith("application/x-www-form-urlencoded")
    )
      return context.json({ error: "invalid_request" }, 400);
    const reader = request.body?.getReader();
    if (!reader) return context.json({ error: "invalid_request" }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > 32768) {
          await reader.cancel();
          return context.json({ error: "invalid_request" }, 413);
        }
        chunks.push(part.value);
      }
    } finally {
      reader.releaseLock();
    }
    const form = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
    const token = form.get("logout_token");
    if (
      !token ||
      form.getAll("logout_token").length !== 1 ||
      token.length > 16384
    )
      return context.json({ error: "invalid_request" }, 400);
    const logout = await verifyLogoutToken(token);
    verified = true;
    await endSsoSessions(logout);
    return context.body(null, 200);
  } catch (error) {
    const unavailable =
      verified ||
      !(error instanceof AuthError) ||
      error.code === "unavailable" ||
      error.code === "invalid_configuration";
    return context.json(
      { error: unavailable ? "session_unavailable" : "invalid_logout_token" },
      unavailable ? 503 : 400,
    );
  }
}
