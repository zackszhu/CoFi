import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Transaction } from '@/lib/types';

/**
 * GET handler for retrieving ALL transactions for statistics purposes.
 * This endpoint returns all transactions regardless of visibility settings
 * to ensure consistent statistics calculations for all users.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  // Only authenticated users can access statistics
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  try {
    // Fetch ALL transactions regardless of user or visibility
    // This ensures consistent statistics for all users
    const transactions = await db.all<Transaction[]>(
      `SELECT t.*, u.username 
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.date DESC, t.created_at DESC`
    );
    
    // Mark if the transaction is owned by the current user for frontend purposes
    const userId = parseInt(session.user.id, 10);
    const processedTransactions = transactions.map(tx => ({
      ...tx,
      is_owner: tx.user_id === userId
    }));

    return NextResponse.json(processedTransactions);
  } catch (error) {
    console.error('Failed to fetch statistics transactions:', error);
    return NextResponse.json({ message: 'Failed to fetch statistics data' }, { status: 500 });
  } finally {
    await db.close();
  }
}
