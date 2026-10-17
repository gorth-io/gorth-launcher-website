import { useState } from "react";
import { Button } from "@gorth/primitive/custom/button";
import { authClient } from "@/lib/auth/browser";
import { resetCallerAuthentication } from "@/lib/auth/client";
import { resolveInternalPath } from "@/utils/formatter";

export async function signIn(returnTo: unknown = "/account") {
  const result = await authClient.signIn.social({
    provider: "gorth",
    callbackURL: resolveInternalPath(returnTo),
    errorCallbackURL: "/auth/error",
  });
  if (result.error) throw new Error("Unable to reach Gorth SSO");
}

export function SignInButton({
  returnTo = "/account",
  label = "Sign in",
  disabled = false,
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div>
      <Button
        variant="outline"
        disabled={disabled || pending}
        onClick={async () => {
          setPending(true);
          setError(false);
          try {
            await signIn(returnTo);
          } catch {
            setError(true);
            setPending(false);
          }
        }}
      >
        {pending ? "Connecting…" : label}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          Unable to sign in. Please try again.
        </p>
      )}
    </div>
  );
}

export function SignOutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div>
      <Button
        variant="outline"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(false);
          try {
            const result = await authClient.signOut();
            if (result.error) throw new Error("Sign out failed");
            resetCallerAuthentication();
            window.location.replace("/");
          } catch {
            setError(true);
            setPending(false);
          }
        }}
      >
        Sign out
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          Unable to sign out. Please try again.
        </p>
      )}
    </div>
  );
}
