import "server-only";
import { electronScheme } from "@/lib/auth/contract";
import { RequestError } from "@/lib/http/request";
import { getAuth } from "@/lib/auth/server";
import { getUser } from "@/services/session";

// An origin is a CSRF boundary, not authentication. Native cookies still have to
// pass Better Auth and the app's fresh identity/revocation checks.
export async function getNativeMinecraftIdentity(request: Request) {
  if (
    request.headers.get("origin") !== electronScheme + ":/" ||
    request.headers.has("sec-fetch-site")
  )
    throw new RequestError(
      403,
      "This endpoint is restricted to the native Gorth Launcher.",
    );
  const user = await getUser(true, request.headers);
  if (!user) throw new RequestError(401, "Sign in with Gorth Launcher first.");
  const current = await getAuth().api.getSession({
    headers: request.headers,
    query: { disableCookieCache: true },
  });
  if (!current || current.user.id !== user.id || !current.session.ssoSessionId)
    throw new RequestError(401, "The native session is no longer valid.");
  return { user, nativeSession: current.session };
}
