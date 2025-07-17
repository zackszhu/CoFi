import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = await getDb();
    // Fetch all transactions. 
    // No need to join with users table for these aggregate statistics.
    const transactions = await db.all('SELECT * FROM transactions ORDER BY date DESC');
    await db.close();

    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch all transactions:', error);
    return NextResponse.json({ message: 'Failed to fetch all transactions' }, { status: 500 });
  }
}
