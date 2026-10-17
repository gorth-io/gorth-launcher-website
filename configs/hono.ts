import path from "node:path";
import { pathToFileURL } from "node:url";
import { readdir, readFile } from "node:fs/promises";
import { loadEnv, type Plugin } from "vite";
import { getRequestListener } from "@gorth/principle/cores/hono/server";
import {
  applyDevelopmentEnvironment,
  prepareProductionBuild,
} from "../utils/environment.ts";
import { isBackendPath } from "../app/routing.ts";

export function sameOriginHono(root: string): Plugin {
  return {
    name: "gorth-same-origin-hono",
    config(config, { command, mode }) {
      if (command === "build") prepareProductionBuild();
      const envDir =
        config.envDir === false
          ? false
          : path.resolve(root, config.envDir || ".");
      // Only public metadata is read for compile-time injection. No private
      // value or complete process.env object is passed to Vite define.
      const publicValues = loadEnv(mode, envDir, [
        "VITE_PUBLIC_",
        "OAUTH_COOKIE_PREFIX",
      ]);
      return {
        ...(command === "build"
          ? { environments: { ssr: { resolve: { noExternal: true } } } }
          : {}),
        define: {
          __GORTH_PUBLIC_COOKIE_PREFIX__: JSON.stringify(
            publicValues.OAUTH_COOKIE_PREFIX || "",
          ),
          __GORTH_PUBLIC_AUTH_URL__: JSON.stringify(
            publicValues.VITE_PUBLIC_AUTH_URL || "",
          ),
        },
      };
    },
    resolveId(
      id: string,
      _importer: string | undefined,
      options: { ssr?: boolean },
    ) {
      if (
        !options.ssr &&
        (id === "@/utils/environment" ||
          id === "./utils/environment" ||
          id.startsWith("next/") ||
          id === "next" ||
          id.startsWith("@bprogress/next"))
      ) {
        throw new Error(
          "A server or Next.js dependency entered the browser graph: " + id,
        );
      }
      if (id !== "server-only") return;
      if (!options.ssr)
        throw new Error(
          "A server-only module entered the browser dependency graph",
        );
      return "\0gorth-server-only";
    },
    load(id: string) {
      if (id === "\0gorth-server-only") return "export {};";
    },
    async configurePreviewServer(server) {
      applyDevelopmentEnvironment(
        loadEnv(server.config.mode, server.config.envDir, ""),
      );
      // Load the compiled API, not source code or the standalone listener.
      const { default: handler } = await import(
        /* @vite-ignore */ pathToFileURL(
          path.join(root, "dist/server/vercel.mjs"),
        ).href
      );
      server.middlewares.use(async (request, response, next) => {
        try {
          const pathname = new URL(request.url || "/", "http://localhost")
            .pathname;
          if (isBackendPath(pathname)) {
            await handler(request, response);
            return;
          }
          if (
            ["GET", "HEAD"].includes(request.method || "") &&
            !path.extname(pathname)
          ) {
            response.setHeader("Cache-Control", "no-store");
            request.url = "/public/index.html";
          }
          next();
        } catch {
          if (!response.headersSent) response.statusCode = 500;
          response.end();
        }
      });
    },
    configureServer(server) {
      applyDevelopmentEnvironment(
        loadEnv(server.config.mode, server.config.envDir, ""),
      );
      server.middlewares.use(async (request, response, next) => {
        try {
          const pathname = new URL(request.url || "/", "http://localhost")
            .pathname;
          response.setHeader("X-Content-Type-Options", "nosniff");
          response.setHeader(
            "Referrer-Policy",
            pathname.startsWith("/auth") ? "no-referrer" : "same-origin",
          );
          if (isBackendPath(pathname)) {
            const module = await server.ssrLoadModule("/app/server.ts");
            await getRequestListener(module.default.fetch)(request, response);
            return;
          }
          // Leave Vite/HMR, module and static-asset URLs to Vite itself.
          if (
            ["GET", "HEAD"].includes(request.method || "") &&
            !pathname.startsWith("/@") &&
            !pathname.startsWith("/node_modules/") &&
            !path.extname(pathname)
          ) {
            request.url = "/public/index.html";
            response.setHeader("Cache-Control", "no-store");
          }
          next();
        } catch {
          if (!response.headersSent) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify({ error: "Internal Server Error" }));
          } else response.end();
        }
      });
    },
    transform(_code: string, id: string, options?: { ssr?: boolean }) {
      if (
        !options?.ssr &&
        id.split("?")[0] === path.join(root, "utils/environment.ts")
      ) {
        throw new Error(
          "Private environment cannot be imported by the browser",
        );
      }
    },
    async generateBundle() {
      if (this.environment.name !== "client") return;
      const emit = async (directory: string, prefix = ""): Promise<void> => {
        for (const entry of await readdir(directory, {
          withFileTypes: true,
        })) {
          if (entry.name.startsWith(".") || entry.isSymbolicLink()) continue;
          const name = prefix + entry.name;
          if (entry.isDirectory())
            await emit(path.join(directory, entry.name), name + "/");
          else if (name !== "index.html")
            this.emitFile({
              type: "asset",
              fileName: name,
              source: await readFile(path.join(directory, entry.name)),
            });
        }
      };
      await emit(path.join(root, "public"));
    },
  };
}
