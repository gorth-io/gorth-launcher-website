export const nodeEnv = process.env.NODE_ENV;

// Only the Node-side Vite dev server calls this; never expose these values via define.
export function applyDevelopmentEnvironment(values: Record<string, string>) {
  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function resolveDatabaseUrl(values: Record<string, string>) {
  return process.env.DATABASE_URL || values.DATABASE_URL;
}
export const appUrl = process.env.VITE_PUBLIC_APP_URL!;
export const authUrl = process.env.VITE_PUBLIC_AUTH_URL;
export const oauthClientId = process.env.VITE_PUBLIC_OAUTH_CLIENT_ID;
export const sessionSecret = process.env.SESSION_SECRET;
export const minecraftSigningPrivateKeyBase64 =
  process.env.MINECRAFT_SIGNING_PRIVATE_KEY_BASE64;
export const sessionMaxAgeSeconds = process.env.SESSION_MAX_AGE_SECONDS;
export const databaseUrl = process.env.DATABASE_URL;
export const releaseVersion = process.env.RELEASE_VERSION;
export const downloadMacosArm64Url = process.env.DOWNLOAD_MACOS_ARM64_URL;
export const downloadMacosX64Url = process.env.DOWNLOAD_MACOS_X64_URL;
export const downloadWindowsX64Url = process.env.DOWNLOAD_WINDOWS_X64_URL;
export const downloadWindowsX64MsiUrl = process.env.DOWNLOAD_WINDOWS_X64_MSI_URL;
export const downloadLinuxX64Url = process.env.DOWNLOAD_LINUX_X64_URL;
export const downloadLinuxX64RpmUrl = process.env.DOWNLOAD_LINUX_X64_RPM_URL;

export const oauthAudience = process.env.OAUTH_AUDIENCE;
export const oauthNotifyAudience = process.env.OAUTH_NOTIFY_AUDIENCE;
export const oauthResourceAudience = process.env.OAUTH_RESOURCE_AUDIENCE;
export const oauthDiscoveryAudience = process.env.OAUTH_DISCOVERY_AUDIENCE;
export const oauthPaymentAudience = process.env.OAUTH_PAYMENT_AUDIENCE;
export const oauthBillingAudience = process.env.OAUTH_BILLING_AUDIENCE;
export const oauthMediaAudience = process.env.OAUTH_MEDIA_AUDIENCE;
export const oauthInsightAudience = process.env.OAUTH_INSIGHT_AUDIENCE;
export const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED === "true";
export const oauthCookiePrefix = process.env.OAUTH_COOKIE_PREFIX ?? "";

export const port = process.env.PORT;

// Called by Vite build configuration; runtime environment stays deployment-owned.
export function prepareProductionBuild() {
  process.env.NODE_ENV = "production";
}
