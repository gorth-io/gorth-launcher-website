import {
  Box,
  Gamepad2,
  LayoutGrid,
  Plus,
  Settings,
} from "@gorth/primitive/cores/lucide";

export function ProductPreview() {
  return (
    <figure
      aria-label="Illustrated launcher interface preview"
      className="rounded-xl border bg-card p-2 shadow-sm"
    >
      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="flex h-12 items-center gap-2 border-b bg-muted/50 px-3">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-green-400" />
          <span className="ml-auto text-xs text-muted-foreground">
            Gorth Launcher
          </span>
        </div>
        <div className="flex min-h-76">
          <div className="flex w-14 shrink-0 flex-col items-center gap-4 border-r p-2.5">
            <Gamepad2 className="mt-2 size-5" />
            <LayoutGrid className="size-4 text-muted-foreground" />
            <Settings className="mt-auto mb-2 size-4 text-muted-foreground" />
          </div>
          <div className="flex-1 bg-gradient-to-br from-emerald-500/10 to-background p-6">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xl font-semibold">Your library</p>
              <Plus className="size-4" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["Vanilla", "Modded"].map((name, index) => (
                <div key={name} className="rounded-lg border bg-card p-3">
                  <div
                    className={
                      index
                        ? "mb-3 flex h-24 items-center justify-center rounded-md bg-teal-500/15"
                        : "mb-3 flex h-24 items-center justify-center rounded-md bg-emerald-500/15"
                    }
                  >
                    <Box className="size-8" />
                  </div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Minecraft instance
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <figcaption className="px-2 pt-3 pb-1 text-xs text-muted-foreground">
        Interface preview · Gorth Launcher
      </figcaption>
    </figure>
  );
}
