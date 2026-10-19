import { useEffect, useRef, useState } from "react";
import { Button } from "@gorth/primitive/custom/button";
import { authClient } from "@/lib/auth/browser";
import { electronClientId } from "@/lib/auth/contract";
import { oauthCookiePrefix } from "@/utils/client-environment";
import { startDesktopHandoff } from "@/lib/auth/desktop-handoff";

export function DesktopSignIn({ complete = false }: { complete?: boolean }) {
  const started = useRef(false);
  const [error, setError] = useState("");
  const [desktopURL, setDesktopURL] = useState("");
  useEffect(() => {
    if (complete) {
      return startDesktopHandoff({
        readCode: () => authClient.electron.getAuthorizationCode(),
        clearCode: () => {
          document.cookie =
            oauthCookiePrefix +
            "." +
            electronClientId +
            "=; Max-Age=0; Path=/; SameSite=Lax" +
            (window.location.protocol === "https:" ? "; Secure" : "");
        },
        onReady: setDesktopURL,
        onError: setError,
        open: (url) => window.location.replace(url),
      });
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
          nativeButton={false}
          disabled={!desktopURL}
          render={<a href={desktopURL || undefined} />}
        >
          Open desktop app
        </Button>
      )}
    </main>
  );
}
