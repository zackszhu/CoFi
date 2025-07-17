import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Adjusted path
import { getDb } from '@/lib/db'; // Use shared DB connection
import { Transaction } from '@/lib/types'; // Assuming types.ts is in src/lib

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id, 10); // User ID from session is string

  const db = await getDb();
  try {
    // Fetch user's own transactions AND all public transactions.
    // We also join with the users table to get the username for public transactions.
    const transactions = await db.all<Transaction[]>( // Specify the type for db.all
      `SELECT t.*, u.username 
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.user_id = ? OR t.is_public = 1
       ORDER BY t.date DESC, t.created_at DESC`,
      userId
    );
    
    // Mark if the transaction is owned by the current user for frontend purposes
    const processedTransactions = transactions.map(tx => ({
      ...tx,
      is_owner: tx.user_id === userId
    }));

    return NextResponse.json(processedTransactions);
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json({ message: 'Failed to fetch transactions' }, { status: 500 });
  } finally {
    await db.close();
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const body = await request.json();
    const { description, category, amount, date, is_public } = body;

    // Basic validation
    if (!description || !category || amount === undefined || !date) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    if (typeof amount !== 'number') {
        return NextResponse.json({ message: 'Amount must be a number' }, { status: 400 });
    }
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ message: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    const db = await getDb();
    try {
      const result = await db.run(
        'INSERT INTO transactions (user_id, description, category, amount, date, is_public) VALUES (?, ?, ?, ?, ?, ?)',
        userId,
        description,
        category,
        amount,
        date,
        is_public ? 1 : 0
      );

      if (!result.lastID) {
        throw new Error('Failed to insert transaction, no ID returned.');
      }

      // Fetch the newly created transaction to return it
      // Including the username for consistency with GET, though for owned transactions it's less critical here
      const newTransaction = await db.get<Transaction>(
        `SELECT t.*, u.username 
         FROM transactions t
         JOIN users u ON t.user_id = u.id
         WHERE t.id = ?`,
        result.lastID
      );

      if (!newTransaction) {
        throw new Error('Failed to retrieve newly created transaction.');
      }

      return NextResponse.json({ ...newTransaction, is_owner: true }, { status: 201 });
    } finally {
      await db.close();
    }
  } catch (error: unknown) {
    console.error('Failed to create transaction:', error);
    // Check if it's a validation error message we set
    if (error instanceof Error && (error.message.includes('Missing required fields') || error.message.includes('Amount must be a number') || error.message.includes('Invalid date format'))) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create transaction' }, { status: 500 });
  }
}
