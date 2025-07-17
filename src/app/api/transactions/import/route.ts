import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { parseCSV } from '@/lib/csvParser';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return NextResponse.json({ message: 'File must be a CSV' }, { status: 400 });
    }

    const csvContent = await file.text();
    const parseResult = parseCSV(csvContent);

    if (!parseResult.success) {
      return NextResponse.json({ 
        message: 'CSV parsing failed', 
        errors: parseResult.errors 
      }, { status: 400 });
    }

    if (parseResult.transactions.length === 0) {
      return NextResponse.json({ 
        message: 'No valid transactions found in CSV' 
      }, { status: 400 });
    }

    const db = await getDb();
    let importedCount = 0;
    const errors: string[] = [];

    try {
      // Begin transaction for batch insert
      await db.run('BEGIN TRANSACTION');

      for (let i = 0; i < parseResult.transactions.length; i++) {
        const transaction = parseResult.transactions[i];
        
        try {
          await db.run(
            'INSERT INTO transactions (user_id, description, category, amount, date, is_public) VALUES (?, ?, ?, ?, ?, ?)',
            userId,
            transaction.description,
            transaction.category,
            transaction.amount,
            transaction.date,
            transaction.is_public ? 1 : 0
          );
          importedCount++;
        } catch (error) {
          errors.push(`Transaction ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      await db.run('COMMIT');

      return NextResponse.json({
        message: `Successfully imported ${importedCount} transactions`,
        imported: importedCount,
        total: parseResult.transactions.length,
        errors: errors.length > 0 ? errors : undefined
      }, { status: 200 });

    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    } finally {
      await db.close();
    }

  } catch (error: unknown) {
    console.error('Failed to import transactions:', error);
    return NextResponse.json({ 
      message: 'Failed to import transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}