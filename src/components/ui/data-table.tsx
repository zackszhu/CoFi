"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  HeaderGroup,
  Header,
  Row,
  Cell,
  Column,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategorySelector } from "@/components/ui/CategorySelector";

// Define an interface for rows that might have an is_owner property
interface RowWithOptionalOwner {
  is_owner?: boolean;
}

interface DataTableProps<TData extends RowWithOptionalOwner, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterColumnId?: string;
  filterPlaceholder?: string;
  meta?: Record<string, unknown>;
  uniqueCategories?: string[];
  onOpenAddTransactionDialog?: () => void;
}

export function DataTable<TData extends RowWithOptionalOwner, TValue>({
  columns,
  data,
  filterColumnId = "description",
  filterPlaceholder = "Filter items...",
  meta,
  uniqueCategories = [],
  onOpenAddTransactionDialog,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);

  // Track whether categories have been initialized to avoid resetting when users select none
  const [categoriesInitialized, setCategoriesInitialized] = React.useState(false);
  
  // Only initialize selectedCategories once when uniqueCategories first becomes available
  // or when uniqueCategories changes in a way that would make selectedCategories invalid
  React.useEffect(() => {
    // Only initialize categories if we haven't done so already
    if (!categoriesInitialized && uniqueCategories.length > 0) {
      console.log('Initializing categories for the first time');
      setSelectedCategories(uniqueCategories);
      setCategoriesInitialized(true);
    } else if (categoriesInitialized && !selectedCategories.every(cat => uniqueCategories.includes(cat))) {
      // Handle case where categories change and current selection becomes invalid
      console.log('Categories changed, updating selection');
      setSelectedCategories(uniqueCategories);
    }
  }, [uniqueCategories, selectedCategories, categoriesInitialized]);

  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta,
  });

  React.useEffect(() => {
    console.log('DataTable: useEffect for category filtering', { selectedCategories });
    const categoryColumn = table.getColumn("category");
    if (categoryColumn) {
      if (selectedCategories.length === 0) {
        console.log('Setting category filter to null to show all transactions');
        // Instead of empty array, try using null which is more explicit about showing everything
        categoryColumn.setFilterValue(null);
      } else {
        console.log('Setting category filter to', selectedCategories);
        categoryColumn.setFilterValue(selectedCategories);
      }
    }
  }, [selectedCategories, table]);

  return (
    <div>
      <div className="flex items-center pb-4 space-x-2">
        {/* Left-aligned group (filters) - Added flex-1 to make it grow */}
        <div className="flex-1 flex items-center space-x-2">
          {filterColumnId && (
            <Input
              placeholder={filterPlaceholder}
              value={(table.getColumn(filterColumnId)?.getFilterValue() as string) ?? ""}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                table.getColumn(filterColumnId)?.setFilterValue(event.target.value)
              }
              className="max-w-sm h-10"
            />
          )}
          {uniqueCategories.length > 0 && (
            <CategorySelector
              uniqueCategories={uniqueCategories}
              selectedCategories={selectedCategories}
              onSelectionChange={setSelectedCategories}
            />
          )}
        </div>

        <div className="ml-auto flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column: Column<TData, unknown>) => column.getCanHide())
                .map((column: Column<TData, unknown>) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value: boolean) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {onOpenAddTransactionDialog && (
            <Button
              variant="outline"
              className="h-10"
              onClick={onOpenAddTransactionDialog}
            >
              Add Transaction
            </Button>
          )}
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: Header<TData, unknown>) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<TData>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`${row.original.is_owner === false ? 'bg-gray-50 hover:bg-gray-100' : ''}`}
                >
                  {row.getVisibleCells().map((cell: Cell<TData, unknown>) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
