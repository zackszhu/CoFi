"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useSession } from "next-auth/react";
import { Transaction } from "@/lib/types";
import NetBalanceChart from "@/components/NetBalanceChart";
import { PREDEFINED_CATEGORIES } from "@/lib/constants";
import { getStatisticsColumns } from "./statistics-columns";
import { SimpleTransactionTable } from "@/components/SimpleTransactionTable";

export default memo(function StatisticsPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(PREDEFINED_CATEGORIES);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/transactions/all');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error: ${response.status}`);
        }
        const data: Transaction[] = await response.json();
        setTransactions(data);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message || "Failed to fetch transaction data.");
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const statisticsTableColumns = useMemo(() => getStatisticsColumns(), []);

  const displayedTransactionsForTable = useMemo(() => {
    if (!session?.user?.id || transactions.length === 0) {
      return [];
    }

    // If no categories are selected from the filter, the table should be empty.
    if (selectedCategories.length === 0) {
      return [];
    }

    const currentUserId = parseInt(session.user.id, 10);

    return transactions.filter(transaction => {
      const isVisible = transaction.user_id === currentUserId || transaction.is_public;
      if (!isVisible) {
        return false;
      }

      // If all unique categories are selected (e.g., user clicked "Select All"), show the transaction.
      // Otherwise, show only if the transaction's category is in the selected list.
      const allUniqueCategoriesAreSelected = selectedCategories.length === PREDEFINED_CATEGORIES.length;
      if (allUniqueCategoriesAreSelected) {
        return true;
      }
      return selectedCategories.includes(transaction.category);
    });
  }, [transactions, selectedCategories, session]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  const handleSelectAllCategories = useCallback(() => {
    setSelectedCategories(PREDEFINED_CATEGORIES);
  }, []);

  if (isLoading) return <div className="flex justify-center items-center h-screen"><p>Loading statistics...</p></div>;
  if (error) return <div className="flex justify-center items-center h-screen"><p className="text-red-500">Error: {error}</p></div>;
  if (!session) return <div className="flex justify-center items-center h-screen"><p>Please log in to view statistics.</p></div>;

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Statistics</h1>

      <>
        <div className="mb-12">
          <NetBalanceChart selectedCategories={selectedCategories} />
        </div>

        {/* Transaction Table Section */}
        <div className="mt-8">
          <SimpleTransactionTable
            columns={statisticsTableColumns}
            data={displayedTransactionsForTable}
            initialPageSize={10}
            selectedCategories={selectedCategories}
            uniqueCategories={PREDEFINED_CATEGORIES}
            onCategoryChange={handleCategoryChange}
            onClearFilters={handleClearFilters}
            onSelectAllCategories={handleSelectAllCategories}
          />
        </div>
      </>
    </div>
  );
})
