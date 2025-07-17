import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs/promises';
import { initializeDatabase } from './db/init-db';

// Define the path to the database file
export const dbPath = path.resolve(process.cwd(), 'data', 'cofi.db');

// Promise to ensure DB is initialized before any getDb call proceeds
const dbInitializationEnsured = (async () => {
  try {
    await fs.access(dbPath);
    console.log('Database file already exists. Skipping initialization.');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    // File does not exist or is not accessible, proceed with creation/initialization
    console.log('Database file not found. Initializing new database...');
    try {
      // Ensure the directory exists
      const dir = path.dirname(dbPath);
      await fs.mkdir(dir, { recursive: true });
      console.log(`Ensured directory ${dir} exists.`);

      // Initialize the database (creates tables and populates initial data)
      await initializeDatabase();
      console.log('Database initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error; // Re-throw to prevent the app from starting with a bad DB state
    }
  }
})();

// Function to open the database connection
export async function getDb() {
  await dbInitializationEnsured; // Wait for initialization check to complete
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}
