import { useQueryClient } from "@gorth/primitive/cores/tanstack/query";
import { useCallerQuery, useCallerMutation } from "@/utils/caller";
import type {
  UserProfileResponse,
  ProfileUpdate,
  FriendRow,
} from "@/schemas/profile";
export function useProfile() {
  return useCallerQuery<UserProfileResponse>({
    url: "/profile",
    queryKey: ["minecraft-profile"],
    queryOptions: { retry: false },
  });
}
export function useProfileMutation() {
  const queries = useQueryClient();
  return useCallerMutation<UserProfileResponse, ProfileUpdate>({
    url: "/profile",
    method: "PATCH",
    mapVariables: (body, options) => ({ ...options, body }),
    mutationOptions: {
      onSuccess: () =>
        queries.invalidateQueries({ queryKey: ["minecraft-profile"] }),
    },
  });
}
export function useFriends() {
  return useCallerQuery<{ items: FriendRow[] }>({
    url: "/profile/friend",
    queryKey: ["minecraft-friend"],
    queryOptions: { retry: false },
  });
}
export function useFriendMutation() {
  const queries = useQueryClient();
  return useCallerMutation<
    unknown,
    { name: string } | { id: string; action: "accept" | "remove" }
  >({
    url: "/profile/friend",
    mapVariables: (body, options) => ({
      ...options,
      method: "name" in body ? "POST" : "PATCH",
      body,
    }),
    mutationOptions: {
      onSuccess: () =>
        queries.invalidateQueries({ queryKey: ["minecraft-friend"] }),
    },
  });
}
