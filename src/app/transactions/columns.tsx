"use client";

import { ColumnDef, Column, Row, Table as TanstackTableType } from "@tanstack/react-table";
import { Transaction } from "@/lib/types";
import { parseLocalDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Define a type for the table meta if you plan to extend it
interface TableMeta {
  deleteTransaction?: (id: number) => void;
  editTransaction?: (transaction: Transaction) => void;
  // Add other functions or properties as needed
}

export const getColumns = (): ColumnDef<Transaction>[] => [
  {
    accessorKey: "date",
    header: ({ column }: { column: Column<Transaction, unknown> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<Transaction> }) => {
      const dateString = row.original.date; // This is YYYY-MM-DD string
      // Use the parseLocalDate utility to handle timezone consistently
      const localDate = parseLocalDate(dateString);
      return localDate.toLocaleDateString(); // Displays in user's locale format, using local timezone
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "category",
    header: "Category",
    filterFn: 'arrIncludesSome',
  },
  {
    accessorKey: "amount",
    header: ({ column }: { column: Column<Transaction, unknown> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-left"
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<Transaction> }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = formatCurrency(amount);
      return <div className={`text-left ${amount < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatted}</div>;
    },
  },
  {
    accessorKey: "is_public",
    header: "Type",
    cell: ({ row }: { row: Row<Transaction> }) => (row.original.is_public ? "Public" : "Private"),
  },
  {
    id: "actions",
    cell: ({ row, table }: { row: Row<Transaction>; table: TanstackTableType<Transaction> }) => {
      const transaction = row.original;
      if (!transaction.is_owner) {
        return null;
      }
      const meta = table.options.meta as TableMeta | undefined;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => meta?.editTransaction?.(transaction)}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(transaction.id.toString())}
            >
              Copy Transaction ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-700 focus:bg-red-50"
              onClick={() => meta?.deleteTransaction?.(transaction.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
