import { useEffect, useRef, useState } from "react";
import { Button } from "@gorth/primitive/custom/button";
import { authClient } from "@/lib/auth/browser";
import { electronClientId } from "@/lib/auth/contract";

export function DesktopSignIn({ complete = false }: { complete?: boolean }) {
  const started = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (complete) {
      // The official proxy reads the short-lived Electron authorization cookie;
      // it never sends OAuth access/refresh tokens to this component.
      const timer = authClient.ensureElectronRedirect({ timeout: 120_000 });
      return () => clearInterval(timer);
    }
    if (started.current) return;
    const params = new URLSearchParams(window.location.search);
    const query = Object.fromEntries(
      ["client_id", "state", "code_challenge"].map((key) => [
        key,
        params.get(key) ?? "",
      ]),
    );
    if (
      query.client_id !== electronClientId ||
      !/^[A-Za-z0-9]{16}$/.test(query.state) ||
      !/^[A-Za-z0-9_-]{43}$/.test(query.code_challenge)
    ) {
      queueMicrotask(() =>
        setError("Invalid desktop sign-in request. Start again from the app."),
      );
      return;
    }
    started.current = true;
    async function signIn() {
      try {
        const result = await authClient.signIn.social({
          provider: "gorth",
          callbackURL: "/auth/desktop/complete",
          errorCallbackURL: "/auth/error",
          fetchOptions: { query },
        });
        if (result.error) throw new Error("Unable to connect to Gorth SSO.");
      } catch {
        setError("Unable to connect to Gorth SSO. Start again from the app.");
      }
    }
    void signIn();
  }, [complete]);
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-8" role="status">
      <h1 className="text-xl font-semibold">
        {complete ? "Returning to your desktop app" : "Connecting to Gorth SSO"}
      </h1>
      <p>
        {error ||
          (complete
            ? "Allow the browser to open your Gorth app. Your SSO account remains signed in."
            : "Choose the account you want to use in the desktop app.")}
      </p>
      {complete && (
        <Button
          onClick={() => {
            const timer = authClient.ensureElectronRedirect();
            setTimeout(() => clearInterval(timer), 10_000);
          }}
        >
          Open desktop app
        </Button>
      )}
    </main>
  );
}
