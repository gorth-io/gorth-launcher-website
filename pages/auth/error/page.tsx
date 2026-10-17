import { Link } from "@gorth/primitive/cores/tanstack/router";
import { Button } from "@gorth/primitive/custom/button";
import { ShieldAlert } from "@gorth/primitive/cores/lucide";
import { Wrapper } from "@/layouts/wrapper";
import { SignInButton } from "@/components/auth-actions";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from "@gorth/primitive/default/empty";

export default function AuthErrorPage() {
  return (
    <Wrapper className="flex flex-1 py-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldAlert />
          </EmptyMedia>
          <EmptyTitle>
            <h1>Unable to sign in</h1>
          </EmptyTitle>
          <EmptyDescription>
            The sign-in request expired or Gorth SSO is not configured yet.
            Please try again. Website setup requires a registered SSO client and
            a database.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <SignInButton label="Try again" />
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to="/" />}
            >
              Back home
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </Wrapper>
  );
}
