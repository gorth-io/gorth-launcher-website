import { afterEach, expect, it, vi } from "vitest";
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

it("exposes six configured installer formats with no credentials", async () => {
  vi.stubEnv("NODE_ENV", "production");
  const entries = {
    DOWNLOAD_MACOS_ARM64_URL: "app-darwin-arm64.dmg",
    DOWNLOAD_MACOS_X64_URL: "app-darwin-x64.dmg",
    DOWNLOAD_WINDOWS_X64_URL: "app-win32-x64-setup.exe",
    DOWNLOAD_WINDOWS_X64_MSI_URL: "app-win32-x64-setup.msi",
    DOWNLOAD_LINUX_X64_URL: "app-linux-x64.deb",
    DOWNLOAD_LINUX_X64_RPM_URL: "app-linux-x64.rpm",
  };
  const base = "https://github.com/gorth-io/example/releases/download/v1.0.0/";
  for (const [key, file] of Object.entries(entries)) vi.stubEnv(key, base + file);
  const { getDownloads } = await import("@/services/download");
  const downloads = getDownloads();
  expect(downloads).toHaveLength(6);
  expect(new Set(downloads.map((entry) => entry.id)).size).toBe(6);
  expect(downloads.map((entry) => entry.url).sort()).toEqual(
    Object.values(entries).map((file) => base + file).sort());
});

it("rejects credential-bearing and insecure production download URLs", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("DOWNLOAD_WINDOWS_X64_MSI_URL", "https://token:secret@example.test/app.msi");
  vi.stubEnv("DOWNLOAD_LINUX_X64_RPM_URL", "http://localhost/app.rpm");
  const { getDownloads } = await import("@/services/download");
  expect(getDownloads().find((entry) => entry.id === "windows-x64-msi")?.url).toBeNull();
  expect(getDownloads().find((entry) => entry.id === "linux-x64-rpm")?.url).toBeNull();
});

