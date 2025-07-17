import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses a date string from the database (YYYY-MM-DD) and returns a Date object
 * in the local timezone to ensure consistent date handling across the app.
 * 
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns Date object in local timezone
 */
export function parseLocalDate(dateStr: string): Date {
  // Split the date string and convert parts to integers
  const dateParts = dateStr.split('-').map(part => parseInt(part, 10));
  // Create date in local timezone (months are 0-indexed in JS Date)
  return new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
}

/**
 * Gets the month name from a date object or date string
 * 
 * @param date Date object or date string in YYYY-MM-DD format
 * @param format Optional format (default: 'long' for full month name)
 * @returns Month name
 */
export function getMonthName(date: Date | string, format: 'long' | 'short' = 'long'): string {
  const dateObj = typeof date === 'string' ? parseLocalDate(date) : date;
  return dateObj.toLocaleString('default', { month: format });
}

/**
 * Gets the year from a date object or date string
 * 
 * @param date Date object or date string in YYYY-MM-DD format
 * @returns Year as a number
 */
export function getYear(date: Date | string): number {
  const dateObj = typeof date === 'string' ? parseLocalDate(date) : date;
  return dateObj.getFullYear();
}
