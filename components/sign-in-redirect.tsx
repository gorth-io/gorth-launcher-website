import { useEffect, useRef, useState } from "react";
import { signIn, SignInButton } from "@/components/auth-actions";
import { Spinner } from "@gorth/primitive/pattern/spinner";

export function SignInRedirect({ returnTo }: { returnTo: string }) {
  const started = useRef(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function start() {
      try {
        await signIn(returnTo);
      } catch {
        setError(true);
      }
    }
    void start();
  }, [returnTo]);
  return (
    <div
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-6 text-center"
      role="status"
    >
      {!error && <Spinner variant="infinite" className="size-8" />}
      <p>
        {error ? "Unable to connect to Gorth SSO." : "Connecting to Gorth SSO…"}
      </p>
      {error && <SignInButton returnTo={returnTo} label="Try again" />}
    </div>
  );
}
