/**
 * SQLite Session Service
 *
 * This service handles storing and retrieving user session data from SQLite.
 *
 * ## Purpose
 * When a user logs in, we save their session information locally.
 * This provides several benefits:
 *
 * 1. **Faster App Startup**: We can show the user's info immediately
 *    from the local cache while Firebase verifies the session.
 *
 * 2. **Offline Display**: Even without internet, we can show who's
 *    logged in (though actions may be limited).
 *
 * 3. **Reduced API Calls**: We don't need to fetch user data from
 *    Firebase every time the app opens.
 *
 * ## CRUD Operations
 * CRUD stands for Create, Read, Update, Delete - the four basic
 * operations for persistent storage:
 *
 * - **Create**: saveSession() - Store a new session
 * - **Read**: getSession() - Retrieve the current session
 * - **Update**: updateSession() - Modify existing session data
 * - **Delete**: deleteSession() - Remove the session (logout)
 *
 * ## Data Flow
 * ```
 * User logs in → Firebase Auth verifies → Save to SQLite
 *                                              ↓
 * App opens → Load from SQLite (fast!) → Display user info
 *                                              ↓
 *             Firebase verifies (background) → Update if needed
 * ```
 *
 * @module sessionService
 */

import { getDatabase } from "./database";

/**
 * UserSession Type
 *
 * This interface defines the shape of session data we store locally.
 * It mirrors the essential fields from Firebase Auth's User object,
 * but only includes what we need for local caching.
 *
 * ## Why Not Store Everything?
 * Firebase Auth's User object has many fields (tokens, metadata, etc.)
 * We only cache what's needed to display the UI:
 * - User identification (uid, email)
 * - Display info (displayName, photoURL)
 * - Timestamps for cache management
 *
 * ## TypeScript Interface
 * An interface defines the "shape" of an object - what properties
 * it has and their types. This helps catch errors at compile time.
 */
export interface UserSession {
  /** Firebase user ID (unique identifier) */
  userId: string;

  /** User's email address */
  email: string | null;

  /** User's display name (profile name) */
  displayName: string | null;

  /** URL to the user's profile photo */
  photoURL: string | null;

  /** Unix timestamp (ms) of last login */
  lastLogin: number;

  /** Unix timestamp (ms) when this cache entry was created */
  createdAt: number;
}

/**
 * Database row type (internal use)
 *
 * SQLite returns data with snake_case column names (SQL convention),
 * but JavaScript/TypeScript uses camelCase (JS convention).
 *
 * This type represents the raw database row before we transform it.
 */
interface SessionRow {
  id: number;
  user_id: string;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  last_login: number;
  created_at: number;
}

/**
 * Saves a user session to SQLite
 *
 * This function stores the user's session data locally after a successful login.
 * It uses an "upsert" pattern: insert if new, update if exists.
 *
 * ## SQL Explained: INSERT OR REPLACE
 *
 * ```sql
 * INSERT OR REPLACE INTO user_session (...) VALUES (...)
 * ```
 *
 * This is SQLite's way of doing an "upsert" (update or insert):
 * - If a row with the same user_id exists → Replace it
 * - If no row exists → Insert a new one
 *
 * This is simpler than checking if the user exists first,
 * then deciding whether to INSERT or UPDATE.
 *
 * ## Parameterized Queries (Security)
 *
 * Notice we use `?` placeholders instead of string concatenation:
 * ```sql
 * VALUES (?, ?, ?, ?, ?, ?)  -- Good: Safe from SQL injection
 * VALUES ('${userId}', ...)  -- Bad: SQL injection vulnerability!
 * ```
 *
 * The `?` placeholders are replaced with the actual values safely,
 * preventing SQL injection attacks.
 *
 * @param session - The user session data to save
 *
 * @example
 * ```typescript
 * // After Firebase login succeeds
 * await saveSession({
 *   userId: firebaseUser.uid,
 *   email: firebaseUser.email,
 *   displayName: firebaseUser.displayName,
 *   photoURL: firebaseUser.photoURL,
 *   lastLogin: Date.now(),
 *   createdAt: Date.now(),
 * });
 * ```
 */
