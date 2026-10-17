import { Link } from "@gorth/primitive/cores/tanstack/router";

import { useEffect, useState, type ComponentProps } from "react";
import {
  ArrowLeft,
  EllipsisVertical,
  ChevronRight,
  RotateCw,
  Check,
  Loader2,
  UserPlus,
  LogOut,
} from "@gorth/primitive/cores/lucide";
import {
  NavIdentity,
  NavAccount,
  NavDropdownItem,
  NavUser as PrimitiveNavUser,
} from "@/components/dashboard/nav-user";
import { Button } from "@gorth/primitive/custom/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@gorth/primitive/custom/dropdown";
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@gorth/primitive/custom/sidebar";

export interface AccountSwitcherProps
  extends ComponentProps<typeof PrimitiveNavUser>, AccountSwitcherItemsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountsOpenChange?: (enabled: boolean) => void;
}

export function AccountSwitcher(props: AccountSwitcherProps) {
  const { user, nav, auth, type, side = "bottom", align = "end" } = props;
  const { isMobile } = useSidebar();
  const {
    open,
    onOpenChange: setOpen,
    onAccountsOpenChange,
    accounts,
    loading,
    pendingSessionId,
    error,
    onSelect,
    onRetry,
    addAccountHref,
    maxAccounts,
  } = props;
  const [view, setView] = useState<"profile" | "accounts">("profile");
  useEffect(() => {
    if (!open) setView("profile");
  }, [open]);
  const busy = pendingSessionId !== null;
  useEffect(() => {
    onAccountsOpenChange?.(open && view === "accounts" && auth.authenticated);
  }, [open, view, auth.authenticated, onAccountsOpenChange]);

  if (!auth.authenticated) return <PrimitiveNavUser {...props} />;

  const menu = (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen && busy) return;
        setOpen(nextOpen);
        if (!nextOpen) setView("profile");
      }}
    >
      <DropdownMenuTrigger
        disabled={busy}
        aria-label={`Account menu for ${user.name}`}
        render={
          type === "navbar" ? (
            <Button variant="ghost" size="icon" className="p-0">
              <NavIdentity user={user} showName={false} />
            </Button>
          ) : (
            <NavAccount
              user={user}
              trailing={
                <EllipsisVertical className="ml-auto size-4 shrink-0" />
              }
            />
          )
        }
      />
      <DropdownMenuContent
        tabIndex={-1}
        className="w-[248px] min-w-[248px] rounded-lg"
        side={type === "navbar" || isMobile ? "bottom" : side}
        align={align}
        sideOffset={4}
      >
        {view === "accounts" ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem
                closeOnClick={false}
                disabled={busy}
                onClick={(event) => {
                  event.currentTarget
                    .closest<HTMLElement>('[data-slot="dropdown-menu-content"]')
                    ?.focus();
                  setView("profile");
                }}
              >
                <ArrowLeft className="size-4" /> Back
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <AccountSwitcherItems
              accounts={accounts}
              loading={loading}
              pendingSessionId={pendingSessionId}
              error={error}
              onSelect={onSelect}
              onRetry={onRetry}
              addAccountHref={addAccountHref}
              maxAccounts={maxAccounts}
            />
          </>
        ) : (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem
                closeOnClick={false}
                disabled={busy}
                nativeButton
                render={(itemProps) => (
                  <NavAccount
                    {...itemProps}
                    user={user}
                    trailing={
                      <ChevronRight
                        className="ml-auto size-4 shrink-0"
                        aria-label="Switch account"
                      />
                    }
                  />
                )}
                onClick={(event) => {
                  event.currentTarget
                    .closest<HTMLElement>('[data-slot="dropdown-menu-content"]')
                    ?.focus();
                  onRetry();
                  setView("accounts");
                }}
              />
            </DropdownMenuGroup>
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
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <NavDropdownItem
                icon={LogOut}
                title="Sign out"
                action={auth.logout}
              />
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return type === "sidebar" ? (
    <SidebarMenu>
      <SidebarMenuItem>{menu}</SidebarMenuItem>
    </SidebarMenu>
  ) : (
    menu
  );
}

export interface SwitcherAccount {
  sessionId: string;
  user: { id: string; name: string; email: string; image?: string | null };
  active: boolean;
}

export interface AccountSwitcherItemsProps {
  accounts: SwitcherAccount[];
  loading: boolean;
  pendingSessionId: string | null;
  error: string | null;
  onSelect: (account: SwitcherAccount) => void;
  onRetry: () => void;
  addAccountHref: string;
  maxAccounts?: number;
}

export function AccountSwitcherItems({
  accounts,
  loading,
  pendingSessionId,
  error,
  onSelect,
  onRetry,
  addAccountHref,
  maxAccounts = 5,
}: AccountSwitcherItemsProps) {
  const busy = pendingSessionId !== null;

  return (
    <>
      <DropdownMenuGroup
        aria-busy={loading || busy}
        className="max-h-[calc(var(--available-height)-9rem)] overflow-y-auto overscroll-contain"
      >
        {loading ? (
          <p
            role="status"
            className="flex h-9 items-center gap-2 px-2.5 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading accounts...
          </p>
        ) : null}
        {!loading && !error && !accounts.length ? (
          <p
            role="status"
            className="px-2.5 py-2 text-sm text-muted-foreground"
          >
            No accounts signed in on this browser.
          </p>
        ) : null}
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.sessionId}
            nativeButton
            render={(itemProps) => (
              <NavAccount
                {...itemProps}
                user={{
                  name: account.user.name,
                  email: account.user.email,
                  avatar: account.user.image ?? "",
                }}
                trailing={
                  pendingSessionId === account.sessionId ? (
                    <Loader2
                      className="ml-auto size-4 animate-spin"
                      aria-label="Switching account"
                    />
                  ) : account.active ? (
                    <Check
                      className="ml-auto size-4"
                      aria-label="Active account"
                    />
                  ) : (
                    <span
                      className="ml-auto size-4 shrink-0"
                      aria-hidden="true"
                    />
                  )
                }
              />
            )}
            disabled={loading || busy}
            closeOnClick={false}
            aria-label={`${account.user.name}, ${account.user.email}${account.active ? ", active account" : ""}`}
            onClick={() => onSelect(account)}
          />
        ))}
        {error ? (
          <>
            <p role="alert" className="px-2.5 py-2 text-sm text-destructive">
              {error}
            </p>
            <DropdownMenuItem
              className="h-9"
              closeOnClick={false}
              disabled={busy || loading}
              onClick={onRetry}
            >
              <RotateCw className="size-4" />
              Try again
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        {accounts.length >= maxAccounts ? (
          <p className="px-2.5 py-2 text-xs text-muted-foreground">
            Sign out of an account before adding another. Up to {maxAccounts}{" "}
            accounts are supported.
          </p>
        ) : null}
        <DropdownMenuItem
          className="h-9 w-full"
          disabled={loading || busy || accounts.length >= maxAccounts}
          render={<Link to={addAccountHref} />}
        >
          <UserPlus className="size-4" />
          Add account
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </>
  );
}
