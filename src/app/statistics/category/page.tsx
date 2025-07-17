// src/app/statistics/category/page.tsx
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { CategoryCompositionChart } from '@/components/CategoryCompositionChart';
import { fetchAllTransactions } from "@/lib/queries";
import { Transaction } from "@/lib/types";
import { useSession } from "next-auth/react";
import { ChartConfig } from "@/components/ui/chart";
import { parseLocalDate, getMonthName, getYear } from "@/lib/utils";

// Constants for the chart
const HSL_CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6, 262.1, 83.3%, 57.8%))",
  "hsl(var(--chart-7, 32.1, 83.3%, 57.8%))",
];

const MONTH_ORDER = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface MonthlyCategorySpendingData {
  month: string;
  [category: string]: number | string;
}

const CategoryStatisticsPage = () => {
  const { data: session } = useSession();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  useEffect(() => {
    setCurrentYear(new Date().getFullYear()); // Ensure currentYear is set on client
  }, []);

  const {
    data: transactionsData,
    isLoading,
    isError,
    error,
  } = useQuery<Transaction[], Error>({
    queryKey: ['allTransactionsForCompositionChart', session?.user?.id],
    queryFn: fetchAllTransactions,
    enabled: !!session?.user?.id,
  });

  // Process the data for the chart
  const { processedChartData, chartConfig } = useMemo(() => {
    if (!transactionsData || transactionsData.length === 0) {
      return { processedChartData: [], chartConfig: {} };
    }

    const yearToFilter = currentYear;

    const monthlyCategorySpending: { [month: string]: { [category: string]: number } } = {}
    const allCategories = new Set<string>()

    transactionsData.forEach((t) => {
      // Parse date in local timezone using utility function
      const transactionDate = parseLocalDate(t.date);
      
      if (getYear(transactionDate) === yearToFilter && t.amount < 0) {
        const month = getMonthName(transactionDate);
        const category = t.category || "Uncategorized"; // Handle undefined category
        const spending = Math.abs(t.amount);

        allCategories.add(category);

        if (!monthlyCategorySpending[month]) {
          monthlyCategorySpending[month] = {};
        }
        if (!monthlyCategorySpending[month][category]) {
          monthlyCategorySpending[month][category] = 0;
        }
        monthlyCategorySpending[month][category] += spending;
      }
    });

    // Create chart data with all categories in each month
    const data: MonthlyCategorySpendingData[] = MONTH_ORDER.map(month => {
      const monthData: MonthlyCategorySpendingData = { month };
      allCategories.forEach(category => {
        const spendingForCategory = monthlyCategorySpending[month]?.[category] || 0;
        monthData[category] = spendingForCategory;
      });
      return monthData;
    });

    const sortedCategories = Array.from(allCategories).sort();

    const newChartConfig: ChartConfig = {};
    sortedCategories.forEach((category, index) => {
      newChartConfig[category] = {
        label: category,
        color: HSL_CHART_COLORS[index % HSL_CHART_COLORS.length],
      };
    });

    return { processedChartData: data, chartConfig: newChartConfig };
  }, [transactionsData, currentYear]);

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4">Category Statistics</h1>
      <CategoryCompositionChart
        processedChartData={processedChartData}
        chartConfig={chartConfig}
        isLoading={isLoading}
        isError={isError}
        error={error || undefined}
        currentYear={currentYear}
      />
    </div>
  );
};

export default CategoryStatisticsPage;
