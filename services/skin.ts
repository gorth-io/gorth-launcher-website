import { useQueryClient } from "@gorth/primitive/cores/tanstack/query";
import { useCallerQuery, useCallerMutation } from "@/utils/caller";
import type { SkinSummary } from "@/schemas/skin";
const key = ["account", "skin"] as const;
export function useSkins() {
  return useCallerQuery<{ items: SkinSummary[] }>({
    url: "/skin",
    queryKey: key,
    queryOptions: { retry: false },
  });
}
export function useSkinMutation() {
  const queries = useQueryClient();
  return useCallerMutation<
    unknown,
    | { action: "upload"; data: FormData }
    | { action: "activate" | "delete"; id: string }
  >({
    url: "/skin",
    mapVariables: (input, options) => ({
      ...options,
      ...(input.action === "upload"
        ? { url: "/skin", method: "POST", body: input.data }
        : input.action === "activate"
          ? { url: "/skin/active", method: "POST", body: { id: input.id } }
          : { url: "/skin", method: "DELETE", params: { id: input.id } }),
    }),
    mutationOptions: {
      onSuccess: () => queries.invalidateQueries({ queryKey: key }),
    },
  });
}
