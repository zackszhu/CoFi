"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  getFilteredRowModel,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface SimpleTransactionTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  initialPageSize?: number
  selectedCategories: string[]
  uniqueCategories: string[]
  onCategoryChange: (category: string) => void
  onClearFilters: () => void
  onSelectAllCategories: () => void
}

export function SimpleTransactionTable<TData, TValue>({
  columns,
  data,
  initialPageSize = 10,
  selectedCategories,
  uniqueCategories,
  onCategoryChange,
  onClearFilters,
  onSelectAllCategories,
}: SimpleTransactionTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: initialPageSize,
      },
    },
  })

  return (
    <div className="space-y-4">
      {/* Pagination Controls and Category Filter - Using justify-between */}
      {/* Removed py-4 from this div to reduce vertical margins */}
      <div className="flex items-center justify-between space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10">
              Categories
              {selectedCategories.length > 0 && selectedCategories.length < uniqueCategories.length && ` (${selectedCategories.length})`}
              {selectedCategories.length === uniqueCategories.length && uniqueCategories.length > 0 && " (All)"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {uniqueCategories.map((category) => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => onCategoryChange(category)}
              >
                {category}
              </DropdownMenuCheckboxItem>
            ))}
            {selectedCategories.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onClearFilters} className="text-red-600 focus:text-red-700">
                  Clear Filters
                </DropdownMenuItem>
              </>
            )}
            {selectedCategories.length < uniqueCategories.length && uniqueCategories.length > 0 && (
              <>
                {selectedCategories.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={onSelectAllCategories}>
                  Select All
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Pagination buttons on the right */}
        <div className="flex items-center space-x-2">
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No transactions match the current filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
