import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import { getConfig } from '../appConfigLoader';
import { dbPath } from '../db';

// Define salt rounds for bcrypt
const saltRounds = 10;

async function initializeDatabaseInternal() {
  // Open the database, creating it if it doesn't exist
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  console.log('Connected to the SQLite database.');

  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      pin_hash TEXT NOT NULL 
    );
  `);
  console.log('Users table created or already exists.');

  // Create transactions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL, -- Store as ISO8601 string e.g., YYYY-MM-DD
      is_public INTEGER NOT NULL DEFAULT 0, -- 0 for private, 1 for public
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  console.log('Transactions table created or already exists.');

  // Create a trigger to update 'updated_at' timestamp on transactions table
  await db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_transactions_updated_at
    AFTER UPDATE ON transactions
    FOR EACH ROW
    BEGIN
      UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `);
  console.log('Transactions updated_at trigger created or already exists.');

  // Get config
  const config = getConfig();

  // Insert initial users (if they don't exist)
  const initialUsers = config.users.map(user => ({
    username: user.name,
    plainPin: user.pin
  }));

  for (const user of initialUsers) {
    try {
      // Check if user already exists to avoid re-hashing and re-inserting
      const existingUser = await db.get('SELECT id FROM users WHERE username = ?', user.username);
      if (existingUser) {
        console.log(`User ${user.username} already exists.`);
        continue;
      }

      const hashedPin = await bcrypt.hash(user.plainPin, saltRounds);
      const result = await db.run(
        'INSERT INTO users (username, pin_hash) VALUES (?, ?)',
        user.username,
        hashedPin
      );
      if (result.lastID) {
        console.log(`User ${user.username} inserted with ID: ${result.lastID} (PIN has been hashed)`);
      }
    } catch (error: unknown) {
      // This specific check for UNIQUE constraint might be redundant now due to the explicit check above,
      // but kept for general error handling.
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed: users.username')) {
        console.log(`User ${user.username} already exists (caught by constraint).`);
      } else {
        console.error(`Failed to insert user ${user.username}:`, error);
      }
    }
  }

  await db.close();
  console.log('Database connection closed.');
}

export const initializeDatabase = initializeDatabaseInternal;
