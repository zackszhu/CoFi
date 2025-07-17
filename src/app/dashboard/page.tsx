"use client";

import React, { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@/lib/types";
import { fetchAllTransactions, fetchAllTransactionsForStats } from "@/lib/queries";
import { parseLocalDate, getYear } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { CategorySpendingPieChart } from "@/components/CategorySpendingPieChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);

  // Debug render count - commented out to prevent re-renders
  // const renderCount = React.useRef(0);
  // renderCount.current += 1;
  // console.log(`Dashboard rendering #${renderCount.current}`, { selectedCategories });
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const handleMonthChange = (month: string) => {
    console.log('Dashboard: handleMonthChange', { month });
    const newDate = new Date(selectedDate);
    newDate.setMonth(parseInt(month, 10));
    setSelectedDate(newDate);
  };

  const handleYearChange = (year: string) => {
    console.log('Dashboard: handleYearChange', { year });
    const newDate = new Date(selectedDate);
    newDate.setFullYear(parseInt(year, 10));
    setSelectedDate(newDate);
  };

  // Query for fetching transactions for display (user's own + public only)
  const {
    data: transactionsData,
    isLoading: transactionsIsLoading,
    isError: transactionsIsError,
    error: transactionsError,
  } = useQuery<Transaction[], Error>({
    queryKey: ['allTransactionsForDashboard', session?.user?.id], // Include session ID in query key
    queryFn: fetchAllTransactions,
    enabled: !!session?.user?.id, // Only run query if user is logged in
  });

  // Query for fetching ALL transactions for statistics (regardless of visibility)
  const {
    data: statsTransactionsData,
    isLoading: statsIsLoading,
    isError: statsIsError,
    error: statsError,
  } = useQuery<Transaction[], Error>({
    queryKey: ['allTransactionsForStats', session?.user?.id], // Include session ID in query key
    queryFn: fetchAllTransactionsForStats,
    enabled: !!session?.user?.id, // Only run query if user is logged in
  });

  const { years, months } = useMemo(() => {
    const allYears = new Set<number>();
    if (transactionsData) {
      transactionsData.forEach(tx => {
        allYears.add(getYear(tx.date));
      });
    }
    const sortedYears = Array.from(allYears).sort((a, b) => b - a);
    if (sortedYears.length === 0) {
      sortedYears.push(new Date().getFullYear());
    }

    const monthNames = Array.from({ length: 12 }, (_, i) => {
      return new Date(0, i).toLocaleString('default', { month: 'long' });
    });

    return { years: sortedYears, months: monthNames };
  }, [transactionsData]);

  const userStats = useMemo(() => {
    const stats = {
      currentMonthIncome: 0,
      currentMonthExpenses: 0,
      currentMonthNetBalance: 0
    };

    // Use statsTransactionsData which includes ALL transactions for statistics
    if (statsTransactionsData && statsTransactionsData.length > 0 && session?.user?.id) {
      const selectedYear = selectedDate.getFullYear();
      const selectedMonth = selectedDate.getMonth();

      const currentMonthTransactions = statsTransactionsData.filter(tx => {
        const txDate = parseLocalDate(tx.date);
        return getYear(txDate) === selectedYear && txDate.getMonth() === selectedMonth;
      });

      currentMonthTransactions.forEach(tx => {
        if (tx.amount > 0) {
          stats.currentMonthIncome += tx.amount;
        } else {
          stats.currentMonthExpenses += Math.abs(tx.amount);
        }
      });

      stats.currentMonthNetBalance = stats.currentMonthIncome - stats.currentMonthExpenses;
    }
    return stats;
  }, [session, selectedDate, statsTransactionsData]);

  // Minimal columns for public transactions, no actions, no sorting/filtering
  const publicColumns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const txDate = parseLocalDate(row.original.date);
        return txDate.toLocaleDateString();
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
        const amount = parseFloat(row.getValue("amount"));
        const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
        return <div className={`text-left ${amount < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatted}</div>;
      },
    },
  ];

  function RecentSpendingTable({ transactions, isLoading, error, selectedCategories, selectedDate }: { transactions: Transaction[] | undefined; isLoading: boolean; error: Error | null; selectedCategories: string[]; selectedDate: Date }) {
    const currentYear = selectedDate.getFullYear();
    const currentMonth = selectedDate.getMonth(); // 0-indexed
    const visibleTxs = (transactions || []).filter((tx) => {
      const txDate = parseLocalDate(tx.date);
      const isCurrentMonth = getYear(txDate) === currentYear && txDate.getMonth() === currentMonth;
      const isVisible = tx.is_public || tx.is_owner;
      const isSpending = tx.amount < 0;
      const isInCategory = selectedCategories.length === 0 || selectedCategories.includes(tx.category || 'Uncategorized');

      return isCurrentMonth && isVisible && isSpending && isInCategory;
    });
    return (
      <div>
        {isLoading && <p>Loading recent transactions...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}
        {!isLoading && !error && visibleTxs.length === 0 && <p>No transactions available for the current month.</p>}
        {!isLoading && !error && visibleTxs.length > 0 && (
          <DataTable columns={publicColumns} data={visibleTxs} filterColumnId={undefined} filterPlaceholder={undefined} />
        )}
      </div>
    );
  }

  function RecentIncomeTable({ transactions, isLoading, error, selectedDate }: { transactions: Transaction[] | undefined; isLoading: boolean; error: Error | null; selectedDate: Date }) {
    const currentYear = selectedDate.getFullYear();
    const currentMonth = selectedDate.getMonth(); // 0-indexed
    const incomeTxs = (transactions || []).filter((tx) => {
      const txDate = parseLocalDate(tx.date);
      const isCurrentMonth = getYear(txDate) === currentYear && txDate.getMonth() === currentMonth;
      const isVisible = tx.is_public || tx.is_owner;
      const isIncome = tx.amount > 0;

      return isCurrentMonth && isVisible && isIncome;
    });

    return (
      <div>
        {isLoading && <p>Loading recent income...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}
        {!isLoading && !error && incomeTxs.length === 0 && <p>No income transactions available for the current month.</p>}
        {!isLoading && !error && incomeTxs.length > 0 && (
          <DataTable columns={publicColumns} data={incomeTxs} filterColumnId={undefined} filterPlaceholder={undefined} />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Select value={selectedDate.getMonth().toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={month} value={index.toString()}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDate.getFullYear().toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {session?.user?.name ? (
        <p>Welcome to your CoFi Dashboard, {session.user.name}!</p>
      ) : (
        <p>Welcome to your CoFi Dashboard!</p>
      )}
      {/* Statistics Cards */}
      {statsIsLoading && <p>Loading statistics...</p>} {/* Use useQuery's isLoading */}
      {statsIsError && <p className="text-red-500">Error: {statsError?.message}</p>} {/* Use useQuery's error */}
      {!statsIsLoading && !statsIsError && !session && (
        <p>Please log in to view your statistics.</p>
      )}
      {/* 
        The following conditions might need slight adjustments based on how useQuery behaves when disabled 
        or when data is empty. For now, assuming transactionsData will be undefined if query is disabled or fails.
      */}
      {!statsIsLoading && !statsIsError && session && (!statsTransactionsData || statsTransactionsData.length === 0) && (
        <p>No transaction data available to calculate statistics. Please add some transactions.</p>
      )}
      {!statsIsLoading && !statsIsError && userStats && statsTransactionsData && statsTransactionsData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 mt-8">
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="mr-2 h-4 w-4" />
                Income for {selectedDate.toLocaleString('default', { month: 'long' })}
              </CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">
                ${userStats.currentMonthIncome.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center text-sm text-muted-foreground">
                <TrendingDown className="mr-2 h-4 w-4" />
                Expenses for {selectedDate.toLocaleString('default', { month: 'long' })}
              </CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">
                ${userStats.currentMonthExpenses.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center text-sm text-muted-foreground">
                <DollarSign className="mr-2 h-4 w-4" />
                Net Balance for {selectedDate.toLocaleString('default', { month: 'long' })}
              </CardDescription>
              <CardTitle className={`text-3xl font-semibold tabular-nums ${userStats.currentMonthNetBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${userStats.currentMonthNetBalance.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Pie Chart and Transactions Table */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Spending in {selectedDate.toLocaleString('default', { month: 'long' })}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          <div className="lg:col-span-1">
            <CategorySpendingPieChart
              transactionsData={transactionsData}
              isLoading={transactionsIsLoading}
              isError={transactionsIsError}
              error={transactionsError}
              onCategorySelectionChange={React.useCallback((categories: string[]) => {
                // Only update if the categories have actually changed
                if (JSON.stringify(categories) !== JSON.stringify(selectedCategories)) {
                  setSelectedCategories(categories);
                }
              }, [selectedCategories])}
              selectedCategories={selectedCategories}
              selectedDate={selectedDate}
            />
          </div>
          <div className="lg:col-span-2">
            <RecentSpendingTable
              transactions={transactionsData}
              isLoading={transactionsIsLoading}
              error={transactionsError}
              selectedCategories={selectedCategories}
              selectedDate={selectedDate}
            />
          </div>
        </div>
      </div>

      {/* Recent Income Table */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Income in {selectedDate.toLocaleString('default', { month: 'long' })}</h2>
        <RecentIncomeTable
          transactions={transactionsData}
          isLoading={transactionsIsLoading}
          error={transactionsError}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
}
