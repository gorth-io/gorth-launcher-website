import * as React from "react";
import { Link } from "@gorth/primitive/cores/tanstack/router";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@gorth/primitive/custom/sidebar";
import { NavMainItem } from "@gorth/primitive/utils/interface";

interface NavCoreProps extends React.ComponentPropsWithoutRef<
  typeof SidebarGroup
> {
  items: NavMainItem[];
}
export function NavSecondary({ items, ...props }: NavCoreProps) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton render={<Link to={item.url} />}>
                  <Icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
