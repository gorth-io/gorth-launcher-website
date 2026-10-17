import { useState } from "react";
import { Link } from "@gorth/primitive/cores/tanstack/router";
import { Menu } from "@gorth/primitive/cores/lucide";

import { NavUser } from "@/components/dashboard/nav-user";
import { Button } from "@gorth/primitive/custom/button";
import { Customizer } from "@gorth/primitive/element/customizer";
import { ModeSwitcher } from "@gorth/primitive/element/mode-toggle";
import { Shortcut } from "@/components/element/shortcut";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@gorth/primitive/default/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@gorth/primitive/default/sheet";
import { cn } from "@gorth/primitive/cores/cn";
import { HeaderProps, NavMainItem } from "@gorth/primitive/utils/interface";
import { useLayout } from "@gorth/primitive/providers/layout";

function HeaderNavigation({ items }: { items: NavMainItem[] }) {
  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList>
        {items.map((item) => (
          <NavigationMenuItem key={item.url}>
            {item.items?.length ? (
              <>
                <NavigationMenuTrigger className="bg-transparent text-sm">
                  {item.title}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-80 p-1 md:w-[500px]">
                  <ul className="grid gap-1 rounded-md md:grid-cols-2">
                    {item.items.map((child) => (
                      <li key={child.url}>
                        <Button
                          nativeButton={false}
                          render={<Link to={child.url} />}
                          variant="ghost"
                          className="h-auto w-full select-none flex-col items-start gap-1 whitespace-normal rounded-md p-3 text-left"
                        >
                          <span className="text-sm font-medium leading-none">
                            {child.title}
                          </span>
                          {child.description ? (
                            <span className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {child.description}
                            </span>
                          ) : null}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </>
            ) : (
              <Button
                nativeButton={false}
                render={<Link to={item.url} />}
                variant="ghost"
                className="w-max bg-transparent px-4"
              >
                {item.title}
              </Button>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function MobileNavigation({ items }: { items: NavMainItem[] }) {
  const [open, setOpen] = useState(false);

  if (!items.length) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="lg:hidden"
        render={<Button variant="ghost" size="icon" />}
      >
        <Menu className="size-4" />
        <span className="sr-only">Toggle navigation</span>
      </SheetTrigger>
      <SheetContent side="left" className="gap-4 p-4">
        <SheetHeader className="p-0">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {items.map((item) => (
            <div key={item.url} className="flex flex-col gap-1">
              <Button
                nativeButton={false}
                render={<Link to={item.url} />}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setOpen(false)}
              >
                <item.icon className="size-4" />
                {item.title}
              </Button>
              {item.items?.map((child) => (
                <Button
                  key={child.url}
                  nativeButton={false}
                  render={<Link to={child.url} />}
                  variant="ghost"
                  className="w-full justify-start pl-10 text-muted-foreground"
                  onClick={() => setOpen(false)}
                >
                  {child.title}
                </Button>
              ))}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function Header({
  top,
  bottom,
  left,
  right,
  user,
  auth,
  nav,
  mode = "navbar",
}: HeaderProps) {
  const { navbarBehavior, variant } = useLayout();
  const navigation = nav.navigation ?? [];
  const dashboard = mode === "dashboard";
  const floating = variant === "floating";
  const inset = variant === "inset";

  return (
    <header
      data-slot="layout-header"
      data-layout={variant}
      data-behavior={navbarBehavior}
      data-mode={mode}
      className={cn(
        "z-50 w-full shrink-0 data-[behavior=sticky]:sticky data-[behavior=sticky]:top-0",
        !floating &&
          "bg-background/95 shadow-[inset_0_-1px_0_var(--border)] backdrop-blur supports-[backdrop-filter]:bg-background/80",
        inset && "rounded-t-xl",
      )}
    >
      {top}
      <div className={cn("w-full", floating && "container mx-auto px-6 py-2")}>
        <div
          className={cn(
            "h-14 w-full",
            !dashboard && !floating && "container mx-auto",
            floating &&
              "rounded-lg bg-background/95 shadow-sm ring-1 ring-sidebar-border backdrop-blur supports-[backdrop-filter]:bg-background/80",
            inset && "rounded-t-xl",
          )}
        >
          <div
            className={cn(
              "mx-auto flex h-full items-center gap-2 px-6",
              dashboard && !floating && "container",
            )}
          >
            {dashboard ? (
              left
            ) : (
              <>
                <MobileNavigation items={navigation} />
                <div className="mr-2 flex shrink-0 items-center">
                  {bottom ? (
                    bottom
                  ) : (
                    <Button
                      nativeButton={false}
                      render={<Link to="/" />}
                      variant="ghost"
                      className="px-0 text-lg font-bold hover:bg-transparent"
                    >
                      Gorth
                    </Button>
                  )}
                </div>
                {left ?? <HeaderNavigation items={navigation} />}
              </>
            )}

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {right ?? (
                <>
                  <ModeSwitcher />
                  <Customizer />
                  {nav.navigation?.length ? (
                    <Shortcut shortcuts={nav.navigation} />
                  ) : null}
                  <NavUser
                    user={user}
                    type="navbar"
                    side="bottom"
                    align="end"
                    size="icon"
                    auth={auth}
                    nav={{ main: nav.main, secondary: nav.secondary }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
