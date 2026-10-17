import { Link } from "@gorth/primitive/cores/tanstack/router";
import { LayoutGrid, PlusCircle } from "@gorth/primitive/cores/lucide";

import { Button } from "@gorth/primitive/custom/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@gorth/primitive/default/popover";
import { NavSubItem } from "@gorth/primitive/utils/interface";

export function Shortcut({ shortcuts }: { shortcuts: NavSubItem[] }) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label="Mở lối tắt"
            className="size-9 rounded-md"
            size="icon"
            variant="ghost"
          />
        }
      >
        <LayoutGrid className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(92vw,22rem)] gap-0 overflow-hidden p-0"
        sideOffset={10}
      >
        <div className="flex h-14 items-center justify-between gap-2.5 border-b ps-5 pe-2.5">
          <PopoverTitle className="font-semibold">Shortcuts</PopoverTitle>
          <Button
            aria-label="Add shortcut"
            className="size-9"
            size="icon"
            variant="ghost"
          >
            <PlusCircle className="size-4" />
          </Button>
          <PopoverDescription className="sr-only">Shortcuts</PopoverDescription>
        </div>
        <div className="grid max-h-[calc(27rem-1px)] grid-cols-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.title}
              className="flex min-h-36 flex-col items-center justify-center gap-3 border-b border-r p-4 text-center transition-colors hover:bg-muted"
              to={shortcut.url.split("#")[0] || "/"}
              hash={shortcut.url.split("#")[1]}
            >
              <span className="grid size-12 place-items-center rounded-lg bg-muted">
                {shortcut.icon ? (
                  <shortcut.icon className="size-5" />
                ) : (
                  <LayoutGrid className="size-5" />
                )}
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-medium">{shortcut.title}</span>
                <span className="text-xs text-muted-foreground">
                  {shortcut.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
