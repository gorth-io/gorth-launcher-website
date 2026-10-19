import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  type RouterHistory,
} from "@gorth/primitive/cores/tanstack/router";
import RootLayout from "@/pages/layout";
import DashboardLayout from "@/pages/(dashboard)/layout";
import NotFoundPage from "@/pages/not-found";
import { Suspense, useEffect } from "react";
import { SuspenseProgress } from "@/components/suspense-progress";
import { useLocation } from "@gorth/primitive/cores/tanstack/router";
import { product } from "@/utils/constant";
const Page0 = lazyRouteComponent(
  () => import("@/pages/(dashboard)/account/download/page"),
);
const Page1 = lazyRouteComponent(
  () => import("@/pages/(dashboard)/account/faq/page"),
);
const Page2 = lazyRouteComponent(
  () => import("@/pages/(dashboard)/account/friend/page"),
);
const Page3 = lazyRouteComponent(
  () => import("@/pages/(dashboard)/account/page"),
);
const Page4 = lazyRouteComponent(
  () => import("@/pages/(dashboard)/account/server/page"),
);
const Page5 = lazyRouteComponent(
  () => import("@/pages/(dashboard)/account/settings/page"),
);
const Page6 = lazyRouteComponent(
  () => import("@/pages/(dashboard)/account/skin/page"),
);
const Page7 = lazyRouteComponent(
  () => import("@/pages/auth/desktop/complete/page"),
);
const Page8 = lazyRouteComponent(() => import("@/pages/auth/desktop/page"));
const Page9 = lazyRouteComponent(() => import("@/pages/auth/error/page"));
const Page10 = lazyRouteComponent(() => import("@/pages/auth/sign-in/page"));
const Page11 = lazyRouteComponent(() => import("@/pages/download/page"));
const Page12 = lazyRouteComponent(() => import("@/pages/page"));

function Root() {
  const pathname = useLocation({ select: (location) => location.pathname });
  useEffect(() => {
    document.title =
      pathname === "/"
        ? product.name
        : pathname.startsWith("/auth/")
          ? "Sign in | " + product.name
          : product.name;
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.append(robots);
    }
    robots.content =
      pathname === "/" || pathname === "/download"
        ? "index,follow"
        : "noindex,nofollow";
  }, [pathname]);
  return (
    <RootLayout>
      <Suspense fallback={null}>
        <SuspenseProgress />
      </Suspense>
      <Outlet />
    </RootLayout>
  );
}
const rootRoute = createRootRoute({
  component: Root,
  notFoundComponent: NotFoundPage,
});
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "dashboard",
  component: () => (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  ),
});
const route0 = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/account/download",
  component: Page0,
});
const route1 = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/account/faq",
  component: Page1,
});
const route2 = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/account/friend",
  component: Page2,
});
const route3 = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/account",
  component: Page3,
});
const route4 = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/account/server",
  component: Page4,
});
const route5 = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/account/settings",
  component: Page5,
});
const route6 = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/account/skin",
  component: Page6,
});
const route7 = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/desktop/complete",
  component: Page7,
});
const route8 = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/desktop",
  component: Page8,
});
const route9 = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/error",
  component: Page9,
});
const route10 = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/sign-in",
  component: Page10,
});
const route11 = createRoute({
  getParentRoute: () => rootRoute,
  path: "/download",
  component: Page11,
});
const route12 = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Page12,
});
export const routeTree = rootRoute.addChildren([
  dashboardRoute.addChildren([
    route0,
    route1,
    route2,
    route3,
    route4,
    route5,
    route6,
  ]),
  route7,
  route8,
  route9,
  route10,
  route11,
  route12,
]);
export function createAppRouter(history?: RouterHistory) {
  return createRouter({
    routeTree,
    history,
    defaultPreload: "intent",
    defaultPendingMinMs: 0,
    scrollRestoration: true,
  });
}
