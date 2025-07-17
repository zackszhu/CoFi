import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';

/**
 * GET endpoint to fetch all users in the system
 * Only returns id and username information, never returns password/pin data
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  // Only authenticated users can access user information
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  try {
    // Get all users, but only include id and username (NOT pin_hash for security)
    const users = await db.all(`
      SELECT id, username FROM users
      ORDER BY username ASC
    `);

    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
  } finally {
    await db.close();
  }
}
