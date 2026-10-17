import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  envDir: false,
  cacheDir: ".vite/tests",
  define: {
    __GORTH_PUBLIC_COOKIE_PREFIX__: JSON.stringify("gorth"),
    __GORTH_PUBLIC_AUTH_URL__: JSON.stringify("http://localhost:3000"),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./lib/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
    fileParallelism: false,
    testTimeout: 15000,
  },
});
