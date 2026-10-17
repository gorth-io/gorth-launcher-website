import { useNavigate } from "@gorth/primitive/cores/tanstack/router";

import type {
  AuthSidebarProps,
  UserProps,
} from "@gorth/primitive/utils/interface";
import { toast } from "@gorth/primitive/custom/toast";
import { useAuthAccount } from "@/services/auth";
import { authClient } from "@/lib/auth/browser";
import { resetCallerAuthentication } from "@/lib/auth/client";

export function useNavigation(): { user: UserProps; auth: AuthSidebarProps } {
  const navigate = useNavigate();
  const { data, isPending } = useAuthAccount();
  function login(returnTo = "/account") {
    void navigate({ to: "/auth/sign-in", search: { returnTo } });
  }
  return {
    user: data?.user
      ? {
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.image,
        }
      : { name: "Visitor", email: "visitor@gorth.org", avatar: null },
    auth: {
      loading: isPending,
      authenticated: Boolean(data?.user),
      login,
      register: login,
      async logout() {
        try {
          const result = await authClient.signOut();
          if (result.error) throw new Error("Sign out failed");
          resetCallerAuthentication();
          window.location.replace("/");
        } catch {
          toast.add({
            type: "error",
            title: "Unable to sign out",
            description: "Please try again.",
          });
        }
      },
    },
  };
}
