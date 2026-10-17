import { beforeEach, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({ navigate: vi.fn(), signIn: vi.fn() }));
vi.mock("@gorth/primitive/cores/tanstack/router", () => ({
  useNavigate: () => fixture.navigate,
}));
vi.mock("@/services/auth", () => ({
  useAuthAccount: () => ({ data: null, isPending: false }),
}));
vi.mock("@/lib/auth/browser", () => ({
  authClient: { signIn: { social: fixture.signIn } },
}));
vi.mock("@/lib/auth/client", () => ({ resetCallerAuthentication: vi.fn() }));
import { useNavigation } from "@/hooks/use-navigation";
import { signIn } from "@/components/auth-actions";

beforeEach(() => {
  vi.clearAllMocks();
  fixture.signIn.mockResolvedValue({ error: null });
});

it.each([
  undefined,
  { type: "click" },
  "https://external.invalid",
  "//external.invalid",
  "/auth/sign-in?returnTo=/account",
])("rejects event objects and unsafe destinations: %j", async (input) => {
  const { auth } = useNavigation();
  (auth.login as (value?: unknown) => void)(input);
  expect(fixture.navigate).toHaveBeenCalledWith({
    to: "/auth/sign-in",
    search: { returnTo: "/account" },
  });
  await signIn(input);
  expect(fixture.signIn).toHaveBeenCalledWith({
    provider: "gorth",
    callbackURL: "/account",
    errorCallbackURL: "/auth/error",
  });
});

it("preserves an explicit internal path, query and hash", async () => {
  const path = "/account?tab=profile#name";
  const { auth } = useNavigation();
  (auth.login as (value?: unknown) => void)(path);
  expect(fixture.navigate).toHaveBeenCalledWith({
    to: "/auth/sign-in",
    search: { returnTo: path },
  });
  await signIn(path);
  expect(fixture.signIn).toHaveBeenCalledWith(
    expect.objectContaining({ callbackURL: path }),
  );
});
