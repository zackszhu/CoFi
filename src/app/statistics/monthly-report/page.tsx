"use client";

import React, { useState, useMemo, memo } from 'react';
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@/lib/types";
import { fetchAllTransactionsForStats } from "@/lib/queries";
import { parseLocalDate, getYear } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, TrendingDown, Users, ShoppingBag } from "lucide-react";

export default memo(function MonthlyReportPage() {
    const { data: session } = useSession();
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleMonthChange = (month: string) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(parseInt(month, 10));
        setSelectedDate(newDate);
    };

    const handleYearChange = (year: string) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(parseInt(year, 10));
        setSelectedDate(newDate);
    };

    // Query for fetching ALL transactions for statistics (regardless of visibility)
    const {
        data: transactionsData,
        isLoading,
        isError,
        error,
    } = useQuery<Transaction[], Error>({
        queryKey: ['allTransactionsForStats', session?.user?.id, selectedDate.getMonth(), selectedDate.getFullYear()],
        queryFn: fetchAllTransactionsForStats,
        enabled: !!session?.user?.id,
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

    // First row data: Monthly income, expenses, and net balance
    const monthlyStats = useMemo(() => {
        const stats = {
            income: 0,
            expenses: 0,
            netBalance: 0
        };

        if (transactionsData && transactionsData.length > 0) {
            const selectedYear = selectedDate.getFullYear();
            const selectedMonth = selectedDate.getMonth();

            const currentMonthTransactions = transactionsData.filter(tx => {
                const txDate = parseLocalDate(tx.date);
                return getYear(txDate) === selectedYear && txDate.getMonth() === selectedMonth;
            });

            currentMonthTransactions.forEach(tx => {
                if (tx.amount > 0) {
                    stats.income += tx.amount;
                } else {
                    stats.expenses += Math.abs(tx.amount);
                }
            });

            stats.netBalance = stats.income - stats.expenses;
        }
        return stats;
    }, [transactionsData, selectedDate]);

    // Fetch all users from the database
    const { data: usersData } = useQuery<{ id: number, username: string }[], Error>({
        queryKey: ['allUsers'],
        queryFn: async () => {
            const response = await fetch('/api/users');
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            return response.json();
        },
        enabled: !!session?.user?.id,
    });

    // Extract usernames from users data
    const allUsers = useMemo(() => {
        if (!usersData) return [];
        return usersData.map(user => user.username);
    }, [usersData]);

    // Second row data: Sum of private transactions for each user
    const userPrivateSpending = useMemo(() => {
        // Initialize with zero spending for all users
        const userSpending: { [key: string]: number } = {};
        allUsers.forEach(username => {
            userSpending[username] = 0;
        });

        if (transactionsData && transactionsData.length > 0) {
            const selectedYear = selectedDate.getFullYear();
            const selectedMonth = selectedDate.getMonth();

            transactionsData
                .filter(tx => {
                    const txDate = parseLocalDate(tx.date);
                    return getYear(txDate) === selectedYear &&
                        txDate.getMonth() === selectedMonth &&
                        !tx.is_public &&
                        tx.amount < 0;
                })
                .forEach(tx => {
                    const username = tx.username || `User ${tx.user_id}`;
                    userSpending[username] += Math.abs(tx.amount);
                });
        }

        return userSpending;
    }, [transactionsData, selectedDate, allUsers]);

    // Calculate spending categories with changes compared to previous month
    const categoriesWithChanges = useMemo(() => {
        if (!transactionsData || transactionsData.length === 0) return [];

        const selectedYear = selectedDate.getFullYear();
        const selectedMonth = selectedDate.getMonth();

        // Create a date object for the previous month
        const previousMonthDate = new Date(selectedDate);
        previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
        const previousMonth = previousMonthDate.getMonth();
        const previousMonthYear = previousMonthDate.getFullYear();

        // Categories to exclude from analysis
        const excludedCategories = ['Mortgage'];

        // Calculate spending by category for current month
        const currentMonthSpendingByCategory: { [key: string]: number } = {};
        transactionsData
            .filter(tx => {
                const txDate = parseLocalDate(tx.date);
                const category = tx.category || 'Uncategorized';
                return getYear(txDate) === selectedYear &&
                    txDate.getMonth() === selectedMonth &&
                    tx.amount < 0 && // Only include expenses
                    !excludedCategories.includes(category); // Exclude specified categories
            })
            .forEach(tx => {
                const category = tx.category || 'Uncategorized';
                if (!currentMonthSpendingByCategory[category]) {
                    currentMonthSpendingByCategory[category] = 0;
                }
                currentMonthSpendingByCategory[category] += Math.abs(tx.amount);
            });

        // Calculate spending by category for previous month
        const previousMonthSpendingByCategory: { [key: string]: number } = {};
        transactionsData
            .filter(tx => {
                const txDate = parseLocalDate(tx.date);
                const category = tx.category || 'Uncategorized';
                return getYear(txDate) === previousMonthYear &&
                    txDate.getMonth() === previousMonth &&
                    tx.amount < 0 && // Only include expenses
                    !excludedCategories.includes(category); // Exclude specified categories
            })
            .forEach(tx => {
                const category = tx.category || 'Uncategorized';
                if (!previousMonthSpendingByCategory[category]) {
                    previousMonthSpendingByCategory[category] = 0;
                }
                previousMonthSpendingByCategory[category] += Math.abs(tx.amount);
            });

        // Calculate change percentage and prepare data
        const categoriesWithChange = Object.keys(currentMonthSpendingByCategory).map(category => {
            const currentAmount = currentMonthSpendingByCategory[category];
            const previousAmount = previousMonthSpendingByCategory[category] || 0;
            let changePercentage = 0;

            if (previousAmount > 0) {
                changePercentage = ((currentAmount - previousAmount) / previousAmount) * 100;
            } else if (currentAmount > 0) {
                changePercentage = 100; // New category (not present last month)
            }

            return {
                category,
                amount: currentAmount,
                changePercentage,
                rawChange: currentAmount - previousAmount
            };
        });

        return categoriesWithChange;
    }, [transactionsData, selectedDate]);

    // Third row data: Top five spending categories with change percentage compared to last month
    const topSpendingCategories = useMemo(() => {
        // Sort by amount (highest first) and take top 5
        return [...categoriesWithChanges]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }, [categoriesWithChanges]);

    // New data for increasing/decreasing categories
    const fastestIncreasingCategories = useMemo(() => {
        // Only include categories with minimum spending to avoid small absolute changes with high percentages
        const minSpendingThreshold = 5; // $5 minimum to be considered
        return [...categoriesWithChanges]
            .filter(cat => cat.amount >= minSpendingThreshold)
            .sort((a, b) => {
                // Primary sort by percentage
                const percentageDiff = b.changePercentage - a.changePercentage;
                // If percentages are the same, sort by amount (higher first)
                return percentageDiff !== 0 ? percentageDiff : b.amount - a.amount;
            })
            .slice(0, 5);
    }, [categoriesWithChanges]);

    const fastestDecreasingCategories = useMemo(() => {
        // Only include categories with spending in previous month
        return [...categoriesWithChanges]
            .filter(cat => cat.changePercentage < 0) // Only negative changes
            .sort((a, b) => {
                // Primary sort by percentage (most negative first)
                const percentageDiff = a.changePercentage - b.changePercentage;
                // If percentages are the same, sort by amount (higher first)
                return percentageDiff !== 0 ? percentageDiff : b.amount - a.amount;
            })
            .slice(0, 5);
    }, [categoriesWithChanges]);

    // Top five public spending transactions
    const topPublicSpendingTransactions = useMemo(() => {
        if (!transactionsData || transactionsData.length === 0) {
            return [];
        }

        const selectedYear = selectedDate.getFullYear();
        const selectedMonth = selectedDate.getMonth();
        
        // Use the same excludedCategories as defined earlier
        const excludedCategories = ['Mortgage'];

        return transactionsData
            .filter(tx => {
                const txDate = parseLocalDate(tx.date);
                const category = tx.category || 'Uncategorized';
                return getYear(txDate) === selectedYear &&
                    txDate.getMonth() === selectedMonth &&
                    tx.is_public &&
                    tx.amount < 0 &&
                    !excludedCategories.includes(category);
            })
            .sort((a, b) => a.amount - b.amount) // Sort by amount (most negative first)
            .slice(0, 5);
    }, [transactionsData, selectedDate]);

    // Format functions for public transactions table
    const formatDate = (dateString: string) => {
        const date = parseLocalDate(dateString);
        return date.toLocaleDateString();
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    // Check for loading and authentication states
    if (!session) return <div className="flex justify-center items-center h-screen"><p>Please log in to view monthly reports.</p></div>;

    return (
        <div className="w-full">
            {/* Header with title and month/year selectors */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold tracking-tight">Monthly Report</h1>
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

            {isLoading && <p className="my-8 text-center">Loading monthly report data...</p>}
            {isError && <p className="my-8 text-center text-red-500">Error: {error?.message || 'Failed to load data'}</p>}

            {!isLoading && !isError && transactionsData &&
                <>
                    {/* First row: Monthly income, expenses, and net balance */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Card>
                            <CardHeader>
                                <CardDescription className="flex items-center text-sm text-muted-foreground">
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    Income for {selectedDate.toLocaleString('default', { month: 'long' })}
                                </CardDescription>
                                <CardTitle className="text-2xl font-semibold tabular-nums">
                                    ${monthlyStats.income.toFixed(2)}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardDescription className="flex items-center text-sm text-muted-foreground">
                                    <TrendingDown className="mr-2 h-4 w-4" />
                                    Expenses for {selectedDate.toLocaleString('default', { month: 'long' })}
                                </CardDescription>
                                <CardTitle className="text-2xl font-semibold tabular-nums">
                                    ${monthlyStats.expenses.toFixed(2)}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardDescription className="flex items-center text-sm text-muted-foreground">
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Net Balance for {selectedDate.toLocaleString('default', { month: 'long' })}
                                </CardDescription>
                                <CardTitle className={`text-2xl font-semibold tabular-nums ${monthlyStats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${monthlyStats.netBalance.toFixed(2)}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Second row: Private transactions sum by user */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">Private Spending by User</h2>
                        <p className="text-sm text-gray-500 mb-4">Showing private expense transactions for all users in {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Object.keys(userPrivateSpending).length > 0 ? (
                                Object.entries(userPrivateSpending).map(([username, amount]) => (
                                    <Card key={username}>
                                        <CardHeader>
                                            <CardDescription className="flex items-center text-sm text-muted-foreground">
                                                <Users className="mr-2 h-4 w-4" />
                                                {username}
                                            </CardDescription>
                                            <CardTitle className="text-xl font-semibold tabular-nums">
                                                ${amount.toFixed(2)}
                                            </CardTitle>
                                        </CardHeader>
                                    </Card>
                                ))
                            ) : (
                                <p className="text-gray-500 col-span-full">No private spending data available for this month.</p>
                            )}
                        </div>
                    </div>

                    {/* Third row: Top spending categories and public spending transactions side by side */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">Top Spending Analysis</h2>
                        <p className="text-sm text-gray-500 mb-4">Showing highest spending categories and largest public transactions for {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top spending categories */}
                            <Card>
                                <CardHeader>
                                    <CardDescription className="flex items-center text-sm text-muted-foreground">
                                        <ShoppingBag className="mr-2 h-4 w-4" />
                                        Top Categories
                                    </CardDescription>
                                    <CardTitle className="text-lg">Top Spending Categories</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {topSpendingCategories.length > 0 ? (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Category</TableHead>
                                                        <TableHead className="text-right">Amount</TableHead>
                                                        <TableHead className="text-right">Change vs. Last Month</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {topSpendingCategories.map((item) => (
                                                        <TableRow key={item.category}>
                                                            <TableCell>{item.category}</TableCell>
                                                            <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right">
                                                                <span className={item.changePercentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                                                                    {item.changePercentage >= 0 ? '+' : ''}{item.changePercentage.toFixed(1)}%
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No category data available for this month.</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Top public spending transactions */}
                            <Card>
                                <CardHeader>
                                    <CardDescription className="flex items-center text-sm text-muted-foreground">
                                        <DollarSign className="mr-2 h-4 w-4" />
                                        Public Transactions
                                    </CardDescription>
                                    <CardTitle className="text-lg">Top Public Spending</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {topPublicSpendingTransactions.length > 0 ? (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Description</TableHead>
                                                        <TableHead>Category</TableHead>
                                                        <TableHead className="text-right">Amount</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {topPublicSpendingTransactions.map((transaction) => (
                                                        <TableRow key={transaction.id}>
                                                            <TableCell>{formatDate(transaction.date)}</TableCell>
                                                            <TableCell>{transaction.description}</TableCell>
                                                            <TableCell>{transaction.category || "Uncategorized"}</TableCell>
                                                            <TableCell className={`text-right font-medium ${transaction.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                                                                {formatAmount(transaction.amount)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No public transactions available for this month.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Fourth row: Fastest changing categories */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">Spending Trends by Category</h2>
                        <p className="text-sm text-gray-500 mb-4">Showing categories with the most significant changes compared to last month</p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Card for fastest increasing categories */}
                            <Card>
                                <CardHeader>
                                    <CardDescription className="flex items-center text-sm text-muted-foreground">
                                        <TrendingUp className="mr-2 h-4 w-4 text-red-600" />
                                        Fastest Increasing Categories
                                    </CardDescription>
                                    <CardTitle className="text-lg">Top 5 Growing Spending Areas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {fastestIncreasingCategories.length > 0 ? (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Category</TableHead>
                                                        <TableHead className="text-right">Amount</TableHead>
                                                        <TableHead className="text-right">Change vs. Last Month</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {fastestIncreasingCategories.map((item) => (
                                                        <TableRow key={item.category}>
                                                            <TableCell>{item.category}</TableCell>
                                                            <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right">
                                                                <span className="text-red-600">+{item.changePercentage.toFixed(1)}%</span>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 py-4 text-center">No significant increases this month</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Card for fastest decreasing categories */}
                            <Card>
                                <CardHeader>
                                    <CardDescription className="flex items-center text-sm text-muted-foreground">
                                        <TrendingDown className="mr-2 h-4 w-4 text-green-600" />
                                        Fastest Decreasing Categories
                                    </CardDescription>
                                    <CardTitle className="text-lg">Top 5 Declining Spending Areas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {fastestDecreasingCategories.length > 0 ? (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Category</TableHead>
                                                        <TableHead className="text-right">Amount</TableHead>
                                                        <TableHead className="text-right">Change vs. Last Month</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {fastestDecreasingCategories.map((item) => (
                                                        <TableRow key={item.category}>
                                                            <TableCell>{item.category}</TableCell>
                                                            <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right">
                                                                <span className="text-green-600">{item.changePercentage.toFixed(1)}%</span>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 py-4 text-center">No significant decreases this month</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            }
        </div >
    );
});
