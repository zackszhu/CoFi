"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { Transaction } from "@/lib/types";
import AddTransactionForm from "@/components/AddTransactionForm";
import CSVImportDialog from "@/components/CSVImportDialog";
import { DataTable } from "@/components/ui/data-table";
import { getColumns } from "./columns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function TransactionsPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [fetchedCategories, setFetchedCategories] = useState<string[]>([]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/app-config');
        if (!response.ok) {
          throw new Error('Failed to fetch app configuration');
        }
        const data = await response.json();
        setFetchedCategories(data.predefinedCategories || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setFetchedCategories([]); // Fallback to empty array on error
      }
    };
    fetchCategories();
  }, []);

  // useCallback for fetching transactions
  const fetchTransactionsCallback = useCallback(async () => {
    if (!session?.user?.id) {
      setTransactions([]);
      // console.warn("Please log in to view transactions."); // Optional: set error if not logged in
      return;
    }
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch transactions');
      }
      const data: Transaction[] = await response.json();
      // Sort transactions: newest first by date, then by creation time
      setTransactions(data.sort((a, b) => {
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }));
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message || "An unexpected error occurred while fetching transactions.");
      } else {
        console.error("An unexpected error occurred while fetching transactions.");
      }
      setTransactions([]); // Clear transactions on error
    }
  }, [session]); // Dependency: session. setIsLoading, setError, setTransactions are stable from useState.

  useEffect(() => {
    fetchTransactionsCallback();
  }, [fetchTransactionsCallback]);

  const handleOpenAddTransactionDialog = () => {
    setEditingTransaction(null);
    setIsAddDialogOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsAddDialogOpen(true);
  };

  const handleTransactionSaved = () => {
    // No longer need to manually update transactions state here, just re-fetch.
    fetchTransactionsCallback(); // Re-fetch all transactions
    setIsAddDialogOpen(false);
    setEditingTransaction(null); // Reset editing state
  };

  const handleImportSuccess = () => {
    fetchTransactionsCallback(); // Re-fetch all transactions after import
  };

  const handleDeleteTransaction = async (_id: number) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }
    try {
      const response = await fetch(`/api/transactions/${_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete transaction');
      }
      setTransactions(prevTransactions =>
        prevTransactions.filter(tx => tx.id !== _id)
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message || "An unexpected error occurred while deleting.");
      } else {
        console.error("An unexpected error occurred while deleting.");
      }
      console.error(err);
    }
  };

  const uniqueCategories = fetchedCategories;

  const userId = session?.user?.id;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <CSVImportDialog onImportSuccess={handleImportSuccess} />
      </div>
      {session?.user?.name && (
        <p className="mb-4">Manage your transactions here, {session.user.name}.</p>
      )}

      <DataTable
        columns={getColumns()}
        data={transactions}
        uniqueCategories={uniqueCategories} // Pass predefined categories
        meta={{
          deleteTransaction: handleDeleteTransaction,
          editTransaction: handleEditTransaction,
        }}
        onOpenAddTransactionDialog={handleOpenAddTransactionDialog}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
        setIsAddDialogOpen(isOpen);
        if (!isOpen) {
          setEditingTransaction(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTransaction ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
            <DialogDescription>
              {editingTransaction ? "Update the details of your transaction." : "Fill in the details to add a new transaction."}
            </DialogDescription>
          </DialogHeader>
          {userId && (
            <AddTransactionForm
              userId={parseInt(userId, 10)}
              onTransactionSaved={handleTransactionSaved}
              transactionToEdit={editingTransaction}
              categories={fetchedCategories} // Pass categories as prop
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
