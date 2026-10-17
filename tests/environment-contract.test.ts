import { readFile } from "node:fs/promises";
import { afterEach, expect, it, vi } from "vitest";
import { resolveConfig } from "vite";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("reads every key declared in the maintained env example", async () => {
  const example = await readFile(
    new URL("../.env.example", import.meta.url),
    "utf8",
  );
  const keys = [...example.matchAll(/^([A-Z][A-Z0-9_]+)=/gm)].map(
    (match) => match[1],
  );
  expect(keys.length).toBeGreaterThan(15);
  const fixtures = keys.map((key, index) => ({
    key,
    value: "environment-contract-fixture-" + index,
  }));
  for (const { key, value } of fixtures) vi.stubEnv(key, value);
  vi.resetModules();
  const environment = await import("@/utils/environment");
  for (const { key, value } of fixtures) {
    if (key === "RATE_LIMIT_ENABLED")
      expect(environment.rateLimitEnabled).toBe(false);
    else expect(Object.values(environment)).toContain(value);
  }
});

it("restricts Vite automatic exposure and keeps server secrets out of define", async () => {
  vi.stubEnv("SESSION_SECRET", "private-session-fixture-not-for-browser");
  vi.stubEnv(
    "MINECRAFT_SIGNING_PRIVATE_KEY_BASE64",
    "private-key-fixture-not-for-browser",
  );
  vi.stubEnv("DATABASE_URL", "postgresql://private-fixture.invalid/database");
  vi.resetModules();
  const { default: config } = await import("../vite.config");
  expect(config.envPrefix).toBeUndefined();
  const resolved = await resolveConfig(
    { ...config, configFile: false, envDir: false },
    "serve",
    "test",
  );
  const publicConfiguration = JSON.stringify(resolved.define);
  expect(publicConfiguration).not.toContain("private-session-fixture");
  expect(publicConfiguration).not.toContain("private-key-fixture");
  expect(publicConfiguration).not.toContain("private-fixture.invalid");
});
