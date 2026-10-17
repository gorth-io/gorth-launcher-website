import { ProductIcon, product } from "@/utils/constant";
import { cn } from "@gorth/primitive/cores/cn";

export function AppBrand({
  variant = "header",
}: {
  variant?: "header" | "footer";
}) {
  return (
    <span
      aria-label={product.name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-primary text-primary-foreground",
        variant === "footer" ? "size-14 rounded-lg" : "size-9 rounded-md",
      )}
    >
      <ProductIcon
        aria-hidden
        className={variant === "footer" ? "size-9" : "size-4"}
      />
    </span>
  );
}
