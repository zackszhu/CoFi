"use client"

import { memo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface MonthlyCategorySpendingData {
  month: string;
  [category: string]: number | string;
}

interface CategoryCompositionChartProps {
  processedChartData: MonthlyCategorySpendingData[];
  chartConfig: ChartConfig;
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  currentYear: number;
}

export const CategoryCompositionChart = memo(function CategoryCompositionChart({
  processedChartData,
  chartConfig,
  isLoading,
  isError,
  error,
  currentYear
}: CategoryCompositionChartProps) {

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Spending Composition</CardTitle>
          <CardDescription>Loading data for the current year...</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[350px] w-full items-center justify-center">
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Spending Composition</CardTitle>
          <CardDescription>Error loading data for {currentYear}.</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[350px] w-full items-center justify-center">
          <p className="text-destructive">Error: {error?.message || 'Could not fetch data'}</p>
        </CardContent>
      </Card>
    );
  }

  if (processedChartData.length === 0 || Object.keys(chartConfig).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Spending Composition</CardTitle>
          <CardDescription>Spending distribution by category for {currentYear}.</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[350px] w-full items-center justify-center">
          <p>No spending data available for {currentYear} to display.</p>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="leading-none text-muted-foreground">
                Data for {currentYear}
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Spending Composition</CardTitle>
        <CardDescription>
          Showing spending distribution by category for {currentYear}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <AreaChart
            accessibilityLayer
            data={processedChartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
            }}
            stackOffset="expand"
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
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" formatter={(value, name, props) => {
                // Calculate total for the month to get percentage
                let totalForMonth = 0;
                if (props.payload) {
                  Object.keys(props.payload).forEach(key => {
                    if (typeof props.payload[key] === 'number' && key !== 'month') {
                      totalForMonth += props.payload[key];
                    }
                  });
                }
                const percentage = totalForMonth > 0 ? (props.payload[name as string] / totalForMonth * 100) : 0;
                return [
                  `${props.payload[name as string].toFixed(2)} (${percentage.toFixed(1)}%)`,
                  chartConfig[name as string]?.label || name
                ];
              }} />}
            />
            {Object.keys(chartConfig).map((categoryKey, index) => (
              <Area
                key={categoryKey}
                dataKey={categoryKey}
                type="linear"
                fill={chartConfig[categoryKey]?.color || `var(--color-${categoryKey})`}
                fillOpacity={0.6 - (index * 0.05)} // Vary opacity slightly for better layer distinction
                stroke={chartConfig[categoryKey]?.color || `var(--color-${categoryKey})`}
                stackId="a"
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="leading-none text-muted-foreground">
              Data for {currentYear}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
})
