export function resolveInternalPath(value: unknown, fallback = "/account") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\\\s]/.test(value)
  )
    return fallback;
  try {
    const origin = "https://internal.invalid";
    const url = new URL(value, origin);
    return url.origin === origin && !url.pathname.startsWith("/auth/")
      ? url.pathname + url.search + url.hash
      : fallback;
  } catch {
    return fallback;
  }
}
