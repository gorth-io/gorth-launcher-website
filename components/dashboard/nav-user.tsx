import React, { JSX } from "react";
import { Link } from "@gorth/primitive/cores/tanstack/router";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@gorth/primitive/custom/tooltip";
import { cn } from "@gorth/primitive/cores/cn";
import { formatUserInitials } from "@gorth/primitive/utils/formatter";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@gorth/primitive/custom/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@gorth/primitive/custom/dropdown";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@gorth/primitive/custom/sidebar";
import { Button } from "@gorth/primitive/custom/button";
import {
  BadgeCheck,
  Bell,
  EllipsisVertical,
  CreditCard,
  LogOut,
  Sparkles,
  LucideIcon,
} from "@gorth/primitive/cores/lucide";

import type {
  AppSidebarUserProps,
  AuthSidebarProps,
  NavDropdown,
  UserProps,
} from "@gorth/primitive/utils/interface";

export function NavUserX({ user }: { user: UserProps }) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <NavIdentity user={user} />
            <EllipsisVertical className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <NavIdentity user={user} />
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function NavUserDropdown({
  user,
  nav,
  auth,
}: {
  user: UserProps;
  nav: NavDropdown;
  auth: AuthSidebarProps;
}): JSX.Element {
  return (
    <>
      <DropdownMenuGroup>
        <NavAccount user={user} />
      </DropdownMenuGroup>
      {auth.authenticated && nav.main.length > 0 && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {nav.main.map((item) => (
              <NavDropdownItem
                key={item.url}
                icon={item.icon}
                title={item.title}
                link={item.url}
              />
            ))}
          </DropdownMenuGroup>
        </>
      )}
      {(auth.authenticated || nav.secondary.length > 0) && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {auth.authenticated ? (
              <NavDropdownItem
                icon={LogOut}
                title="Sign out"
                action={auth.logout}
              />
            ) : (
              nav.secondary.map((item) => {
                const isSignIn = item.url.endsWith("/sign-in");
                const isSignUp = item.url.endsWith("/sign-up");
                return (
                  <NavDropdownItem
                    key={item.url}
                    icon={item.icon}
                    title={item.title}
                    action={
                      isSignIn ? auth.login : isSignUp ? auth.register : undefined
                    }
                    link={!isSignIn && !isSignUp ? item.url : undefined}
                  />
                );
              })
            )}
          </DropdownMenuGroup>
        </>
      )}
    </>
  );
}

export function NavUser({
  user,
  nav,
  auth,
  type,
  size = "icon",
  side = "bottom",
  align = "end",
}: AppSidebarUserProps) {
  const { isMobile } = useSidebar();

  return (
    <>
      {type === "navbar" ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="p-0" />}
            >
              <NavAvatar user={user} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-56 rounded-lg"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              <NavUserDropdown user={user} nav={nav} auth={auth} />
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : type === "sidebar" ? (
        <>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <NavAccount
                      user={user}
                      className={
                        size === "icon"
                          ? "group-data-[collapsible=icon]:p-0!"
                          : undefined
                      }
                      trailing={
                        <EllipsisVertical className="ml-auto size-4 shrink-0" />
                      }
                    />
                  }
                />
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  // side={isMobile ? "bottom" : "right"}
                  side={isMobile ? "bottom" : side}
                  align={align}
                  sideOffset={4}
                >
                  <NavUserDropdown user={user} nav={nav} auth={auth} />
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </>
      ) : (
        <></>
      )}
    </>
  );
}

export interface NavIdentityProps extends Omit<
  React.ComponentProps<"div">,
  "className" | "style" | "children"
> {
  user: UserProps;
  showAvatar?: boolean;
  showName?: boolean;
  description?: React.ReactNode;
  url?: string;
  href?: string;
  hover?: boolean;
  tooltip?: boolean;
  trailing?: React.ReactNode;
}

export interface NavProfileProps extends Omit<
  React.ComponentProps<typeof Avatar>,
  "children"
> {
  user: UserProps;
}

