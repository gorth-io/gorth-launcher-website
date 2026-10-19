import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";
import { expect, it, vi } from "vitest";
import { UserRound, LogIn, KeySquare } from "@gorth/primitive/cores/lucide";
import { NavUserDropdown, NavDropdownItem } from "@/components/dashboard/nav-user";
import { DropdownMenuGroup, DropdownMenuSeparator } from "@gorth/primitive/custom/dropdown";
import type { AuthSidebarProps, NavDropdown } from "@gorth/primitive/utils/interface";

function flatten(children: ReactNode): ReactElement<{ children?: ReactNode }>[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return [];
    return child.type === Fragment ? flatten(child.props.children) : [child];
  });
}
const main = [{ title: "Account", url: "/account", icon: UserRound }];
const secondary = [
  { title: "Sign In", url: "/auth/sign-in", icon: LogIn },
  { title: "Sign Up", url: "/auth/sign-up", icon: KeySquare },
];
it.each([
  { authenticated: false, main, secondary, separators: 1, groups: 2, titles: ["Sign In", "Sign Up"] },
  { authenticated: false, main: [], secondary, separators: 1, groups: 2, titles: ["Sign In", "Sign Up"] },
  { authenticated: false, main, secondary: [], separators: 0, groups: 1, titles: [] },
  { authenticated: true, main, secondary, separators: 2, groups: 3, titles: ["Account", "Sign out"] },
  { authenticated: true, main: [], secondary, separators: 1, groups: 2, titles: ["Sign out"] },
])("separates only visible nav-user groups: $authenticated/$groups", (scenario) => {
  const auth: AuthSidebarProps = {
    authenticated: scenario.authenticated, loading: false,
    login: vi.fn(), register: vi.fn(), logout: vi.fn(async () => {}),
  };
  const nav: NavDropdown = { main: scenario.main, secondary: scenario.secondary };
  const nodes = flatten(NavUserDropdown({ user: { name: "Visitor", email: "visitor@gorth.org" }, nav, auth }));
  expect(nodes.filter((node) => node.type === DropdownMenuSeparator)).toHaveLength(scenario.separators);
  expect(nodes.filter((node) => node.type === DropdownMenuGroup)).toHaveLength(scenario.groups);
  expect(nodes.at(-1)?.type).toBe(DropdownMenuGroup);
  nodes.forEach((node, index) => {
    if (node.type === DropdownMenuSeparator) {
      expect(nodes[index - 1]?.type).toBe(DropdownMenuGroup);
      expect(nodes[index + 1]?.type).toBe(DropdownMenuGroup);
    }
  });
  const items = nodes.flatMap((node) => flatten(node.props.children))
    .filter((node) => node.type === NavDropdownItem) as ReactElement<{ title: string; action?: AuthSidebarProps["login"] }>[];
  expect(items.map((item) => item.props.title)).toEqual(scenario.titles);
  if (!scenario.authenticated && scenario.secondary.length) {
    expect(items[0].props.action).toBe(auth.login);
    expect(items[1].props.action).toBe(auth.register);
  }
  if (scenario.authenticated) expect(items.at(-1)?.props.action).toBe(auth.logout);
});

