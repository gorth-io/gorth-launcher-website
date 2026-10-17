import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));
vi.mock("@/layouts/footer", () => ({
  Footer: (props: { mode: string; bottom: ReactNode }) => {
    fixture.props = props;
    return createElement("footer", { "data-mode": props.mode }, props.bottom);
  },
}));
import { Footer } from "@/layouts/website-footer";
import { footerSocials } from "@/utils/constant";

it("uses compact dashboard footer without the large branding/navigation section", () => {
  const html = renderToStaticMarkup(createElement(Footer));
  expect(fixture.props.mode).toBe("dashboard");
  expect(fixture.props.nav).toEqual({ main: [], secondary: [] });
  expect(fixture.props.top).toBeUndefined();
  expect(fixture.props.middle).toBeUndefined();
  expect(html).toContain("Powered by Gorth, Inc. All right reserve.");
});

it("renders five accessible external social buttons matching SSO", () => {
  const html = renderToStaticMarkup(createElement(Footer));
  expect(footerSocials).toHaveLength(5);
  expect(html).toContain('aria-label="Gorth social links"');
  for (const item of footerSocials) {
    expect(html).toContain('href="' + item.url + '"');
    expect(html).toContain('aria-label="' + item.title + '"');
  }
  expect(html.match(/target="_blank"/g) ?? []).toHaveLength(5);
  expect(html.match(/rel="noopener noreferrer"/g) ?? []).toHaveLength(5);
});
