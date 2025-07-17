"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useQuery } from '@tanstack/react-query';
import { fetchAllTransactions } from '@/lib/queries';
import { Transaction } from "@/lib/types";
import NetBalanceChart from "@/components/NetBalanceChart";
import { getStatisticsColumns } from "../statistics-columns";
import { SimpleTransactionTable } from "@/components/SimpleTransactionTable";
import { CategorySelector } from "@/components/ui/CategorySelector";

export default function BalanceStatisticsPage() {
  const { data: session } = useSession();
  const [fetchedUniqueCategories, setFetchedUniqueCategories] = useState<string[]>([]);

  const {
    data: transactionsData,
    isLoading: transactionsIsLoading,
    isError: transactionsIsError,
    error: transactionsError,
  } = useQuery<Transaction[], Error>({
    queryKey: ['allTransactionsForBalancePage', session?.user?.id],
    queryFn: fetchAllTransactions,
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/app-config');
        if (!response.ok) {
          throw new Error('Failed to fetch app configuration for balance page');
        }
        const data = await response.json();
        const categories = data.predefinedCategories || [];
        setFetchedUniqueCategories(categories);
      } catch (error) {
        console.error("Error fetching categories for balance page:", error);
        setFetchedUniqueCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const uniqueCategories: string[] = fetchedUniqueCategories;
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (fetchedUniqueCategories.length > 0) {
      setSelectedCategories(fetchedUniqueCategories);
    }
  }, [fetchedUniqueCategories]);

  const statisticsTableColumns = useMemo(() => getStatisticsColumns(), []);

  const displayedTransactionsForTable = useMemo(() => {
    if (!session?.user?.id || !transactionsData || transactionsData.length === 0) {
      return [];
    }

    if (selectedCategories.length === 0) {
      return [];
    }

    const currentUserId = parseInt(session.user.id, 10);

    return transactionsData.filter(transaction => {
      const isVisible = transaction.user_id === currentUserId || transaction.is_public;
      if (!isVisible) {
        return false;
      }

      const allUniqueCategoriesAreSelected = selectedCategories.length === uniqueCategories.length;
      if (allUniqueCategoriesAreSelected) {
        return true;
      }
      return selectedCategories.includes(transaction.category);
    });
  }, [transactionsData, selectedCategories, uniqueCategories, session]);

  // Updated to handle CategorySelector's API which receives the entire array
  const handleCategoriesChange = (newSelectedCategories: string[]) => {
    setSelectedCategories(newSelectedCategories);
  };

  if (transactionsIsLoading) return <div className="flex justify-center items-center h-screen"><p>Loading statistics...</p></div>;
  if (transactionsIsError) return <div className="flex justify-center items-center h-screen"><p className="text-red-500">Error: {transactionsError?.message || 'Failed to load data.'}</p></div>;
  if (!session) return <div className="flex justify-center items-center h-screen"><p>Please log in to view statistics.</p></div>;

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold tracking-tight mb-4">Balance Statistics</h1>

      <>
        <div className="mb-4">
          <CategorySelector
            uniqueCategories={uniqueCategories}
            selectedCategories={selectedCategories}
            onSelectionChange={handleCategoriesChange}
          />
        </div>

        <div className="mb-8">
          <NetBalanceChart selectedCategories={selectedCategories} />
        </div>

        <div className="">
          <SimpleTransactionTable
            columns={statisticsTableColumns}
            data={displayedTransactionsForTable}
            initialPageSize={10}
            selectedCategories={selectedCategories}
            uniqueCategories={uniqueCategories}
            onCategoryChange={category => {
              const newSelection = selectedCategories.includes(category)
                ? selectedCategories.filter(c => c !== category)
                : [...selectedCategories, category];
              setSelectedCategories(newSelection);
            }}
            onClearFilters={() => setSelectedCategories([])}
            onSelectAllCategories={() => setSelectedCategories(uniqueCategories)}
          />
        </div>
      </>
    </div>
  );
}
