/**
 * SQLite Database Service
 *
 * This file handles the initialization and management of our local SQLite database.
 *
 * ## What is SQLite?
 * SQLite is a lightweight, file-based relational database that runs directly on the device.
 * Unlike Firebase (which is cloud-based), SQLite stores data locally, making it perfect for:
 * - Offline data access (works without internet)
 * - Fast reads (no network latency)
 * - Caching frequently accessed data
 * - Persisting data that doesn't need to sync
 *
 * ## Why Use SQLite in Addition to Firebase?
 *
 * | Feature          | SQLite (Local)      | Firebase (Cloud)     |
 * |------------------|---------------------|----------------------|
 * | Speed            | Instant (local)     | Network dependent    |
 * | Offline          | Always works        | Limited offline      |
 * | Sync             | Manual              | Automatic            |
 * | Data ownership   | On device           | On server            |
 * | Use case         | Cache, session      | Primary data store   |
 *
 * ## In This Project
 * We use SQLite to cache the user's session data locally. This means:
 * 1. Faster app startup (we can show cached user info immediately)
 * 2. Better offline experience (user stays "logged in" visually)
 * 3. Reduced Firebase calls (we don't need to fetch user data every time)
 *
 * ## Key Concepts
 *
 * ### Database Connection
 * Unlike a server database, SQLite is a file on the device.
 * We open a connection to this file to read/write data.
 *
 * ### Tables
 * Just like a spreadsheet, data is organized in tables with rows and columns.
 * We define the structure (schema) when creating tables.
 *
 * ### Migrations
 * When we need to change the table structure (add columns, etc.),
 * we use migrations to safely update existing databases.
 *
 * @see https://docs.expo.dev/versions/latest/sdk/sqlite/
 */

import * as SQLite from "expo-sqlite";

/**
 * Database Configuration
 *
 * DATABASE_NAME: The name of the SQLite file stored on the device.
 * This file will be created in the app's private storage directory.
 *
 * DATABASE_VERSION: Used for migrations. When we need to change the
 * database structure, we increment this number and add migration logic.
 */
const DATABASE_NAME = "pochoclo.db";
const DATABASE_VERSION = 1;

/**
 * Database instance (singleton pattern)
 *
 * We keep a single reference to the database connection.
 * This prevents opening multiple connections which can cause issues.
 *
 * The 'let' keyword means this can be reassigned (when we open the DB).
 * The 'null' initial value means "no database connection yet".
 */
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Opens and initializes the SQLite database
 *
 * This function:
 * 1. Opens a connection to the database file (creates it if it doesn't exist)
 * 2. Creates the necessary tables if they don't exist
 * 3. Runs any pending migrations
 *
 * ## Why async/await?
 * Database operations take time (reading/writing files), so they're asynchronous.
 * We use async/await to wait for each operation to complete before continuing.
 *
 * ## The singleton pattern
 * If the database is already open, we return the existing connection.
 * This prevents opening multiple connections to the same database.
 *
 * @returns Promise<SQLiteDatabase> - The database connection
 *
 * @example
 * ```typescript
 * // Initialize at app startup
 * const database = await initDatabase();
 *
 * // Now you can use the database
 * await database.runAsync('SELECT * FROM user_session');
 * ```
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  // If we already have a connection, reuse it (singleton pattern)
  // This prevents multiple connections which can cause locking issues
  if (db !== null) {
    return db;
  }

  try {
    // Open (or create) the database file
    // openDatabaseAsync is the modern async API from expo-sqlite
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    // Enable Write-Ahead Logging (WAL) for better performance
    // WAL allows reading while writing, which is faster for most use cases
    await db.execAsync("PRAGMA journal_mode = WAL;");

    // Create tables if they don't exist
    // This is safe to run multiple times - it won't duplicate tables
    await createTables(db);

    // Run any pending migrations
    // Migrations update the database structure when we release new versions
    await runMigrations(db);

    console.log("SQLite database initialized successfully");
    return db;
  } catch (error) {
    // If something goes wrong, log it and rethrow
    // This helps us debug database issues
    console.error("Failed to initialize SQLite database:", error);
    throw error;
  }
}

/**
 * Creates the database tables
 *
 * This function defines the structure of our database using SQL CREATE TABLE statements.
 *
 * ## SQL Syntax Explained
 *
 * CREATE TABLE IF NOT EXISTS:
 * - CREATE TABLE: Make a new table
 * - IF NOT EXISTS: Only create if it doesn't already exist (prevents errors)
 *
 * Column Definitions:
 * - column_name TYPE: Define a column with its data type
 * - PRIMARY KEY: This column uniquely identifies each row
 * - UNIQUE: No two rows can have the same value in this column
 * - NOT NULL: This column must have a value (can't be empty)
 *
 * ## Data Types in SQLite
 * - INTEGER: Whole numbers (1, 2, 100, -5)
 * - TEXT: Strings/text ("hello", "user@email.com")
 * - REAL: Decimal numbers (3.14, 99.99)
 * - BLOB: Binary data (images, files)
 *
 * @param database - The SQLite database connection
 */
