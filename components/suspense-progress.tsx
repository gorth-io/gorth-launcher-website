import { useEffect } from "react";
import { useRouterState } from "@gorth/primitive/cores/tanstack/router";
import { useProgress } from "@gorth/primitive/cores/progress/react";

// React BProgress has no Next.js dependency. TanStack owns route completion,
// including browser back/forward; query-only transitions stay shallow.
export function SuspenseProgress() {
  const pending = useRouterState({
    select: (state) =>
      state.status === "pending" &&
      state.location.pathname !== state.resolvedLocation?.pathname,
  });
  const { start, stop } = useProgress();
  useEffect(() => {
    if (pending) start();
    else stop();
  }, [pending, start, stop]);
  useEffect(() => () => stop(), [stop]);
  return null;
}
