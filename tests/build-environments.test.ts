import { access, readFile } from "node:fs/promises";
import { afterEach, expect, it, vi } from "vitest";
import { resolveConfig } from "vite";
import config from "../vite.config";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("uses the native Vite app builder with isolated client and SSR outputs", () => {
  expect(config.builder).toEqual({});
  expect(Object.keys(config.environments ?? {})).toEqual(["client", "ssr"]);
  expect(config.environments?.client?.build?.outDir).toBe("dist/client");
  expect(config.environments?.ssr?.build?.outDir).toBe("dist/server");
  expect(config.environments?.ssr?.consumer).toBe("server");
  expect(config.environments?.ssr?.build?.rolldownOptions?.input).toMatchObject(
    {
      node: expect.stringContaining("app/node.ts"),
      vercel: expect.stringContaining("app/vercel.ts"),
    },
  );
});

it("loads only public compile-time metadata through Vite's environment loader", async () => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("SESSION_SECRET", "private-resolved-config-fixture");
  vi.stubEnv(
    "MINECRAFT_SIGNING_PRIVATE_KEY_BASE64",
    "private-resolved-key-fixture",
  );
  vi.stubEnv("OAUTH_COOKIE_PREFIX", "native-prefix-fixture");
  vi.stubEnv("VITE_PUBLIC_AUTH_URL", "https://sso.example.test");
  const resolved = await resolveConfig(
    {
      configFile: new URL("../vite.config.ts", import.meta.url).pathname,
      configLoader: "runner",
      envDir: false,
    },
    "build",
    "production",
    "production",
  );
  expect(resolved.envPrefix).toBeUndefined();
  expect(resolved.env.VITE_PUBLIC_AUTH_URL).toBe("https://sso.example.test");
  expect(resolved.env).not.toHaveProperty("SESSION_SECRET");
  expect(resolved.env).not.toHaveProperty(
    "MINECRAFT_SIGNING_PRIVATE_KEY_BASE64",
  );
  expect(resolved.define?.__GORTH_PUBLIC_COOKIE_PREFIX__).toBe(
    JSON.stringify("native-prefix-fixture"),
  );
  expect(JSON.stringify(resolved.define)).not.toContain("private-resolved-");
});

it("calls Vite directly without legacy build scripts or a second config file", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  expect(manifest.scripts.build).toMatch(/^vite build(?: |$)/);
  for (const file of [
    "rolldown.config.ts",
    "scripts/build.mjs",
    "scripts/vercel-output.mjs",
  ]) {
    await expect(
      access(new URL("../" + file, import.meta.url)),
    ).rejects.toMatchObject({ code: "ENOENT" });
  }
});
