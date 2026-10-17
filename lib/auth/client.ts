import { authClient } from "@/lib/auth/browser";
import axios from "@gorth/structure/cores/axios";
import { createAuthRetry } from "@gorth/structure/modules/auth/client";

const retry = createAuthRetry({
  refresh: refreshAuthentication,
  getStatus: (error) =>
    axios.isAxiosError(error) ? error.response?.status : undefined,
});

export function resetCallerAuthentication() {
  retry.reset();
}

export function withAuthRetry<T>(
  request: () => Promise<T>,
  _getStatus: (error: unknown) => number | undefined,
  enabled = true,
) {
  return retry.withAuthRetry(request, { enabled });
}

// The shared client coordinates overlapping reads and ignores late results
// after logout. It stores public app-session data only, never OAuth credentials.
export async function refreshAuthentication() {
  try {
    const result = await authClient.getSession();
    return !result.error && Boolean(result.data);
  } catch {
    return false;
  }
}