export function NavProfile({ user, className, ...props }: NavProfileProps) {
  return (
    <Avatar {...props} className={cn("size-24 rounded-2xl", className)}>
      <AvatarImage
        alt={user.name}
        className="rounded-2xl object-cover"
        src={user.avatar || undefined}
      />
      <AvatarFallback className="rounded-2xl text-2xl">
        {formatUserInitials(user.name || user.email || "User")}
      </AvatarFallback>
    </Avatar>
  );
}

export interface NavAccountProps extends React.ComponentProps<
  typeof SidebarMenuButton
> {
  user: UserProps;
  trailing?: React.ReactNode;
}

export function NavAccount({
  user,
  trailing,
  className,
  ...props
}: NavAccountProps) {
  return (
    <SidebarMenuButton
      {...props}
      size="lg"
      className={cn(
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        className,
        "h-14 w-full gap-2 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground not-data-[variant=destructive]:focus:**:text-sidebar-accent-foreground",
      )}
    >
      <NavIdentity user={user} />
      {trailing}
    </SidebarMenuButton>
  );
}

export function NavIdentity({
  user,
  showAvatar = true,
  showName = true,
  description,
  url,
  href,
  hover = false,
  tooltip = false,
  trailing,
  ...props
}: NavIdentityProps) {
  return (
    <div
      {...props}
      className={cn("flex min-w-0 items-center gap-2", showName && "flex-1")}
    >
      {showAvatar ? <NavAvatar user={user} url={url} /> : null}
      {showName ? (
        <NavName
          user={user}
          description={description}
          hover={hover}
          tooltip={tooltip}
          url={url}
          href={href}
        />
      ) : null}
      {trailing}
    </div>
  );
}

export interface NavAvatarProps {
  user: UserProps;
  url?: string;
}

export function NavAvatar({ user, url }: NavAvatarProps) {
  const initials = formatUserInitials(user.name);
  const avatar = (
    <Avatar
      className={cn(
        "size-9 shrink-0",
        url ? "cursor-pointer" : "cursor-default",
      )}
    >
      <AvatarImage src={user.avatar || undefined} alt={user.name} />
      <AvatarFallback
        className="bg-muted-foreground text-primary-foreground"
        suppressHydrationWarning
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
  return url ? (
    <Link to={url} aria-label={user.name} className="shrink-0 cursor-pointer">
      {avatar}
    </Link>
  ) : (
    avatar
  );
}

export interface NavNameProps {
  user: UserProps;
  description?: React.ReactNode;
  url?: string;
  href?: string;
  hover?: boolean;
  tooltip?: boolean;
}

export function NavName({
  user,
  description = user.email,
  url,
  href,
  hover = false,
  tooltip = false,
}: NavNameProps) {
  const nameUrl = href ?? url;
  const nameClass = "block min-w-0 truncate font-medium";
  const name = nameUrl ? (
    <Link to={nameUrl} className={nameClass} suppressHydrationWarning>
      {user.name}
    </Link>
  ) : (
    <span className={nameClass} suppressHydrationWarning>
      {user.name}
    </span>
  );
  const descriptionClass = cn(
    "block min-w-0 truncate text-xs",
    hover && "text-muted-foreground transition-colors hover:text-foreground",
  );
  return (
    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger render={name} tabIndex={0} />
          <TooltipContent
            side="bottom"
            align="start"
            arrowAlign="start"
            variant="popover"
            className="w-60 min-w-60 max-w-60 whitespace-normal break-words [overflow-wrap:anywhere]"
          >
            {user.name}
          </TooltipContent>
        </Tooltip>
      ) : (
        name
      )}
      {description !== null &&
      description !== false &&
      description !== undefined ? (
        url ? (
          <Link to={url} className={descriptionClass} suppressHydrationWarning>
            {description}
          </Link>
        ) : (
          <span className={descriptionClass} suppressHydrationWarning>
            {description}
          </span>
        )
      ) : null}
    </div>
  );
}

export function NavDropdownItem({
  icon: Icon,
  title,
  link,
  action,
}: {
  icon: LucideIcon;
  title: string;
  link?: string;
  action?: () => void;
}) {
  return (
    <>
      <DropdownMenuItem
        onClick={action}
        render={link ? <Link to={link} /> : undefined}
      >
        <Icon className="size-4" />
        <span>{title}</span>
      </DropdownMenuItem>
    </>
  );
}
