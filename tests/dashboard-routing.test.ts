import { access, readFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { dashboardNavigation, headerNavigation } from "@/utils/constant";
import { resolveInternalPath } from "@/utils/formatter";

it("serves every dashboard navigation item directly under the guarded account route", async () => {
  for (const { url } of dashboardNavigation) {
    expect(url === "/account" || url.startsWith("/account/")).toBe(true);
    const page = await readFile(
      new URL("../pages/(dashboard)" + url + "/page.tsx", import.meta.url),
      "utf8",
    );
    expect(page).not.toContain("redirect(");
  }
  expect(
    headerNavigation.main.every((item) => item.url.startsWith("/account")),
  ).toBe(true);
  await expect(
    access(new URL("../pages/account/page.tsx", import.meta.url)),
  ).rejects.toMatchObject({ code: "ENOENT" });
  await expect(
    access(new URL("../pages/(dashboard)/user/page.tsx", import.meta.url)),
  ).rejects.toMatchObject({ code: "ENOENT" });
  expect(
    await readFile(
      new URL("../pages/(dashboard)/layout.tsx", import.meta.url),
      "utf8",
    ),
  ).toContain("<AuthGuard>");
});

it("defaults post-login navigation and the unauthenticated guard to account", async () => {
  expect(resolveInternalPath(undefined)).toBe("/account");
  expect(resolveInternalPath("https://external.example/")).toBe("/account");
  expect(resolveInternalPath("/account?tab=profile")).toBe(
    "/account?tab=profile",
  );
  expect(
    await readFile(new URL("../layouts/guard.tsx", import.meta.url), "utf8"),
  ).toContain('to: "/auth/sign-in"');
});
