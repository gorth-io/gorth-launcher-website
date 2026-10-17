import { Link } from "@gorth/primitive/cores/tanstack/router";
import { Button } from "@gorth/primitive/custom/button";
import { Wrapper } from "@/layouts/wrapper";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@gorth/primitive/default/empty";

export default function NotFound() {
  return (
    <Wrapper className="flex flex-1 py-6">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>
            <h1>Page not found</h1>
          </EmptyTitle>
          <EmptyDescription>
            This page does not exist. Let&apos;s get you back home.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link to="/" />}>
            Back home
          </Button>
        </EmptyContent>
      </Empty>
    </Wrapper>
  );
}
