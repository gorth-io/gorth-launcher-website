import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import {
  desktopCallbackURL,
  startDesktopHandoff,
} from "@/lib/auth/desktop-handoff";
import { electronScheme } from "@/lib/auth/contract";
import { authClient } from "@/lib/auth/browser";

const code = Buffer.from(
  JSON.stringify({ identifier: "a".repeat(32), state: "B".repeat(16) }),
).toString("base64url");
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("uses only the configured native scheme and the exact callback path/fragment", () => {
  const url = new URL(desktopCallbackURL(code));
  expect(url.protocol).toBe(electronScheme + ":");
  expect(url.hostname + url.pathname).toBe("auth/callback");
  expect(url.search).toBe("");
  expect(url.hash).toBe("#token=" + code);
});
it.each([
  "javascript:alert(1)",
  "not-json",
  Buffer.from(
    JSON.stringify({ identifier: "session-token", state: "x" }),
  ).toString("base64url"),
  "x".repeat(4097),
])("rejects malformed authorization without launching: %s", (value) => {
  expect(() => desktopCallbackURL(value)).toThrow();
});
it("retains the native link after the official SDK cookie is cleared and an automatic launch is blocked", () => {
  vi.useFakeTimers();
  let cookie =
    "gorth." +
    (electronScheme.includes("browser") ? "gorth-browser" : "gorth-launcher") +
    "=" +
    code;
  vi.stubGlobal("document", {
    get cookie() {
      return cookie;
    },
  });
  let link = "";
  const open = vi.fn(() => {
    throw new Error("External protocol blocked without user gesture");
  });
  const error = vi.fn();
  const stop = startDesktopHandoff({
    readCode: () => authClient.electron.getAuthorizationCode(),
    clearCode: () => {
      cookie = "";
    },
    onReady: (value) => {
      link = value;
    },
    onError: error,
    open,
  });
  expect(cookie).toBe("");
  expect(authClient.electron.getAuthorizationCode()).toBeNull();
  expect(link).toBe(desktopCallbackURL(code));
  expect(open).toHaveBeenCalledOnce();
  expect(error).toHaveBeenCalledWith(
    expect.stringContaining("Click Open desktop app"),
  );
  // A real anchor can still use this in-memory href in the click's user gesture.
  vi.advanceTimersByTime(10_000);
  expect(link).toBe(desktopCallbackURL(code));
  vi.advanceTimersByTime(110_000);
  expect(link).toBe("");
  expect(error).toHaveBeenLastCalledWith(expect.stringContaining("expired"));
  stop();
});
it("polls only until the ticket arrives and cleans all timers on unmount", () => {
  vi.useFakeTimers();
  const readCode = vi.fn<() => string | null>().mockReturnValue(null);
  const ready = vi.fn();
  const open = vi.fn();
  const stop = startDesktopHandoff({
    readCode,
    clearCode: vi.fn(),
    onReady: ready,
    onError: vi.fn(),
    open,
  });
  vi.advanceTimersByTime(200);
  expect(open).not.toHaveBeenCalled();
  readCode.mockReturnValue(code);
  vi.advanceTimersByTime(100);
  expect(ready).toHaveBeenCalledWith(desktopCallbackURL(code));
  expect(open).toHaveBeenCalledOnce();
  stop();
  vi.advanceTimersByTime(120_000);
  expect(ready).toHaveBeenCalledOnce();
});
it("uses a direct anchor instead of restarting asynchronous redirect polling on click", () => {
  const component = readFileSync(
    new URL("../components/desktop-sign-in.tsx", import.meta.url),
    "utf8",
  );
  expect(component).toContain("render={<a href={desktopURL || undefined} />}");
  expect(component).toContain("disabled={!desktopURL}");
  expect(component).not.toContain("ensureElectronRedirect");
});
