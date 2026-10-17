import type { ReactNode } from "react";
import { cn } from "@gorth/primitive/cores/cn";

export function Wrapper({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("container mx-auto w-full min-w-0 px-6", className)}>
      {children}
    </div>
  );
}
