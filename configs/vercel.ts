import path from "node:path";
import { access, cp, mkdir, rm, writeFile } from "node:fs/promises";
import type { Plugin } from "vite";
import { createDeploymentRoutes } from "../app/routing.ts";

export function vercelOutput(root: string): Plugin {
  return {
    name: "gorth-vercel-output",
    apply: "build",
    applyToEnvironment: (environment) => environment.name === "ssr",
    async writeBundle() {
      // Vite's default builder builds client then ssr. writeBundle runs only
      // after the server chunks are successfully written, never on a dry run.
      const client = path.join(root, "dist/client");
      const server = path.join(root, "dist/server");
      await access(path.join(client, "public/index.html"));
      await access(path.join(server, "vercel.mjs"));
      const output = path.join(root, ".vercel/output");
      await rm(output, { recursive: true, force: true });
      const fn = path.join(output, "functions/__server.func");
      await mkdir(fn, { recursive: true });
      await cp(client, path.join(output, "static"), { recursive: true });
      await cp(server, fn, { recursive: true });
      await writeFile(
        path.join(fn, ".vc-config.json"),
        JSON.stringify({
          runtime: "nodejs24.x",
          handler: "vercel.mjs",
          launcherType: "Nodejs",
          // Hono consumes the raw body; Vercel helpers previously caused POST timeouts.
          shouldAddHelpers: false,
          supportsResponseStreaming: true,
        }),
      );
      await writeFile(
        path.join(output, "config.json"),
        JSON.stringify({
          version: 3,
          routes: createDeploymentRoutes(),
        }),
      );
    },
  };
}
