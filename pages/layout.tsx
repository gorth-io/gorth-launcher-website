import type { PropsWithChildren } from "react";
import { WebsiteLayout } from "@/layouts/website";
export default function RootLayout({ children }: PropsWithChildren) {
  return <WebsiteLayout>{children}</WebsiteLayout>;
}
