// Shared URL contract for Vite, local Node and Vercel; no UI or secrets.
export const authPagePaths = [
  "/auth/sign-in",
  "/auth/desktop",
  "/auth/desktop/complete",
  "/auth/error",
];
export const backendPathPrefixes = ["auth", "profile", "skin", "minecraft"];
export const backendExactPaths = [
  "/health",
  "/download/catalog",
  "/robots.txt",
  "/sitemap.xml",
];
export function isBackendPath(pathname: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  if (authPagePaths.includes(path)) return false;
  return (
    backendExactPaths.includes(path) ||
    backendPathPrefixes.some(
      (prefix) => path === "/" + prefix || path.startsWith("/" + prefix + "/"),
    )
  );
}
export function createDeploymentRoutes() {
  return [
    {
      src: "/.*",
      headers: {
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "same-origin",
      },
      continue: true,
    },
    {
      src: "/auth(?:/.*)?",
      headers: {
        "Referrer-Policy": "no-referrer",
        "Cache-Control": "no-store",
      },
      continue: true,
    },
    {
      src: "/(?:account|group|workspace)(?:/.*)?",
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store",
      },
      continue: true,
    },
    {
      src: "/auth/(?:sign-in|desktop(?:/complete)?|error)/?",
      dest: "/public/index.html",
    },
    { src: "/(?:auth|profile|skin|minecraft)(?:/.*)?", dest: "/__server" },
    {
      src: "/(?:health|download/catalog|robots\\.txt|sitemap\\.xml)",
      dest: "/__server",
    },
    { handle: "filesystem" },
    { src: "/assets/.*", status: 404 },
    { src: "/.*", dest: "/public/index.html" },
  ];
}
