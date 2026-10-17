import { describe, expect, it } from "vitest";
import {
  authPagePaths,
  backendPathPrefixes,
  backendExactPaths,
  createDeploymentRoutes,
  isBackendPath,
} from "@/app/routing";

describe("same-origin React/Hono routing", () => {
  it("serves only the explicit auth screens as SPA documents", () => {
    for (const path of authPagePaths) {
      expect(isBackendPath(path)).toBe(false);
      expect(isBackendPath(path + "/")).toBe(false);
    }
    for (const path of [
      "/auth/callback/gorth",
      "/auth/get-session",
      "/auth/electron/authorize",
      "/auth/sign-out",
      "/auth/unknown",
      ...backendExactPaths,
    ])
      expect(isBackendPath(path)).toBe(true);
    for (const prefix of backendPathPrefixes)
      expect(isBackendPath("/" + prefix + "/missing")).toBe(true);
    for (const path of [
      "/",
      "/download",
      "/account",
      "/account/settings",
      "/assets/missing.js",
    ])
      expect(isBackendPath(path)).toBe(false);
  });
  it("routes Vercel auth endpoints before filesystem and SPA fallback", () => {
    const routes = createDeploymentRoutes();
    function target(path: string) {
      return routes.find(
        (route) =>
          route.src &&
          !route.continue &&
          new RegExp("^" + route.src + "$").test(path),
      );
    }
    for (const path of authPagePaths)
      expect(target(path)?.dest).toBe("/public/index.html");
    for (const prefix of backendPathPrefixes)
      expect(target("/" + prefix + "/missing")?.dest).toBe("/__server");
    for (const path of backendExactPaths)
      expect(target(path)?.dest).toBe("/__server");
    expect(target("/auth/callback/gorth")?.dest).toBe("/__server");
    expect(target("/assets/missing.js")?.status).toBe(404);
    expect(target("/account")?.dest).toBe("/public/index.html");
    expect(
      routes.findIndex((route) => route.dest === "/__server"),
    ).toBeLessThan(routes.findIndex((route) => route.handle === "filesystem"));
  });
});
