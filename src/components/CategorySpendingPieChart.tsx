"use client"

import * as React from "react"

import { Pie, PieChart, Label, Cell } from "recharts"
import { getYear, getMonthName, parseLocalDate } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { CategorySelector } from "@/components/ui/CategorySelector";
import { PieChartIcon } from "lucide-react"
import { Transaction } from "@/lib/types";


const PREDEFINED_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
];

interface CategorySpendingPieChartProps {
  transactionsData: Transaction[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onCategorySelectionChange?: (categories: string[]) => void;
  selectedCategories: string[];
  selectedDate: Date;
}

export const CategorySpendingPieChart = React.memo(function CategorySpendingPieChart({
  transactionsData,
  isLoading,
  isError,
  error,
  onCategorySelectionChange,
  selectedCategories,
  selectedDate,
}: CategorySpendingPieChartProps) {
  const id = "current-month-category-pie"

  const { pieData, totalSpendingInCurrentMonth, uniqueCategories, currentMonthName, currentYear, derivedChartConfig } = React.useMemo(() => {
    const yearVal = getYear(selectedDate);
    const monthVal = selectedDate.getMonth(); // Keep as-is since this is a Date object
    const monthNameVal = getMonthName(selectedDate);

    if (!transactionsData) {
      return {
        pieData: [],
        totalSpendingInCurrentMonth: 0,
        uniqueCategories: [],
        currentMonthName: monthNameVal,
        currentYear: yearVal,
        derivedChartConfig: {},
      };
    }

    const currentMonthTransactions = transactionsData.filter(tx => {
      const txDate = parseLocalDate(tx.date);
      return getYear(txDate) === yearVal && txDate.getMonth() === monthVal && tx.amount < 0;
    });

    const spendingByCategory: { [key: string]: number } = {};
    currentMonthTransactions.forEach(tx => {
      const category = tx.category || "Uncategorized";
      spendingByCategory[category] = (spendingByCategory[category] || 0) + Math.abs(tx.amount);
    });

    let currentTotalSpending = 0;
    Object.values(spendingByCategory).forEach(amount => currentTotalSpending += amount);

    const categories = Object.keys(spendingByCategory).sort();
    const dynamicChartConfig: ChartConfig = {};
    categories.forEach((category, index) => {
      dynamicChartConfig[category.toLowerCase().replace(/\s+/g, '-')] = {
        label: category,
        color: PREDEFINED_COLORS[index % PREDEFINED_COLORS.length],
      };
    });

    const dataForPie = categories.map(category => ({
      category,
      amount: spendingByCategory[category],
      fill: dynamicChartConfig[category.toLowerCase().replace(/\s+/g, '-')]?.color || PREDEFINED_COLORS[0],
      percentage: currentTotalSpending > 0 ? (spendingByCategory[category] / currentTotalSpending) * 100 : 0,
    }));

    return {
      pieData: dataForPie,
      totalSpendingInCurrentMonth: currentTotalSpending,
      uniqueCategories: categories,
      currentMonthName: monthNameVal,
      currentYear: yearVal,
      derivedChartConfig: dynamicChartConfig,
    };
  }, [transactionsData, selectedDate]);

  // Memoize this calculation to prevent unnecessary recalculations
  const sumOfSelectedPercentages = React.useMemo(() => {
    if (selectedCategories.length === 0) return 0;
    return pieData
      .filter(item => selectedCategories.includes(item.category))
      .reduce((sum, item) => sum + item.percentage, 0);
  }, [pieData, selectedCategories]);

  const sumOfSelectedAmounts = React.useMemo(() => {
    if (selectedCategories.length === 0) return 0;
    return pieData
      .filter(item => selectedCategories.includes(item.category))
      .reduce((sum, item) => sum + item.amount, 0);
  }, [pieData, selectedCategories]);



  const handleCategorySelect = React.useCallback((category: string) => {
    if (onCategorySelectionChange) {
      const newCategories = selectedCategories.includes(category)
        ? selectedCategories.filter(c => c !== category)
        : [category];
      console.log('CategorySpendingPieChart: handleCategorySelect', { category, selectedBefore: selectedCategories, selectedAfter: newCategories });
      onCategorySelectionChange(newCategories);
    }
  }, [selectedCategories, onCategorySelectionChange]);

  if (isLoading) {
    return (
      <Card data-chart={id} className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Category Spending</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center pb-0 aspect-square max-h-[400px]">
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card data-chart={id} className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Category Spending</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center pb-0 aspect-square max-h-[400px]">
          <p className="text-destructive">Error: {error?.message || 'Could not fetch data'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-chart={id} className="flex flex-col">
      <ChartStyle id={id} config={derivedChartConfig} />
      <CardHeader className="items-center pb-0 flex-row">
        <CardDescription className="flex items-center text-sm text-muted-foreground">
          <PieChartIcon className="mr-2 h-4 w-4" />
          Category Composition for {selectedDate.toLocaleString('default', { month: 'long' })}
        </CardDescription>
        {uniqueCategories.length > 0 && (
          <CategorySelector
            uniqueCategories={uniqueCategories}
            selectedCategories={selectedCategories}
            onSelectionChange={onCategorySelectionChange || (() => { })}
            className="ml-auto h-8"
          />
        )}
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center pb-0 aspect-square max-h-[400px]">
        {pieData.length > 0 ? (
          <ChartContainer
            id={id}
            config={derivedChartConfig}
            className="mx-auto aspect-square w-full max-w-[300px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={true}
                content={<ChartTooltipContent hideLabel nameKey="category" formatter={(value, name, props) => `${props.payload.category}: ${Number(value).toFixed(2)} (${props.payload.percentage.toFixed(1)}%)`} />}
              />
              <Pie
                data={pieData}
                dataKey="amount"
                nameKey="category"
                innerRadius="50%" // Adjusted for thickness
                outerRadius="75%" // Adjusted for thickness
                strokeWidth={2}
                onClick={(data) => handleCategorySelect(data.category)}
                cursor="pointer"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    opacity={
                      selectedCategories.length === 0 || selectedCategories.includes(entry.category)
                        ? 1
                        : 0.4 // Fade out non-selected categories if any are selected
                    }
                  />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {`${sumOfSelectedPercentages.toFixed(0)}%`}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 20}
                            className="fill-muted-foreground text-sm"
                          >
                            {selectedCategories.length > 0
                              ? `$${sumOfSelectedAmounts.toFixed(2)}`
                              : 'Total Spending'}
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                  className="fill-foreground"
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-muted-foreground">No spending data for {currentMonthName} {currentYear}</p>
          </div>
        )}
      </CardContent>
      {pieData.length > 0 && (
        <CardFooter className="flex-col gap-2 text-sm pt-0">
          <div className="leading-none text-muted-foreground w-full text-center">
            {selectedCategories.length > 0
              ? `Selected: ${sumOfSelectedAmounts.toLocaleString(undefined, { style: 'currency', currency: 'USD' })} (${sumOfSelectedPercentages.toFixed(1)}%)`
              : `Total Spending in ${currentMonthName}: ${totalSpendingInCurrentMonth.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}`}
          </div>
        </CardFooter>
      )}
    </Card>
  )
})
