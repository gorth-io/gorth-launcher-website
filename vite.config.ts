import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { sameOriginHono } from "./configs/hono.ts";
import { vercelOutput } from "./configs/vercel.ts";

const root = path.dirname(fileURLToPath(import.meta.url));
const localServer = {
  host: "127.0.0.1",
  port: 5504,
  strictPort: true,
  cors: false,
} as const;
export default defineConfig({
  preview: localServer,
  resolve: { alias: { "@": root } },
  server: {
    ...localServer,
    watch: {
      ignored: ["**/pkg/**", "**/.vite/**", "**/dist/**", "**/.vercel/**"],
    },
  },
  // Native Vite application builder builds every declared environment.
  builder: {},
  environments: {
    client: {
      build: {
        outDir: "dist/client",
        copyPublicDir: false,
        rolldownOptions: {
          input: path.join(root, "public/index.html"),
        },
      },
    },
    ssr: {
      consumer: "server",
      build: {
        ssr: true,
        copyPublicDir: false,
        target: "node22",
        outDir: "dist/server",
        rolldownOptions: {
          input: {
            vercel: path.join(root, "app/vercel.ts"),
            node: path.join(root, "app/node.ts"),
          },
          external: ["pg-native"],
          output: {
            format: "es",
            entryFileNames: "[name].mjs",
            chunkFileNames: "[name]-[hash].mjs",
          },
        },
      },
    },
  },
  plugins: [sameOriginHono(root), vercelOutput(root)],
});
