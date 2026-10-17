import { Footer as PrimitiveFooter } from "@/layouts/footer";
import { Button } from "@gorth/primitive/custom/button";
import { footerSocials } from "@/utils/constant";

export function Footer() {
  return (
    <PrimitiveFooter
      mode="dashboard"
      nav={{ main: [], secondary: [] }}
      bottom={
        <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
          <span className="min-w-0 text-xs leading-3 sm:text-sm sm:leading-normal">
            Powered by Gorth, Inc. All right reserve.
          </span>
          <nav
            aria-label="Gorth social links"
            className="flex shrink-0 items-center sm:gap-2"
          >
            {footerSocials.map(({ title, url, icon: Icon }) => (
              <Button
                key={title}
                nativeButton={false}
                variant="ghost"
                size="icon"
                render={
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={title}
                  />
                }
              >
                <Icon className="size-4" />
              </Button>
            ))}
          </nav>
        </div>
      }
    />
  );
}
