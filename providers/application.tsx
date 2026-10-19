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
import {
  ProgressProvider,
  Progress,
  Bar,
} from "@gorth/primitive/cores/progress/react";

// Compose Primitive's providers using the framework-independent progress API.
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
              <ProgressProvider
                height="2px"
                options={{ showSpinner: false, template: null }}
                shallowRouting
              >
                <Progress>
                  <Bar className="bg-primary!" />
                </Progress>
                <Toaster>
                  <TooltipProvider>{children}</TooltipProvider>
                </Toaster>
              </ProgressProvider>
            </LayoutProvider>
          </DirectionProvider>
        </FontProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
