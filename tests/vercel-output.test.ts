import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { vercelOutput } from "../configs/vercel";
import { createDeploymentRoutes } from "../app/routing";

it("preserves the production manifest and disables helpers for raw POST bodies", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "gorth-vercel-output-"));
  try {
    await mkdir(path.join(root, "dist/client/public"), { recursive: true });
    await mkdir(path.join(root, "dist/server"), { recursive: true });
    await writeFile(
      path.join(root, "dist/client/public/index.html"),
      "<html>fixture</html>",
    );
    await writeFile(
      path.join(root, "dist/server/vercel.mjs"),
      "export default () => {};",
    );
    const plugin = vercelOutput(root);
    expect(plugin.apply).toBe("build");
    const hook = plugin.writeBundle;
    if (typeof hook !== "function") throw new Error("Missing writeBundle hook");
    await hook.call({} as never, {} as never, {} as never);
    const output = path.join(root, ".vercel/output");
    expect(
      JSON.parse(
        await readFile(
          path.join(output, "functions/__server.func/.vc-config.json"),
          "utf8",
        ),
      ),
    ).toEqual({
      runtime: "nodejs24.x",
      handler: "vercel.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
    });
    expect(
      JSON.parse(await readFile(path.join(output, "config.json"), "utf8")),
    ).toEqual({ version: 3, routes: createDeploymentRoutes() });
    expect(
      await readFile(path.join(output, "static/public/index.html"), "utf8"),
    ).toBe("<html>fixture</html>");
    expect(
      await readFile(
        path.join(output, "functions/__server.func/vercel.mjs"),
        "utf8",
      ),
    ).toBe("export default () => {};");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
