"use client"

import React, { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Legend } from "recharts"
import { useQuery } from '@tanstack/react-query';
import { fetchAllTransactions } from '@/lib/queries';
import { Transaction } from '@/lib/types';
import { parseLocalDate, getYear } from '@/lib/utils';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const MONTH_ORDER = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface NetBalanceChartProps {
  selectedCategories: string[];
}

export const NetBalanceChart = React.memo(function NetBalanceChart({ selectedCategories }: NetBalanceChartProps) {
  const {
    data: transactionsData,
    isLoading,
    isError,
    error,
  } = useQuery<Transaction[], Error>({
    queryKey: ['allTransactionsForNetBalanceChart'],
    queryFn: fetchAllTransactions,
  });

  const { chartData, chartConfig, currentYear, lastYear } = useMemo(() => {
    const currentChartYear = new Date().getFullYear();
    const lastChartYear = currentChartYear - 1;

    if (!transactionsData || transactionsData.length === 0 || selectedCategories.length === 0) {
      return {
        chartData: [],
        chartConfig: {
          currentYear: { label: `Total Amount ${currentChartYear}` },
          lastYear: { label: `Total Amount ${lastChartYear}` },
        } satisfies ChartConfig,
        currentYear: currentChartYear,
        lastYear: lastChartYear,
      };
    }

    const monthlyData: { [key: string]: { currentYear: number; lastYear: number } } = {};

    for (let i = 0; i < 12; i++) {
      monthlyData[MONTH_ORDER[i]] = { currentYear: 0, lastYear: 0 };
    }

    transactionsData.forEach(transaction => {
      if (!selectedCategories.includes(transaction.category)) {
        return;
      }

      const transactionDate = parseLocalDate(transaction.date);
      const year = getYear(transactionDate);
      const month = transactionDate.getMonth();

      if (year === currentChartYear) {
        monthlyData[MONTH_ORDER[month]].currentYear += transaction.amount;
      } else if (year === lastChartYear) {
        monthlyData[MONTH_ORDER[month]].lastYear += transaction.amount;
      }
    });

    const finalChartData = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      currentYear: data.currentYear,
      lastYear: data.lastYear,
    }));

    const finalChartConfig = {
      currentYear: {
        label: `Total Amount ${currentChartYear}`,
        color: "hsl(var(--chart-1))",
      },
      lastYear: {
        label: `Total Amount ${lastChartYear}`,
        color: "hsl(var(--chart-2))",
      },
    } satisfies ChartConfig;

    return {
      chartData: finalChartData,
      chartConfig: finalChartConfig,
      currentYear: currentChartYear,
      lastYear: lastChartYear,
    };
  }, [transactionsData, selectedCategories]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Total Amount Over Time</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] w-full flex items-center justify-center">
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError || !transactionsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Total Amount Over Time</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] w-full flex items-center justify-center">
          <p className="text-red-500">
            {error ? error.message : "Failed to load transaction data for the chart."}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (chartData.length === 0 || selectedCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Total Amount Over Time</CardTitle>
          <CardDescription>
            {selectedCategories.length === 0 
              ? "Please select categories to view the chart."
              : `No data available for ${currentYear} vs. ${lastYear} with selected categories.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] w-full flex items-center justify-center">
          <p>
            {selectedCategories.length === 0 
              ? "Select categories from the table filter below to see their net balance."
              : "No transaction data available for the selected categories and date range."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Amount Over Time</CardTitle>
        <CardDescription>Total amount per month for {currentYear} vs. {lastYear}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 5,
              bottom: 5,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                indicator="line"
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    return payload[0].payload.month;
                  }
                  return label;
                }}
                formatter={(value, name, props) => {
                  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
                  return [`$${formattedValue}`, props.payload?.label];
                }}
              />}
            />
            <Legend />
            <Line
              dataKey="currentYear"
              type="linear"
              stroke="var(--color-currentYear)"
              strokeWidth={2}
              dot={false}
              name={chartConfig.currentYear.label.toString()}
            />
            <Line
              dataKey="lastYear"
              type="linear"
              stroke="var(--color-lastYear)"
              strokeWidth={2}
              dot={false}
              name={chartConfig.lastYear.label.toString()}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
})

export default NetBalanceChart;
