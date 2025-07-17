"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Transaction } from "@/lib/types"
import { format } from 'date-fns';
import { parseLocalDate } from "@/lib/utils";

export const getStatisticsColumns = (): ColumnDef<Transaction>[] => [
  {
    accessorKey: "date",
    header: "Date",
    // Adjust date parsing if necessary, assuming date is 'YYYY-MM-DD'
    cell: ({ row }) => {
      const dateValue = row.getValue("date") as string;
      // Use the parseLocalDate utility to avoid timezone issues
      const dateObj = parseLocalDate(dateValue);
      return format(dateObj, "MM/dd/yyyy");
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
      return <div className={`font-medium ${amount < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatted}</div>
    },
  },
]
