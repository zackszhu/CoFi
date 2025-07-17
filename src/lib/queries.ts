import { Transaction } from "@/lib/types";

/**
 * Fetch visible transactions for a user (their own + public ones)
 * Used for transaction tables and data displays
 */
export const fetchAllTransactions = async (): Promise<Transaction[]> => {
  const response = await fetch('/api/transactions');
  if (!response.ok) {
    let errorDetails = 'Failed to fetch transactions';
    try {
      // Try to parse error message from JSON response
      const errorData = await response.json();
      errorDetails = errorData.message || `Error: ${response.status}`;
    } catch {
      // If response is not JSON or parsing fails, use status text or a generic error
      errorDetails = response.statusText || `Error: ${response.status}`;
    }
    throw new Error(errorDetails);
  }
  return response.json();
};

/**
 * Fetch ALL transactions for statistics purposes
 * This ensures all users see the same statistics regardless of transaction visibility
 */
export const fetchAllTransactionsForStats = async (): Promise<Transaction[]> => {
  const response = await fetch('/api/statistics');
  if (!response.ok) {
    let errorDetails = 'Failed to fetch statistics data';
    try {
      // Try to parse error message from JSON response
      const errorData = await response.json();
      errorDetails = errorData.message || `Error: ${response.status}`;
    } catch {
      // If response is not JSON or parsing fails, use status text or a generic error
      errorDetails = response.statusText || `Error: ${response.status}`;
    }
    throw new Error(errorDetails);
  }
  return response.json();
};