export async function saveSession(session: UserSession): Promise<void> {
  const db = getDatabase();

  // INSERT OR REPLACE: Upsert pattern
  // If a row with the same user_id exists (UNIQUE constraint), replace it
  // Otherwise, insert a new row
  await db.runAsync(
    `INSERT OR REPLACE INTO user_session
      (user_id, email, display_name, photo_url, last_login, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      session.userId,
      session.email,
      session.displayName,
      session.photoURL,
      session.lastLogin,
      session.createdAt,
    ]
  );

  console.log("Session saved to SQLite for user:", session.userId);
}

/**
 * Retrieves the current user session from SQLite
 *
 * This function fetches the cached session data. We expect only one
 * session at a time (single-user app), so we get the most recent one.
 *
 * ## SQL Explained: SELECT with ORDER BY and LIMIT
 *
 * ```sql
 * SELECT * FROM user_session ORDER BY last_login DESC LIMIT 1
 * ```
 *
 * - SELECT *: Get all columns
 * - FROM user_session: From the user_session table
 * - ORDER BY last_login DESC: Sort by last_login, newest first
 * - LIMIT 1: Only get the first row (most recent)
 *
 * ## Why ORDER BY last_login?
 * In case there are multiple sessions (shouldn't happen, but safety first),
 * we want the most recent one. DESC means descending (highest/newest first).
 *
 * @returns The cached session or null if none exists
 *
 * @example
 * ```typescript
 * const cachedSession = await getSession();
 * if (cachedSession) {
 *   console.log('Welcome back,', cachedSession.displayName);
 * } else {
 *   console.log('No cached session, show login screen');
 * }
 * ```
 */
export async function getSession(): Promise<UserSession | null> {
  const db = getDatabase();

  // Get the most recent session
  const row = await db.getFirstAsync<SessionRow>(
    "SELECT * FROM user_session ORDER BY last_login DESC LIMIT 1"
  );

  // If no row found, return null
  if (!row) {
    return null;
  }

  // Transform from snake_case (SQL) to camelCase (JavaScript)
  // This is a common pattern when working with SQL databases in JS
  return transformRowToSession(row);
}

/**
 * Retrieves a session by user ID
 *
 * Sometimes we need to get a specific user's session, not just
 * "the current session". This is useful for multi-user scenarios
 * or verifying a specific user's cache.
 *
 * ## SQL Explained: WHERE clause
 *
 * ```sql
 * SELECT * FROM user_session WHERE user_id = ?
 * ```
 *
 * The WHERE clause filters rows. Only rows where user_id matches
 * the provided value are returned.
 *
 * @param userId - The Firebase user ID to look up
 * @returns The session for that user or null if not found
 */
export async function getSessionByUserId(
  userId: string
): Promise<UserSession | null> {
  const db = getDatabase();

  const row = await db.getFirstAsync<SessionRow>(
    "SELECT * FROM user_session WHERE user_id = ?",
    [userId]
  );

  if (!row) {
    return null;
  }

  return transformRowToSession(row);
}

/**
 * Updates an existing session
 *
 * When user data changes (like updating their profile photo or name),
 * we update the local cache to keep it in sync.
 *
 * ## Partial Updates
 * We use Object.entries() to build the UPDATE query dynamically.
 * This means you only need to pass the fields you want to update:
 *
 * ```typescript
 * // Only update the photo
 * await updateSession('user123', { photoURL: 'https://...' });
 *
 * // Update multiple fields
 * await updateSession('user123', {
 *   displayName: 'New Name',
 *   photoURL: 'https://...',
 * });
 * ```
 *
 * @param userId - The user's ID to update
 * @param updates - Partial session data to update
 *
 * @example
 * ```typescript
 * // User changed their profile photo
 * await updateSession(userId, {
 *   photoURL: newPhotoUrl,
 *   lastLogin: Date.now(),
 * });
 * ```
 */
export async function updateSession(
  userId: string,
  updates: Partial<Omit<UserSession, "userId" | "createdAt">>
): Promise<void> {
  const db = getDatabase();

  // Map camelCase property names to snake_case column names
  const columnMap: Record<string, string> = {
    email: "email",
    displayName: "display_name",
    photoURL: "photo_url",
    lastLogin: "last_login",
  };

  // Build SET clause dynamically from the updates object
  // e.g., "display_name = ?, photo_url = ?"
  const entries = Object.entries(updates).filter(
    ([key]) => columnMap[key] !== undefined
  );

  if (entries.length === 0) {
    // Nothing to update
    return;
  }

  const setClause = entries.map(([key]) => `${columnMap[key]} = ?`).join(", ");

  const values = entries.map(([, value]) => value);

  // Add userId at the end for the WHERE clause
  values.push(userId);

  await db.runAsync(
    `UPDATE user_session SET ${setClause} WHERE user_id = ?`,
    values
  );

  console.log("Session updated in SQLite for user:", userId);
}

/**
 * Deletes a user's session (logout)
 *
 * When the user logs out, we should remove their session from
 * the local cache. This ensures:
 * 1. Their data doesn't persist for the next user
 * 2. The app shows the login screen on next launch
 *
 * ## SQL Explained: DELETE
 *
 * ```sql
 * DELETE FROM user_session WHERE user_id = ?
 * ```
 *
 * Removes rows that match the WHERE condition.
 * If user_id is not provided, we delete ALL sessions (full logout).
 *
 * @param userId - Optional: specific user to delete. If omitted, deletes all.
 *
 * @example
 * ```typescript
 * // On logout button press
 * await deleteSession(currentUser.uid);
 * ```
 */
export async function deleteSession(userId?: string): Promise<void> {
  const db = getDatabase();

  if (userId) {
    // Delete specific user's session
    await db.runAsync("DELETE FROM user_session WHERE user_id = ?", [userId]);
    console.log("Session deleted from SQLite for user:", userId);
  } else {
    // Delete all sessions (full reset)
    await db.runAsync("DELETE FROM user_session");
    console.log("All sessions deleted from SQLite");
  }
}

/**
 * Checks if a cached session exists
 *
 * Quick check to see if we have any cached session data.
 * Useful for deciding whether to show a loading state or login screen.
 *
 * ## SQL Explained: COUNT(*)
 *
 * ```sql
 * SELECT COUNT(*) as count FROM user_session
 * ```
 *
 * COUNT(*) returns the number of rows in the table.
 * More efficient than SELECT * when you just need to know if data exists.
 *
 * @returns true if a session exists, false otherwise
 */
export async function hasSession(): Promise<boolean> {
  const db = getDatabase();

  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM user_session"
  );

  return (result?.count ?? 0) > 0;
}

/**
 * Gets the age of the cached session in milliseconds
 *
 * Helps determine if the cache is stale and needs refreshing.
 * For example, you might want to re-fetch user data from Firebase
 * if the cache is more than 24 hours old.
 *
 * @returns Age in milliseconds, or null if no session exists
 *
 * @example
 * ```typescript
 * const age = await getSessionAge();
 * const ONE_DAY = 24 * 60 * 60 * 1000;
 *
 * if (age && age > ONE_DAY) {
 *   console.log('Cache is stale, refresh from Firebase');
 * }
 * ```
 */
export async function getSessionAge(): Promise<number | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return Date.now() - session.createdAt;
}

/**
 * Transforms a database row to a UserSession object
 *
 * This is a helper function that converts snake_case column names
 * (SQL convention) to camelCase property names (JavaScript convention).
 *
 * ## Why Transform?
 * - SQL uses snake_case: user_id, display_name, photo_url
 * - JavaScript uses camelCase: userId, displayName, photoURL
 *
 * Keeping both conventions in their natural form makes the code
 * more readable in both contexts.
 *
 * @param row - The raw database row
 * @returns Transformed UserSession object
 */
function transformRowToSession(row: SessionRow): UserSession {
  return {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    photoURL: row.photo_url,
    lastLogin: row.last_login,
    createdAt: row.created_at,
  };
}
