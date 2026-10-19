import { beforeEach, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  cleanups: [] as Array<() => void>,
  state: {
    status: "idle",
    location: { pathname: "/" },
    resolvedLocation: { pathname: "/" },
  },
}));
vi.mock("react", () => ({
  useEffect: (effect: () => void | (() => void)) => {
    const cleanup = effect();
    if (cleanup) fixture.cleanups.push(cleanup);
  },
}));
vi.mock("@gorth/primitive/cores/progress/react", () => ({
  useProgress: () => fixture,
}));
vi.mock("@gorth/primitive/cores/tanstack/router", () => ({
  useRouterState: ({
    select,
  }: {
    select: (state: typeof fixture.state) => boolean;
  }) => select(fixture.state),
}));
import { SuspenseProgress } from "@/components/suspense-progress";

beforeEach(() => {
  fixture.cleanups = [];
  vi.clearAllMocks();
  fixture.state = {
    status: "idle",
    location: { pathname: "/" },
    resolvedLocation: { pathname: "/" },
  };
});
it("starts on a pending pathname transition and finishes when resolved", () => {
  fixture.state.status = "pending";
  fixture.state.location.pathname = "/download";
  SuspenseProgress();
  expect(fixture.start).toHaveBeenCalledOnce();
  fixture.state.status = "idle";
  SuspenseProgress();
  expect(fixture.stop).toHaveBeenCalledOnce();
});
it("does not start on shallow transitions and cleans up on unmount", () => {
  fixture.state.status = "pending";
  SuspenseProgress();
  expect(fixture.start).not.toHaveBeenCalled();
  fixture.stop.mockClear();
  fixture.cleanups.forEach((cleanup) => cleanup());
  expect(fixture.stop).toHaveBeenCalledOnce();
});
