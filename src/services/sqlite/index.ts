/**
 * SQLite Services - Barrel Export
 *
 * This file re-exports all SQLite-related services from a single location.
 *
 * ## What is a Barrel Export?
 * A "barrel" is a file that re-exports items from multiple modules.
 * Instead of importing from individual files:
 *
 * ```typescript
 * // Without barrel (verbose, multiple imports)
 * import { initDatabase } from '@/services/sqlite/database';
 * import { saveSession, getSession } from '@/services/sqlite/sessionService';
 * ```
 *
 * You can import from one place:
 *
 * ```typescript
 * // With barrel (clean, single import)
 * import { initDatabase, saveSession, getSession } from '@/services/sqlite';
 * ```
 *
 * ## Benefits of Barrel Exports
 * 1. **Cleaner imports**: One import statement instead of many
 * 2. **Encapsulation**: Hide internal file structure from consumers
 * 3. **Easier refactoring**: Change internal structure without breaking imports
 * 4. **Clear public API**: Explicitly define what's exported
 *
 * @module sqlite
 */

// Database initialization and management
export {
  initDatabase,
  getDatabase,
  closeDatabase,
  clearAllData,
} from "./database";

// Session management (user authentication cache)
export {
  saveSession,
  getSession,
  getSessionByUserId,
  updateSession,
  deleteSession,
  hasSession,
  getSessionAge,
} from "./sessionService";

// Types
export type { UserSession } from "./sessionService";