async function createTables(database: SQLite.SQLiteDatabase): Promise<void> {
  // Create the user_session table
  // This stores the currently logged-in user's information locally
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS user_session (
      -- id: Auto-incrementing primary key
      -- INTEGER PRIMARY KEY in SQLite automatically increments
      id INTEGER PRIMARY KEY,

      -- user_id: The Firebase user's unique ID
      -- UNIQUE ensures we only have one session per user
      -- TEXT because Firebase UIDs are strings like "abc123xyz"
      user_id TEXT UNIQUE NOT NULL,

      -- email: The user's email address
      -- TEXT for storing email strings
      email TEXT,

      -- display_name: The user's display name (can be null if not set)
      display_name TEXT,

      -- photo_url: URL to the user's profile photo (can be null)
      photo_url TEXT,

      -- last_login: Unix timestamp of when the user last logged in
      -- INTEGER because timestamps are stored as numbers
      -- (milliseconds since January 1, 1970)
      last_login INTEGER NOT NULL,

      -- created_at: When this session record was created
      -- Helps us track how long the cache has existed
      created_at INTEGER NOT NULL
    );
  `);

  // Create an index on user_id for faster lookups
  // An index is like a book's index - it helps find data faster
  // We frequently look up sessions by user_id, so this speeds up those queries
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_user_session_user_id
    ON user_session(user_id);
  `);

  console.log("SQLite tables created successfully");
}

/**
 * Runs database migrations
 *
 * Migrations are a way to evolve your database schema over time.
 * When you release a new version of your app that needs to change
 * the database structure, you add a migration.
 *
 * ## How Migrations Work
 * 1. We store the current database version in a special table
 * 2. On startup, we compare it to DATABASE_VERSION
 * 3. If the stored version is lower, we run migrations to update it
 *
 * ## Example Migration Scenario
 * Version 1: user_session table with basic fields
 * Version 2: Added 'preferences_cached' column
 *
 * When a user with V1 database updates to V2 app:
 * - We detect V1 < V2
 * - Run migration to add the new column
 * - Update stored version to V2
 *
 * @param database - The SQLite database connection
 */
async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  // Create a table to track the database version
  // This is a common pattern for managing migrations
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS db_version (
      version INTEGER PRIMARY KEY
    );
  `);

  // Get the current database version
  // If no version exists, this returns null (brand new database)
  const result = await database.getFirstAsync<{ version: number }>(
    "SELECT version FROM db_version LIMIT 1"
  );

  const currentVersion = result?.version ?? 0;

  // Run migrations based on current version
  // Each 'if' block handles upgrading from one version to the next

  if (currentVersion < 1) {
    // Version 1: Initial schema (already created in createTables)
    // We just need to set the version number

    // Delete any existing version record (for clean slate)
    await database.runAsync("DELETE FROM db_version");

    // Insert the current version
    await database.runAsync(
      "INSERT INTO db_version (version) VALUES (?)",
      DATABASE_VERSION
    );

    console.log(`SQLite migrated to version ${DATABASE_VERSION}`);
  }

  // Future migrations would go here:
  // if (currentVersion < 2) {
  //   await database.execAsync('ALTER TABLE user_session ADD COLUMN new_field TEXT');
  //   await database.runAsync('UPDATE db_version SET version = 2');
  //   console.log('SQLite migrated to version 2');
  // }
}

/**
 * Gets the current database instance
 *
 * This is a convenience function to get the database connection
 * without re-initializing it. Throws an error if the database
 * hasn't been initialized yet.
 *
 * ## When to Use
 * Use this when you know the database has already been initialized
 * (like in services that run after app startup).
 *
 * @returns The SQLite database connection
 * @throws Error if database hasn't been initialized
 *
 * @example
 * ```typescript
 * // In a service function
 * const db = getDatabase();
 * const result = await db.getAllAsync('SELECT * FROM user_session');
 * ```
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (db === null) {
    throw new Error(
      "Database not initialized. Call initDatabase() first at app startup."
    );
  }
  return db;
}

/**
 * Closes the database connection
 *
 * This should be called when the app is shutting down or when
 * you need to release the database connection.
 *
 * ## When to Use
 * - App is being terminated
 * - You need to delete and recreate the database
 * - Testing scenarios
 *
 * In most cases, you don't need to call this - the OS will
 * clean up when the app closes.
 */
export async function closeDatabase(): Promise<void> {
  if (db !== null) {
    await db.closeAsync();
    db = null;
    console.log("SQLite database closed");
  }
}

/**
 * Deletes all data from the database (for logout/reset)
 *
 * This function clears all user data from the local database.
 * Use this when the user logs out to ensure their data doesn't
 * persist for the next user.
 *
 * ## Security Note
 * When a user logs out, we should clear their local data.
 * This prevents the next user of the device from seeing
 * the previous user's cached information.
 *
 * @example
 * ```typescript
 * // When user logs out
 * await clearAllData();
 * ```
 */
export async function clearAllData(): Promise<void> {
  const database = getDatabase();

  // DELETE FROM removes all rows from the table
  // The table structure remains, just emptied of data
  await database.runAsync("DELETE FROM user_session");

  console.log("SQLite data cleared");
}
