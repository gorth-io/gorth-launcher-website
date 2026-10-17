import React from "react";
import {
  type RowData,
  columnFacetingFeature,
  columnFilteringFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@gorth/primitive/cores/tanstack/table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gorth/primitive/default/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@gorth/primitive/custom/dropdown";
import {
  Select,
  SelectGroup,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gorth/primitive/custom/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@gorth/primitive/custom/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@gorth/primitive/default/popover";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@gorth/primitive/default/card";
import { Button } from "@gorth/primitive/custom/button";
import { Badge } from "@gorth/primitive/custom/badge";
import { Input } from "@gorth/primitive/default/input";
import { Checkbox } from "@gorth/primitive/default/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@gorth/primitive/custom/tabs";
import { Separator } from "@gorth/primitive/default/separator";
import { cn } from "@gorth/primitive/cores/cn";

import {
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  RotateCw,
  Plus,
  PlusCircle,
  Upload,
  Search,
  Ellipsis,
  Download,
  X,
  Rows3,
  Grid3X3,
} from "@gorth/primitive/cores/lucide";
import type {
  DataTableColumnHeaderProps,
  DataTableAllProps,
  DataTableFacetedFilterAllProps,
  DataTableFacetedFilterProps,
  DataTableFeatures,
  DataTablePaginationAllProps,
  DataTablePaginationProps,
  DataTableProps,
  DataTableSortButtonProps,
  DataTableViewOptionsProps,
  DataTableToolbarProps,
  DataTableViewToggleProps,
} from "@gorth/primitive/utils/interface";

export type {
  DataTableView,
  DataTableViewToggleProps,
} from "@gorth/primitive/utils/interface";

// Consumers decide how to render the selected layout via onValueChange.
export function DataTableViewToggle({
  value,
  defaultValue = "list",
  onValueChange,
  disabled = false,
  className,
  id,
  "aria-label": ariaLabel = "Display mode",
  listLabel = "List view",
  gridLabel = "Grid view",
}: DataTableViewToggleProps) {
  return (
    <Tabs
      id={id}
      className={className}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(nextValue) => {
        if (!disabled && (nextValue === "list" || nextValue === "grid")) {
          onValueChange?.(nextValue);
        }
      }}
    >
      <TabsList aria-label={ariaLabel}>
        <TabsTrigger
          value="list"
          className="size-9 p-0 has-[>svg]:px-0"
          disabled={disabled}
          aria-label={listLabel}
        >
          <Rows3 aria-hidden="true" className="size-4" />
        </TabsTrigger>
        <TabsTrigger
          value="grid"
          className="size-9 p-0 has-[>svg]:px-0"
          disabled={disabled}
          aria-label={gridLabel}
        >
          <Grid3X3 aria-hidden="true" className="size-4" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export function DataTableSearchInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative w-full sm:w-64">
      <Input {...props} className={cn("pl-8", className)} />
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none"
      />
    </div>
  );
}

function DataTableToolbar<TData extends RowData>({
  table,
  nav,
  labels,
  search,
  filters,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  viewToggle,
  onImport,
  onDownload,
  onCreate,
  onReload,
  onToggle,
  feat = "default",
  render,
}: DataTableToolbarProps<TData>) {
  const searchInput = search && (
    <DataTableSearchInput
      aria-label={search.placeholder}
      placeholder={search.placeholder}
      value={search.value}
      onChange={(event) => search.onValueChange(event.target.value)}
    />
  );
  const pageSizeSelect = (
    <Select
      value={String(pageSize)}
      onValueChange={(value) => {
        if (value) onPageSizeChange(Number(value));
      }}
    >
      <SelectTrigger aria-label="Rows per page" className="w-20">
        <SelectValue placeholder={pageSize} />
      </SelectTrigger>
      <SelectContent side="bottom">
        <SelectGroup>
          {pageSizeOptions.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
  const actions = (
    <>
      {onToggle && (
        <DataTableViewOptions
          table={table}
          label={labels?.toggle ?? "Toggle"}
          feat={feat}
          onToggle={onToggle}
        />
      )}
      {onImport && (
        <Button
          type="button"
          variant="outline"
          size={feat}
          onClick={onImport}
          aria-label={labels?.import ?? "Import"}
        >
          <Upload aria-hidden="true" />
          <span className={feat === "icon" ? "sr-only" : undefined}>
            {labels?.import ?? "Import"}
          </span>
        </Button>
      )}
      {onDownload && (
        <Button
          type="button"
          variant="outline"
          size={feat}
          onClick={onDownload}
          aria-label={labels?.export ?? "Export"}
        >
          <Download aria-hidden="true" />
          <span className={feat === "icon" ? "sr-only" : undefined}>
            {labels?.export ?? "Export"}
          </span>
        </Button>
      )}
      {onReload && (
        <Button
          type="button"
          variant="outline"
          size={feat}
          onClick={onReload}
          aria-label={labels?.reload ?? "Reload"}
        >
          <RotateCw aria-hidden="true" />
          <span className={feat === "icon" ? "sr-only" : undefined}>
            {labels?.reload ?? "Reload"}
          </span>
        </Button>
      )}
      {onCreate && (
        <Button
          type="button"
          size={feat}
          onClick={onCreate}
          aria-label={labels?.add ?? "Add"}
        >
          <Plus aria-hidden="true" />
          <span className={feat === "icon" ? "sr-only" : undefined}>
            {labels?.add ?? "Add"}
          </span>
        </Button>
      )}
    </>
  );

  if (!nav) {
    return (
      <CardHeader className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {searchInput}
          {filters}
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {pageSizeSelect}
          {render}
          {actions}
        </div>
      </CardHeader>
    );
  }

  return (
    <>
      <CardHeader className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          <CardTitle>{nav.name}</CardTitle>
          {nav.description && (
            <CardDescription>{nav.description}</CardDescription>
          )}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 lg:ml-auto">
          {searchInput}
          {render}
          {actions}
        </div>
      </CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">{filters}</div>
        <div className="ms-auto flex items-center gap-2">
          {pageSizeSelect}
          <DataTableViewToggle {...viewToggle} />
        </div>
      </div>
    </>
  );
}

export const dataTableFeatures: DataTableFeatures = tableFeatures({
  columnFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnFacetingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
});

export function DataTableSortButton<TData extends RowData, TValue>({
  column,
  title,
  className,
}: DataTableSortButtonProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const handleSort = () => {
    const currentSort = column.getIsSorted();

    if (currentSort === false) {
      // First click: no sort → ascending
      column.toggleSorting(false);
    } else if (currentSort === "asc") {
      // Second click: ascending → descending
      column.toggleSorting(true);
    } else {
      // Third click: descending → clear sorting
      column.clearSorting();
    }
  };

  return (
    <Button variant="ghost" onClick={handleSort}>
      <span>{title}</span>
      {column.getIsSorted() === "desc" ? (
        <ArrowDown />
      ) : column.getIsSorted() === "asc" ? (
        <ArrowUp />
      ) : (
        <ArrowUpDown />
      )}
    </Button>
  );
}

export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }
  return (
    // <div className={cn("flex items-center gap-2", className)}>
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            // size="sm"
            className="data-open:bg-accent" // -ml-3
          />
        }
      >
        <span>{title}</span>
        {column.getIsSorted() === "desc" ? (
          <ArrowDown />
        ) : column.getIsSorted() === "asc" ? (
          <ArrowUp />
        ) : (
          <ChevronsUpDown />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => column.clearSorting()}>
          <ChevronsUpDown />
          Default
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
          <ArrowUp />
          Ascending
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
          <ArrowDown />
          Descending
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
          <EyeOff />
          Hide
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    // </div>
  );
}

export function DataTablePaginationOldAll<TData extends RowData>({
  table,
  onPageChangeStart,
}: DataTablePaginationAllProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows.length;
  const totalRows = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex items-center justify-between">
      {" "}
      {/** px-2 */}
      <div className="text-muted-foreground flex-1 text-sm">
        <span className="font-bold text-primary">{selectedRows}</span> of{" "}
        <span className="font-bold text-primary">{totalRows}</span> rows
        selected.
      </div>
      <div className="flex items-center gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.state.pagination.pageSize}`}
            onValueChange={(value) => {
              onPageChangeStart?.();
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.state.pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {[7, 10, 25, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.state.pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => {
              onPageChangeStart?.();
              table.setPageIndex(0);
            }}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => {
              onPageChangeStart?.();
              table.previousPage();
            }}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => {
              onPageChangeStart?.();
              table.nextPage();
            }}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => {
              onPageChangeStart?.();
              table.setPageIndex(table.getPageCount() - 1);
            }}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DataTablePaginationAll<TData extends RowData>({
  table,
  onPageChangeStart,
}: DataTablePaginationAllProps<TData>) {
  const currentPage = table.state.pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const pageSize = table.state.pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;
  const selectedRows = table.getFilteredSelectedRowModel().rows.length;
  const firstVisibleRow =
    totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleRow = Math.min(currentPage * pageSize, totalRows);

  // Build the list of visible page numbers.
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show every page when the total is small.
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Collapse larger ranges with ellipses.
      if (currentPage <= 4) {
        // Display: 1 2 3 4 5 ... 10
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Display: 1 ... 6 7 8 9 10
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Display: 1 ... 4 5 6 ... 10
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2 text-sm text-muted-foreground">
        {/** flex-1 */}
        <div>
          Showing{" "}
          <span className="font-bold text-primary">{firstVisibleRow}</span> to{" "}
          <span className="font-bold text-primary">{lastVisibleRow}</span> of{" "}
          <span className="font-bold text-primary">{totalRows}</span> items.
        </div>
        <div>
          <span className="font-bold text-primary">{selectedRows}</span> of{" "}
          <span className="font-bold text-primary">{totalRows}</span> rows
          selected.
        </div>
      </div>
      <div className="flex items-center gap-6 lg:gap-8">
        {/* Pagination Numbers */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className=""
            onClick={() => {
              onPageChangeStart?.();
              table.previousPage();
            }}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft />
          </Button>

          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <Button
                  variant="outline"
                  size="icon"
                  className=""
                  // onClick={() => {}}
                  // disabled
                >
                  {/* <span className="px-2 text-sm text-muted-foreground">...</span> */}
                  <Ellipsis />
                </Button>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className=""
                  onClick={
                    currentPage === page
                      ? undefined
                      : () => {
                          onPageChangeStart?.();
                          table.setPageIndex((page as number) - 1);
                        }
                  }
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  <span className="">{page}</span>
                </Button>
              )}
            </React.Fragment>
          ))}

          <Button
            variant="outline"
            size="icon"
            className=""
            onClick={() => {
              onPageChangeStart?.();
              table.nextPage();
            }}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DataTablePagination<TData extends RowData>({
  table,
  onPageChangeStart,
}: DataTablePaginationProps<TData>) {
  const currentPage = table.state.pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const pageSize = table.state.pagination.pageSize;
  const totalRows = table.getRowCount();
  const selectedRows = Object.keys(table.state.rowSelection).length;
  const firstVisibleRow =
    totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleRow = Math.min(currentPage * pageSize, totalRows);
  const pageNumbers: (number | "ellipsis-start" | "ellipsis-end")[] = [];

  if (totalPages <= 7) {
    for (let page = 1; page <= totalPages; page += 1) {
      pageNumbers.push(page);
    }
  } else if (currentPage <= 4) {
    pageNumbers.push(1, 2, 3, 4, 5, "ellipsis-end", totalPages);
  } else if (currentPage >= totalPages - 3) {
    pageNumbers.push(
      1,
      "ellipsis-start",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    );
  } else {
    pageNumbers.push(
      1,
      "ellipsis-start",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis-end",
      totalPages,
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col text-sm text-muted-foreground">
        <div className="flex flex-row items-center h-4.5 gap-1">
          Showing
          <span className="font-bold text-primary">{firstVisibleRow}</span> to
          <span className="font-bold text-primary">{lastVisibleRow}</span> of
          <span className="font-bold text-primary">{totalRows}</span> items.
        </div>
        <div className="flex flex-row items-center h-4.5 gap-1">
          Selected
          <span className="font-bold text-primary">{selectedRows}</span> rows.
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            onPageChangeStart?.();
            table.previousPage();
          }}
          disabled={!table.getCanPreviousPage()}
          aria-label="Go to previous page"
        >
          <ChevronLeft />
        </Button>
        {pageNumbers.map((page) =>
          typeof page === "number" ? (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              onClick={
                currentPage === page
                  ? undefined
                  : () => {
                      onPageChangeStart?.();
                      table.setPageIndex(page - 1);
                    }
              }
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          ) : (
            <Button
              key={page}
              className=""
              variant="outline"
              size="icon"
              // aria-hidden="true"
            >
              <Ellipsis className="size-4" />
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            onPageChangeStart?.();
            table.nextPage();
          }}
          disabled={!table.getCanNextPage()}
          aria-label="Go to next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

export function DataTableViewOptions<TData extends RowData>({
  table,
  label,
  feat = label ? "default" : "icon",
  onToggle,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size={feat}
            onClick={onToggle}
            aria-label={label ?? "Toggle columns"}
          />
        }
      >
        <Settings2 />
        <span className={feat === "icon" ? "sr-only" : undefined}>
          {label ?? "Toggle columns"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide(),
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DataTableFacetedFilterAll<TData extends RowData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterAllProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  const selectedValues = new Set(
    column?.getFilterValue() as (string | number | boolean)[],
  );

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="default"
            className="h-9 w-auto gap-1 rounded-md border-dashed p-1 whitespace-nowrap"
          />
        }
      >
        <PlusCircle />
        {title}
        {selectedValues?.size > 0 && (
          <>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Badge variant="default" className="lg:hidden">
              {selectedValues.size}
            </Badge>
            <div className="hidden gap-1 lg:flex">
              {selectedValues.size > 2 ? (
                <Badge variant="default" className="font-normal">
                  {selectedValues.size} selected
                </Badge>
              ) : (
                options
                  .filter((option) => selectedValues.has(option.value))
                  .map((option) => (
                    <Badge
                      variant="default"
                      key={String(option.value)}
                      className="rounded-md px-1 font-normal"
                    >
                      {option.label}
                    </Badge>
                  ))
              )}
            </div>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-52 p-0" align="start">
        <Command className="p-0">
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={String(option.value)}
                    showCheck={false}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value);
                      } else {
                        selectedValues.add(option.value);
                      }
                      const filterValues = Array.from(selectedValues);
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined,
                      );
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      readOnly
                      tabIndex={-1}
                      aria-hidden="true"
                      className="pointer-events-none"
                    />
                    {option.icon && (
                      <option.icon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                    {facets?.get(option.value) && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {facets.get(option.value)}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center text-center"
                    showCheck={false}
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function DataTableFacetedFilter({
  title,
  options,
  value,
  onValueChange,
  getCount,
}: DataTableFacetedFilterProps) {
  const selectedValues = new Set(value);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="default"
            className="w-auto gap-2 border-dashed whitespace-nowrap"
          />
        }
      >
        <PlusCircle />
        {title}
        {selectedValues.size > 0 && (
          <>
            <Separator orientation="vertical" className="h-9" />
            <Badge variant="default" className="lg:hidden">
              {selectedValues.size}
            </Badge>
            <div className="hidden gap-1 lg:flex">
              {selectedValues.size > 2 ? (
                <Badge variant="default" className="font-normal">
                  {selectedValues.size} selected
                </Badge>
              ) : (
                options
                  .filter((option) => selectedValues.has(option.value))
                  .map((option) => (
                    <Badge
                      variant="default"
                      key={String(option.value)}
                      className=""
                    >
                      {option.label}
                    </Badge>
                  ))
              )}
            </div>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-52 p-0" align="start">
        <Command className="p-0">
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                const count = getCount?.(option.value);

                return (
                  <CommandItem
                    key={String(option.value)}
                    showCheck={false}
                    onSelect={() => {
                      const nextValues = new Set(selectedValues);

                      if (isSelected) {
                        nextValues.delete(option.value);
                      } else {
                        nextValues.add(option.value);
                      }

                      onValueChange(Array.from(nextValues));
                    }}
                    className="p-2.5 gap-2.5"
                  >
                    <Checkbox
                      checked={isSelected}
                      readOnly
                      tabIndex={-1}
                      aria-hidden="true"
                      className="pointer-events-none"
                    />
                    {option.icon && (
                      <option.icon className="text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                    {count !== undefined && (
                      <span className="ml-auto flex min-w-4 items-center justify-end font-mono text-xs">
                        {count}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onValueChange([])}
                    className="justify-center text-center"
                    showCheck={false}
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Render all data make longer time to load, but can be used for export data
export function DataTableAll<TData extends RowData>({
  columns,
  data,
  nav,
  feat = "default",
  onToggle,
  labels,
  onImport,
  viewToggle,
  search,
  filters,
  fluidColumn,
  initialPageSize = 10,
  pageSizeOptions = [7, 10, 25, 50, 100],
  getRowId,
  enableRowSelection = true,
  emptyMessage = "No data available.",
  onRowClick,
  onReload,
  onDownload,
  onCreate,
  render,
}: DataTableAllProps<TData>) {
  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    getRowId,
    enableRowSelection,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: initialPageSize,
      },
    },
  });

  const isFiltered = table.state.columnFilters.length > 0;

  return (
    <Card className="gap-0 p-0">
      <DataTableToolbar
        table={table}
        nav={nav}
        feat={feat}
        onToggle={onToggle}
        labels={labels}
        onImport={onImport}
        onDownload={onDownload}
        onCreate={onCreate}
        onReload={onReload}
        render={render}
        viewToggle={viewToggle}
        pageSizeOptions={pageSizeOptions}
        search={
          search
            ? {
                placeholder: search.placeholder,
                value:
                  (table.getColumn(search.column)?.getFilterValue() as
                    string | undefined) ?? "",
                onValueChange: (value) => {
                  table.getColumn(search.column)?.setFilterValue(value);
                  table.setPageIndex(0);
                },
              }
            : undefined
        }
        filters={
          <>
            {filters?.map((filter) => (
              <DataTableFacetedFilterAll
                key={filter.column}
                column={table.getColumn(filter.column)}
                title={filter.title}
                options={filter.options}
              />
            ))}
            {isFiltered && (
              <Button
                type="button"
                variant="ghost"
                size="default"
                onClick={() => {
                  table.resetColumnFilters();
                  table.setPageIndex(0);
                }}
              >
                <X aria-hidden="true" />
                Reset filters
              </Button>
            )}
          </>
        }
        pageSize={table.state.pagination.pageSize}
        onPageSizeChange={(pageSize) => {
          table.setPageSize(pageSize);
          table.setPageIndex(0);
        }}
      />
      <div className="border-y">
        <Table className="w-full table-fixed">
          <TableHeader className="h-12">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const isColumn = header.column.id === fluidColumn;

                  return (
                    <TableHead
                      key={`${header.id}-${index}`}
                      style={{
                        width: isColumn ? "auto" : `${header.getSize()}px`,
                        minWidth: isColumn ? "200px" : undefined,
                      }}
                      className={cn("h-14", isColumn ? "w-auto" : "")}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell, index) => {
                    const isColumn = cell.column.id === fluidColumn;

                    return (
                      <TableCell
                        key={`${cell.id}-${index}`}
                        style={{
                          width: isColumn
                            ? "auto"
                            : `${cell.column.getSize()}px`,
                          minWidth: isColumn ? "200px" : undefined,
                        }}
                        className={cn("h-16", isColumn ? "w-auto" : "")}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <CardFooter className="block py-6">
        <DataTablePaginationAll table={table} />
      </CardFooter>
    </Card>
  );
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  nav,
  feat = "default",
  onToggle,
  labels,
  onImport,
  viewToggle,
  rowCount,
  pagination,
  onPaginationChange,
  search,
  filters,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  fluidColumn,
  pageSizeOptions = [8, 10, 25, 50, 100],
  getRowId,
  enableRowSelection = true,
  emptyMessage = "No data available.",
  loading = false,
  loadingMessage = "Loading...",
  onRowClick,
  onReload,
  onDownload,
  onCreate,
  render,
}: DataTableProps<TData>) {
  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    getRowId,
    enableRowSelection,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    rowCount: Math.max(0, rowCount),
    state: {
      pagination,
      ...(sorting ? { sorting } : {}),
      ...(columnFilters ? { columnFilters } : {}),
    },
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
  });

  const isFiltered =
    Boolean(search?.value.trim()) ||
    Boolean(filters?.some((filter) => filter.value.length > 0)) ||
    Boolean(columnFilters?.length);

  const resetPage = () => {
    if (pagination.pageIndex !== 0) {
      onPaginationChange({ ...pagination, pageIndex: 0 });
    }
  };

  const resetFilters = () => {
    search?.onValueChange("");
    filters?.forEach((filter) => filter.onValueChange([]));
    onColumnFiltersChange?.([]);
    resetPage();
  };

  return (
    <Card className="gap-0 p-0" aria-busy={loading}>
      <DataTableToolbar
        table={table}
        nav={nav}
        feat={feat}
        onToggle={onToggle}
        labels={labels}
        onImport={onImport}
        onDownload={onDownload}
        onCreate={onCreate}
        onReload={onReload}
        render={render}
        viewToggle={viewToggle}
        pageSizeOptions={pageSizeOptions}
        search={
          search
            ? {
                ...search,
                onValueChange: (value) => {
                  search.onValueChange(value);
                  resetPage();
                },
              }
            : undefined
        }
        filters={
          <>
            {filters?.map((filter) => (
              <DataTableFacetedFilter
                key={filter.id}
                title={filter.title}
                options={filter.options}
                value={filter.value}
                getCount={filter.getCount}
                onValueChange={(value) => {
                  filter.onValueChange(value);
                  resetPage();
                }}
              />
            ))}
            {isFiltered && (
              <Button
                type="button"
                variant="ghost"
                size="default"
                onClick={resetFilters}
              >
                <X aria-hidden="true" />
                Reset filters
              </Button>
            )}
          </>
        }
        pageSize={pagination.pageSize}
        onPageSizeChange={(pageSize) => {
          onPaginationChange({ pageIndex: 0, pageSize });
        }}
      />
      <div className="border-y">
        <Table className="w-full table-fixed">
          <TableHeader className="h-12">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const isColumn = header.column.id === fluidColumn;

                  return (
                    <TableHead
                      key={`${header.id}-${index}`}
                      style={{
                        width: isColumn ? "auto" : `${header.getSize()}px`,
                        minWidth: isColumn ? "200px" : undefined,
                      }}
                      className={cn("h-14", isColumn ? "w-auto" : "")}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading && data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {loadingMessage}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell, index) => {
                    const isColumn = cell.column.id === fluidColumn;

                    return (
                      <TableCell
                        key={`${cell.id}-${index}`}
                        style={{
                          width: isColumn
                            ? "auto"
                            : `${cell.column.getSize()}px`,
                          minWidth: isColumn ? "200px" : undefined,
                        }}
                        className={cn("h-14", isColumn ? "w-auto" : "")}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <CardFooter className="block py-6">
        <DataTablePagination table={table} />
      </CardFooter>
    </Card>
  );
}

// export const columns: ColumnDef<DataTableFeatures, Payment>[] = [
//   {
//     id: "select",
//     header: ({ table }) => (
//       <Checkbox
//         checked={
//           table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected()
//         }
//         onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
//         aria-label="Select all"
//       />
//     ),
//     cell: ({ row }) => (
//       <Checkbox
//         checked={row.getIsSelected()}
//         onCheckedChange={(value) => row.toggleSelected(!!value)}
//         aria-label="Select row"
//       />
//     ),
//     enableSorting: false,
//     enableHiding: false,
//     // enableResizing: false,
//     size: 50, // Checkbox column width
//   },
//   {
//     accessorKey: "pro",
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title="Profile" />
//     ),
//     cell: ({ row }) => {
//       const user = row.original;
//       return (
//         <div className="flex items-center gap-3">
//           <div className="flex-shrink-0">
//             {user.avatar ? (
//               <Image
//                 className="h-9 w-9 rounded-md object-cover"
//                 src={user.avatar}
//                 alt="avatar"
//                 width={36}
//                 height={36}
//               />
//             ) : (
//               <div className="h-9 w-9 rounded-md bg-accent flex items-center justify-center">
//                 <span className="text-sm font-medium text-primary">
//                   {user.firstname?.[0] ?? "J"}
//                   {user.lastname?.[0] ?? "G"}
//                 </span>
//               </div>
//             )}
//           </div>
//           <div className="min-w-0 flex-1">
//             <div className="truncate lowercase">{user.email}</div>
//             <div className="truncate text-xs text-muted-foreground">
//               {user.username ?? "japtor"} | {user.phone_number || "No phone"}
//             </div>
//           </div>
//         </div>
//       );
//     },
//     size: 300, // Profile column width
//   },
//   {
//     accessorKey: "user",
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title="User" />
//     ),
//     filterFn: (row, id, value) => {
//       return value.includes(row.getValue(id));
//     },
//     size: 200, // User column width
//   },
//   {
//     accessorKey: "email",
//     // header: "Email",
//     header: ({ column }) => (
//       <DataTableSortButton column={column} title="Email" />
//     ),
//   },
//   {
//     accessorKey: "status",
//     header: "Status",
//     filterFn: (row, id, value) => {
//       return value.includes(row.getValue(id));
//     },
//     size: 120, // Status column width
//   },
//   // {
//   //   accessorKey: "amount",
//   //   // header: "Amount",
//   //   header: () => <div className="text-right">Amount</div>,
//   //   cell: ({ row }) => {
//   //     // const amount = parseFloat(row.getValue("amount"))
//   //     // const formatted = new Intl.NumberFormat("vi-VN", {
//   //     //   style: "currency",
//   //     //   currency: "VND",
//   //     // }).format(amount)
//   //     const formatted = formatCurrency({
//   //       value: row.getValue("amount"),
//   //       currency: "VND"
//   //     })
//   //
//   //     return <div className="text-right font-medium">{formatted}</div>
//   //   },
//   //   size: 120, // Amount column width
//   // },
//   {
//     id: "actions",
//     // accessorKey: "actions",
//     // header: () => <div className="text-right">Actions</div>,
//     enableResizing: false,
//     size: 50, // Actions column width
//     cell: ({ row }) => {
//       const payment = row.original;

//       return (
//         <DropdownMenu>
//           <DropdownMenuTrigger
//             render={
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="p-0" // h-8 w-8
//               />
//             }
//           >
//             <span className="sr-only">Open menu</span>
//             <MoreHorizontal />
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             {/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}
//             <DropdownMenuItem
//               onClick={() => navigator.clipboard.writeText(payment.id)}
//             >
//               Copy payment ID
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem>View customer</DropdownMenuItem>
//             <DropdownMenuItem>View payment details</DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem>Edit</DropdownMenuItem>
//             <DropdownMenuItem>Duplicate</DropdownMenuItem>
//             <DropdownMenuItem>Favorite</DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuSub>
//               <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
//               <DropdownMenuPortal>
//                 <DropdownMenuSubContent>
//                   <DropdownMenuItem>Pending</DropdownMenuItem>
//                   <DropdownMenuItem>Confirmed</DropdownMenuItem>
//                   <DropdownMenuItem>Preparing</DropdownMenuItem>
//                   <DropdownMenuItem>Ready</DropdownMenuItem>
//                   <DropdownMenuItem>Served</DropdownMenuItem>
//                   <DropdownMenuItem>Completed</DropdownMenuItem>
//                   <DropdownMenuItem>Cancelled</DropdownMenuItem>
//                 </DropdownMenuSubContent>
//               </DropdownMenuPortal>
//             </DropdownMenuSub>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       );
//     },
//   },
// ];

// export const statuses = [
//   {
//     value: "pending",
//     label: "Pending",
//     icon: HelpCircle,
//   },
//   {
//     value: "processing",
//     label: "Processing",
//     icon: Timer,
//   },
//   {
//     value: "success",
//     label: "Success",
//     icon: CheckCircle,
//   },
//   {
//     value: "failed",
//     label: "Failed",
//     icon: CircleOff,
//   },
// ];

// export const priorities = [
//   {
//     label: "Low",
//     value: "low",
//     icon: ArrowDown,
//   },
//   {
//     label: "Medium",
//     value: "medium",
//     icon: ArrowRight,
//   },
//   {
//     label: "High",
//     value: "high",
//     icon: ArrowUp,
//   },
// ];

// export type Payment = {
//   id: string;
//   amount: number;
//   user: string;
//   status: "pending" | "processing" | "success" | "failed";
//   email: string;
//   avatar?: string;
//   firstname?: string;
//   lastname?: string;
//   username?: string;
//   phone_number?: string;
// };
