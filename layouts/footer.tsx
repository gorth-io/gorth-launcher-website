import { Link } from "@gorth/primitive/cores/tanstack/router";
import { Button } from "@gorth/primitive/custom/button";
import { useLayout } from "@gorth/primitive/providers/layout";
import { cn } from "@gorth/primitive/cores/cn";
import { FooterProps } from "@gorth/primitive/utils/interface";

export function Footer({
  top,
  middle,
  bottom,
  nav,
  mode = "navbar",
}: FooterProps) {
  const { variant } = useLayout();
  const dashboard = mode === "dashboard";
  const floating = variant === "floating";
  const inset = variant === "inset";

  const footerTop = !dashboard ? (
    <div
      className={cn(
        "w-full",
        !floating &&
          "bg-background/95 shadow-[inset_0_1px_0_var(--border)] backdrop-blur supports-[backdrop-filter]:bg-background/80",
        floating &&
          "rounded-lg bg-background/95 shadow-sm ring-1 ring-sidebar-border backdrop-blur supports-[backdrop-filter]:bg-background/80",
      )}
    >
      <div data-slot="footer-top" className="py-6">
        <div
          className={cn(
            "mx-auto grid w-full grid-cols-1 gap-8 px-6 sm:grid-cols-2 lg:grid-cols-6",
            !floating && "container",
          )}
        >
          <div className="flex min-w-0 flex-col items-start lg:col-span-2">
            <div className="flex min-h-9 items-center">
              {top ?? (
                <Button
                  nativeButton={false}
                  render={<Link to="/" />}
                  variant="ghost"
                  className="px-0 text-lg font-bold hover:bg-transparent"
                >
                  Gorth
                </Button>
              )}
            </div>

            {middle ? (
              <div className="mt-4 w-full text-sm text-muted-foreground">
                {middle}
              </div>
            ) : null}
          </div>

          {(nav?.main ?? []).slice(0, 4).map((group) => (
            <nav
              key={`${group.title}-${group.url}`}
              aria-label={group.title}
              className="flex min-w-0 flex-col items-start gap-3"
            >
              {group.url && group.url !== "#" ? (
                <Link
                  to={group.url}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {group.title}
                </Link>
              ) : (
                <p className="text-sm font-medium text-muted-foreground">
                  {group.title}
                </p>
              )}

              <div className="flex flex-col items-start gap-2.5">
                {group.items?.map((item) => (
                  <Link
                    key={`${item.title}-${item.url}`}
                    to={item.url}
                    className="text-sm font-medium text-foreground hover:text-primary"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </nav>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  const copyright = (
    <div
      data-slot="footer-copyright"
      className={cn(
        "h-14 w-full bg-background/95 text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80",
        floating && "rounded-lg shadow-sm ring-1 ring-sidebar-border",
        !floating && "shadow-[inset_0_1px_0_var(--border)]",
        inset && "rounded-b-xl",
      )}
    >
      <div className="container mx-auto h-14 w-full">
        <div className="mx-auto flex h-full items-center gap-2 px-6">
          {bottom}
        </div>
      </div>
    </div>
  );

  return (
    <footer
      data-layout={variant}
      data-mode={mode}
      className={cn(
        "w-full shrink-0",
        !floating &&
          !dashboard &&
          "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        inset && "rounded-b-xl",
      )}
    >
      {floating ? (
        <div className="container mx-auto flex w-full flex-col gap-2 px-6 py-2">
          {footerTop}
          {copyright}
        </div>
      ) : (
        <>
          {footerTop}
          {copyright}
        </>
      )}
    </footer>
  );
}
