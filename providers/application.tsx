import { useState, type PropsWithChildren } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@gorth/primitive/cores/tanstack/query";
import { ThemeProvider } from "@gorth/primitive/providers/theme";
import { FontProvider } from "@gorth/primitive/providers/font";
import { DirectionProvider } from "@gorth/primitive/providers/direction";
import { LayoutProvider } from "@gorth/primitive/providers/layout";
import { TooltipProvider } from "@gorth/primitive/default/tooltip";
import { Toaster } from "@gorth/primitive/custom/toast";

// Composes the original Primitive providers without Next navigation/progress.
export function ApplicationProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" disableTransitionOnChange>
        <FontProvider>
          <DirectionProvider>
            <LayoutProvider>
              <Toaster>
                <TooltipProvider>{children}</TooltipProvider>
              </Toaster>
            </LayoutProvider>
          </DirectionProvider>
        </FontProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
