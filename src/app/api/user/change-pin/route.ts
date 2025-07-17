import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db'; // Use shared DB connection
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.name) { // Check for username as well, as we'll use it
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id, 10);
  const username = session.user.name; // Username from session

  try {
    const body = await request.json();
    const { currentPin, newPin } = body;

    if (!currentPin || !newPin) {
      return NextResponse.json({ message: 'Current PIN and new PIN are required.' }, { status: 400 });
    }

    if (typeof newPin !== 'string' || newPin.length < 4) {
      return NextResponse.json({ message: 'New PIN must be a string and at least 4 characters long.' }, { status: 400 });
    }

    // Ensure currentPin is also a string before passing to bcrypt
    if (typeof currentPin !== 'string') {
      return NextResponse.json({ message: 'Current PIN must be a string.' }, { status: 400 });
    }


    const db = await getDb();
    try {
      // Fetch the user's current hashed PIN
      const user = await db.get('SELECT pin_hash FROM users WHERE id = ? AND username = ?', userId, username);

      if (!user) {
        return NextResponse.json({ message: 'User not found.' }, { status: 404 });
      }

      const currentPinMatches = await bcrypt.compare(currentPin, user.pin_hash);
      if (!currentPinMatches) {
        return NextResponse.json({ message: 'Current PIN is incorrect.' }, { status: 403 }); // 403 Forbidden
      }

      // Hash the new PIN
      const newPinHash = await bcrypt.hash(newPin, 10);

      // Update the PIN in the database
      const result = await db.run('UPDATE users SET pin_hash = ? WHERE id = ?', newPinHash, userId);

      if (result.changes === 0) {
        throw new Error('Failed to update PIN in database.');
      }

      return NextResponse.json({ message: 'PIN changed successfully!' }, { status: 200 });
    } finally {
      await db.close();
    }
  } catch (error: unknown) {
    console.error('Failed to change PIN:', error);
    // Check for specific error messages we set
    if (error instanceof Error && (error.message.includes('required') || error.message.includes('characters long') || error.message.includes('incorrect'))) {
      return NextResponse.json({ message: error.message }, { status: error.message.includes('incorrect') ? 403 : 400 });
    }
    return NextResponse.json({ message: 'An internal error occurred while changing PIN.' }, { status: 500 });
  }
}
