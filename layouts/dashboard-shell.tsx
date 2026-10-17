import type { ReactNode } from "react";
import { Link } from "@gorth/primitive/cores/tanstack/router";
import { useLocation } from "@gorth/primitive/cores/tanstack/router";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Header } from "@/layouts/header";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@gorth/primitive/custom/sidebar";
import { useNavigation } from "@/hooks/use-navigation";
import {
  dashboardNavigation,
  headerNavigation,
  product,
} from "@/utils/constant";
import { Footer } from "@/layouts/website-footer";
import { AppBrand } from "@/components/app-brand";

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const { user, auth } = useNavigation();
  const navMain = dashboardNavigation.map((item) => ({
    ...item,
    isActive:
      pathname === item.url ||
      (item.url !== "/account" && pathname.startsWith(item.url + "/")),
  }));
  const title =
    navMain.find((item) => item.isActive)?.title ??
    (pathname.startsWith("/group/")
      ? "Tab group"
      : pathname.startsWith("/workspace/")
        ? "Workspace"
        : "Dashboard");
  return (
    <SidebarProvider>
      <AppSidebar
        data={{
          user,
          brand: { name: product.name, logo: "/icon.svg" },
          navMain,
          navSecondary: [],
          navDropdown: headerNavigation.main,
          navSignal: headerNavigation.secondary,
          projects: [],
        }}
        auth={auth}
      />
      <SidebarInset className="min-w-0">
        <Header
          mode="dashboard"
          user={user}
          auth={auth}
          nav={headerNavigation}
          left={
            <div className="flex min-w-0 items-center gap-3">
              <Link to="/" aria-label="Home" className="md:hidden">
                <AppBrand />
              </Link>
              <SidebarTrigger />
              <span className="truncate text-sm font-medium">{title}</span>
            </div>
          }
        />
        <main id="main-content" className="flex min-w-0 flex-1 flex-col">
          <div className="container mx-auto flex w-full min-w-0 flex-1 flex-col gap-6 p-6">
            {children}
          </div>
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}
