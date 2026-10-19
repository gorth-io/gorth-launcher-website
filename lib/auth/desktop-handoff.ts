import { electronScheme } from "@/lib/auth/contract";

// Only an opaque, short-lived, PKCE-bound Electron ticket enters this URL.
// The native SDK still validates state, expiry, single-use consumption and PKCE.
export function desktopCallbackURL(code: string): string {
  if (code.length > 4096) throw new Error("Invalid desktop authorization.");
  const decoded = decodeURIComponent(code);
  if (!/^[A-Za-z0-9_-]+$/.test(decoded))
    throw new Error("Invalid desktop authorization.");
  const payload: unknown = JSON.parse(
    atob(decoded.replaceAll("-", "+").replaceAll("_", "/")),
  );
  if (
    !payload ||
    typeof payload !== "object" ||
    Object.keys(payload).sort().join(",") !== "identifier,state" ||
    !("identifier" in payload) ||
    typeof payload.identifier !== "string" ||
    !/^[A-Za-z0-9]{32}$/.test(payload.identifier) ||
    !("state" in payload) ||
    typeof payload.state !== "string" ||
    !/^[A-Za-z0-9_-]{16,128}$/.test(payload.state)
  )
    throw new Error("Invalid desktop authorization.");
  return electronScheme + "://auth/callback#token=" + decoded;
}

interface DesktopHandoffOptions {
  readCode: () => string | null;
  clearCode: () => void;
  onReady: (url: string) => void;
  onError: (message: string) => void;
  open: (url: string) => void;
}
export function startDesktopHandoff(options: DesktopHandoffOptions) {
  let captured = false;
  const poll = setInterval(check, 100);
  const expiry = setTimeout(() => {
    clearInterval(poll);
    options.onReady("");
    options.onError(
      "Desktop sign-in expired or no authorization code was received. Start again from the app.",
    );
  }, 120_000);
  function check() {
    try {
      const code = options.readCode();
      if (!code || captured) return;
      const url = desktopCallbackURL(code);
      captured = true;
      clearInterval(poll);
      // Publish and retain the link BEFORE consuming the cookie or attempting
      // navigation. A blocked automatic launch must not destroy the retry path.
      options.onReady(url);
      try {
        options.clearCode();
        options.open(url);
      } catch {
        options.onError(
          "Your browser blocked opening the app automatically. Click Open desktop app.",
        );
      }
    } catch {
      clearInterval(poll);
      clearTimeout(expiry);
      options.onError(
        "Invalid desktop authorization. Start again from the app.",
      );
    }
  }
  check();
  return () => {
    clearInterval(poll);
    clearTimeout(expiry);
  };
}
