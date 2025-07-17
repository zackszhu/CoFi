import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db'; // Use shared DB connection

interface Params {
  id: string;
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);

  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id, 10);
  const transactionId = parseInt(id, 10);

  if (isNaN(transactionId)) {
    return NextResponse.json({ message: 'Invalid transaction ID' }, { status: 400 });
  }

  const db = await getDb();
  try {
    // First, verify the transaction exists and belongs to the user
    const transaction = await db.get(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      transactionId,
      userId
    );

    if (!transaction) {
      // If it doesn't exist or doesn't belong to the user, they can't delete it.
      // We don't differentiate to avoid leaking information about transaction existence.
      return NextResponse.json({ message: 'Transaction not found or not authorized to delete' }, { status: 404 });
    }

    // Proceed with deletion
    const result = await db.run('DELETE FROM transactions WHERE id = ? AND user_id = ?', transactionId, userId);

    if (result.changes === 0) {
      // Should not happen if the above check passed, but good for safety
      return NextResponse.json({ message: 'Failed to delete transaction or transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    return NextResponse.json({ message: 'Failed to delete transaction' }, { status: 500 });
  } finally {
    await db.close();
  }
}

// New PUT handler for updating transactions
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id, 10);
  const transactionId = parseInt(id, 10);

  if (isNaN(transactionId)) {
    return NextResponse.json({ message: 'Invalid transaction ID' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const { description, category, amount, date, is_public } = body;

  // Basic validation
  if (typeof description !== 'string' || description.trim() === '' ||
    typeof category !== 'string' || category.trim() === '' ||
    typeof amount !== 'number' || isNaN(amount) ||
    typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || // Validate YYYY-MM-DD format
    typeof is_public !== 'boolean') {
    return NextResponse.json({ message: 'Invalid transaction data' }, { status: 400 });
  }

  const db = await getDb();
  try {
    // Verify the transaction exists and belongs to the user
    const existingTransaction = await db.get(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      transactionId,
      userId
    );

    if (!existingTransaction) {
      return NextResponse.json({ message: 'Transaction not found or not authorized to update' }, { status: 404 });
    }

    // Proceed with update
    const result = await db.run(
      'UPDATE transactions SET description = ?, category = ?, amount = ?, date = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      description,
      category,
      amount,
      date,
      is_public,
      transactionId,
      userId
    );

    if (result.changes === 0) {
      // Should not happen if the above check passed, but good for safety
      return NextResponse.json({ message: 'Failed to update transaction or transaction not found' }, { status: 404 });
    }

    // Fetch the updated transaction to return it
    const updatedTransaction = await db.get(
      'SELECT * FROM transactions WHERE id = ?',
      transactionId
    );

    if (updatedTransaction) {
      updatedTransaction.is_public = Boolean(updatedTransaction.is_public);
    }

    return NextResponse.json(updatedTransaction, { status: 200 });
  } catch (error) {
    console.error('Failed to update transaction:', error);
    return NextResponse.json({ message: 'Failed to update transaction' }, { status: 500 });
  } finally {
    await db.close();
  }
}
