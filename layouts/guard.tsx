import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  useNavigate,
  useLocation,
} from "@gorth/primitive/cores/tanstack/router";
import { authClient } from "@/lib/auth/browser";
import { Button } from "@gorth/primitive/custom/button";

function SignInNavigation({ returnTo }: { returnTo: string }) {
  const navigate = useNavigate();
  const started = useRef(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    // A router update can render this guard again before the destination mounts.
    // Commit only once; never nest the sign-in URL inside its own returnTo.
    if (started.current) return;
    started.current = true;
    async function redirect() {
      try {
        await navigate({
          to: "/auth/sign-in",
          search: { returnTo },
          replace: true,
        });
      } catch {
        setFailed(true);
      }
    }
    void redirect();
  }, [navigate, returnTo]);
  return (
    <p role={failed ? "alert" : "status"} className="p-6">
      {failed
        ? "Unable to open sign in. Please reload this page."
        : "Opening sign in…"}
    </p>
  );
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { data, isPending, error, refetch } = authClient.useSession();
  const returnTo = useLocation({ select: (location) => location.href });
  if (isPending)
    return (
      <p role="status" className="p-6">
        Loading account…
      </p>
    );
  if (error)
    return (
      <div role="alert" className="space-y-3 p-6">
        <p>Unable to check your session. Please try again.</p>
        <Button onClick={() => void refetch()}>Try again</Button>
      </div>
    );
  // UI guard only. Every protected Hono endpoint verifies the native session.
  if (!data) return <SignInNavigation returnTo={returnTo} />;
  return children;
}
