import { useLocation } from "@gorth/primitive/cores/tanstack/router";
import { SignInRedirect } from "@/components/sign-in-redirect";
import { resolveInternalPath } from "@/utils/formatter";
export default function SignInPage() {
  const search = useLocation({ select: (location) => location.searchStr });
  const target = resolveInternalPath(
    new URLSearchParams(search).get("returnTo"),
  );
  return <SignInRedirect returnTo={target} />;
}
