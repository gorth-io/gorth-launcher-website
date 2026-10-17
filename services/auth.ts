import { authClient } from "@/lib/auth/browser";

export async function me() {
  const result = await authClient.getSession();
  if (result.error) throw new Error("Account service is unavailable");
  return result.data?.user ?? null;
}
export function useAuthAccount() {
  const { data, isPending, error } = authClient.useSession();
  return {
    data: data ? { user: data.user } : undefined,
    isPending,
    isError: Boolean(error),
  };
}
