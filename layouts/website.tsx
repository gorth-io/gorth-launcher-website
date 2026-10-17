import type { ReactNode } from "react";
import { useLocation } from "@gorth/primitive/cores/tanstack/router";
import { SidebarProvider } from "@gorth/primitive/custom/sidebar";
import { Header } from "@/layouts/website-header";
import { Footer } from "@/layouts/website-footer";
import { DashboardShell } from "@/layouts/dashboard-shell";

export function WebsiteLayout({ children }: { children: ReactNode }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const dashboard =
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname.startsWith("/group/") ||
    pathname.startsWith("/workspace/");
  if (dashboard) return <DashboardShell>{children}</DashboardShell>;
  return (
    <SidebarProvider className="min-h-svh flex-col bg-background text-foreground">
      <Header />
      <main id="main-content" className="flex min-w-0 flex-1 flex-col">
        {children}
      </main>
      <Footer />
    </SidebarProvider>
  );
}
