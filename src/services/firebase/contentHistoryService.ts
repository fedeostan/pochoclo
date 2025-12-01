/**
 * contentHistoryService.ts - Content History Management for Anti-Repetition System
 *
 * This service manages the content history collection in Firestore.
 * Its primary purpose is to prevent the AI from generating repetitive content
 * by tracking what topics have already been shown to each user.
 *
 * WHY DO WE NEED THIS?
 * Imagine using the app daily. Without tracking history, the AI might generate
 * content about "Electric Cars" multiple times because it doesn't "remember"
 * what it showed you before. This service solves that by:
 * 1. Storing a summary of each topic shown
 * 2. Sending the last 20 summaries with each new content request
 * 3. The AI uses these to avoid repetition
 *
 * DATA FLOW:
 * 1. User requests new content → We fetch last 20 summaries from this service
 * 2. Summaries are included in the webhook payload to n8n
 * 3. n8n/AI generates content avoiding those topics
 * 4. New content arrives → We add it to history via this service
 *
 * FIRESTORE STRUCTURE:
 * users/{userId}/contentHistory/{historyId}
 * ├── requestId (string) - Links to the original content request
 * ├── topicSummary (string, max 100 chars) - Brief description for AI context
 * ├── category (string) - Primary category (e.g., "technology")
 * ├── generatedAt (Timestamp) - When the content was created
 * ├── viewed (boolean) - Has the user actually read this?
 * └── saved (boolean) - Did the user bookmark this?
 *
 * WHY A SUBCOLLECTION?
 * - Subcollections scale better than arrays in a single document
 * - Firestore documents have a 1MB limit; subcollections don't
 * - Easier to query, paginate, and filter
 * - Each entry has its own document ID for updates
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ContentHistoryEntry, GeneratedContent } from '@/types/content';

/**
 * COLLECTION PATHS
 *
 * We define paths as functions because subcollections depend on the userId.
 * This keeps our paths consistent and prevents typos.
 *
 * PATH STRUCTURE:
 * users/{userId}/contentHistory
 *
 * WHY A FUNCTION?
 * - The path changes based on userId
 * - Centralizes path construction
 * - Easy to update if structure changes
 */

/**
 * Get the Firestore collection reference for a user's content history
 *
 * @param userId - The Firebase Auth UID of the user
 * @returns A collection reference to the user's contentHistory subcollection
 *
 * WHAT IS A COLLECTION REFERENCE?
 * It's a "pointer" to a location in Firestore. We use it to:
 * - Query documents in the collection
 * - Add new documents
 * - Listen for changes (real-time updates)
 */
const getContentHistoryCollection = (userId: string) => {
  return collection(db, 'users', userId, 'contentHistory');
};

/**
 * Get a document reference for a specific history entry
 *
 * @param userId - The Firebase Auth UID of the user
 * @param historyId - The document ID of the history entry
 * @returns A document reference to the specific history entry
 */
const getContentHistoryDoc = (userId: string, historyId: string) => {
  return doc(db, 'users', userId, 'contentHistory', historyId);
};

/**
 * Get the Firestore collection reference for a user's generated content
 *
 * @param userId - The Firebase Auth UID of the user
 * @returns A collection reference to the user's generatedContent subcollection
 *
 * PATH: users/{userId}/generatedContent
 * This is where n8n writes the AI-generated content.
 */
const getGeneratedContentCollection = (userId: string) => {
  return collection(db, 'users', userId, 'generatedContent');
};

// =============================================================================
// READ OPERATIONS
// =============================================================================

/**
 * Fetch Content History Summaries
 *
 * Retrieves the topic summaries from the user's most recent content history.
 * These summaries are sent to n8n/AI to prevent generating similar content.
 *
 * @param userId - The Firebase Auth UID of the user
 * @param maxEntries - Maximum number of entries to fetch (default: 20)
 * @returns Promise<string[]> - Array of topic summaries (most recent first)
 *
 * WHY ONLY SUMMARIES?
 * - The webhook payload only needs topic summaries, not full entries
 * - Reduces payload size (important for HTTP requests)
 * - Summaries are limited to ~100 chars each for efficiency
 *
 * WHY 20 ENTRIES?
 * - Enough context for the AI to understand recent topics
 * - Not so many that it overwhelms the AI's context window
 * - Balances anti-repetition with reasonable request size
 *
 * USAGE:
 * ```typescript
 * const summaries = await getContentHistorySummaries(userId);
 * // ["Electric car batteries", "Quantum computing basics", ...]
 * ```
 */
export async function getContentHistorySummaries(
  userId: string,
  maxEntries: number = 20
): Promise<string[]> {
  try {
    console.log('[ContentHistoryService] Fetching summaries for user:', userId);

    // Get reference to the user's content history collection
    const historyCollection = getContentHistoryCollection(userId);

    /**
     * Build the Query
     *
     * We want the most recent entries first, limited to maxEntries.
     *
     * orderBy('generatedAt', 'desc') - Newest first
     * limit(maxEntries) - Only get the number we need
     *
     * WHY ORDER BY generatedAt?
     * - We want recent history, not oldest
     * - Newer topics are more relevant for avoiding repetition
     */
    const historyQuery = query(
      historyCollection,
      orderBy('generatedAt', 'desc'),
      limit(maxEntries)
    );

    // Execute the query
    const snapshot = await getDocs(historyQuery);

    /**
     * Extract Summaries
     *
     * snapshot.docs is an array of document snapshots.
     * We map over them to extract just the topicSummary field.
     *
     * WHY .data()?
     * - Each doc is a DocumentSnapshot, not the raw data
     * - .data() returns the actual document fields
     */
    const summaries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return data.topicSummary as string;
    });

    console.log(
      '[ContentHistoryService] Fetched',
      summaries.length,
      'summaries'
    );

    return summaries;
  } catch (error) {
    /**
     * Error Handling
     *
     * If fetching fails (e.g., network error, permissions), we return
     * an empty array instead of throwing. This allows the content
     * generation to proceed even without history.
     *
     * WHY NOT THROW?
     * - Missing history isn't critical - content can still be generated
     * - Better UX: Users get content even if history fetch fails
     * - Logs the error for debugging
     */
    console.error('[ContentHistoryService] Error fetching summaries:', error);
    return [];
  }
}

/**
 * Fetch Full Content History Entries
 *
 * Retrieves complete history entries (not just summaries).
 * Used for displaying history in the UI or for detailed analysis.
 *
 * @param userId - The Firebase Auth UID of the user
 * @param maxEntries - Maximum number of entries to fetch (default: 20)
 * @returns Promise<ContentHistoryEntry[]> - Array of full history entries
 *
 * WHEN TO USE THIS VS getContentHistorySummaries:
 * - getContentHistorySummaries: For webhook payload (just summaries)
 * - getFullContentHistory: For Redux state or UI display (full data)
 *
 * USAGE:
 * ```typescript
 * const history = await getFullContentHistory(userId);
 * dispatch(setContentHistory(history));
 * ```
 */
export async function getFullContentHistory(
  userId: string,
  maxEntries: number = 20
): Promise<ContentHistoryEntry[]> {
  try {
    console.log('[ContentHistoryService] Fetching full history for user:', userId);

    const historyCollection = getContentHistoryCollection(userId);

    const historyQuery = query(
      historyCollection,
      orderBy('generatedAt', 'desc'),
      limit(maxEntries)
    );

    const snapshot = await getDocs(historyQuery);

    /**
     * Map Documents to ContentHistoryEntry
     *
     * We need to:
     * 1. Add the document ID to each entry (for updates/deletes)
     * 2. Convert Firestore Timestamp to ISO string for Redux compatibility
     *
     * WHY ISO STRINGS?
     * Redux requires all state values to be serializable (JSON-compatible).
     * Date objects are NOT serializable, so we convert to ISO strings.
     * Components can convert back when needed: new Date(isoString)
     */
    const entries: ContentHistoryEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id, // Add document ID for future updates
        requestId: data.requestId,
        topicSummary: data.topicSummary,
        category: data.category,
        generatedAt:
          (data.generatedAt as Timestamp)?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
        viewed: data.viewed || false,
        saved: data.saved || false,
        // viewedAt is optional - only present after user marks as read
        viewedAt: data.viewedAt
          ? (data.viewedAt as Timestamp)?.toDate?.()?.toISOString()
          : undefined,
      };
    });

    console.log('[ContentHistoryService] Fetched', entries.length, 'entries');

    return entries;
  } catch (error) {
    /**
     * Enhanced error logging for debugging permission issues
     *
     * If you see "Missing or insufficient permissions" here:
     * 1. Check Firebase Console → Firestore → Rules
     * 2. Ensure rules allow read access to users/{userId}/contentHistory
     * 3. Verify the userId matches the authenticated user's UID
     */
    console.error('[ContentHistoryService] Error fetching full history:', error);
    console.error('[ContentHistoryService] Error code:', (error as any)?.code);
    console.error('[ContentHistoryService] Attempted path:', `users/${userId}/contentHistory`);

    // Log specific guidance for permission errors
    if (
      (error as any)?.code === 'permission-denied' ||
      (error as Error)?.message?.includes('permission')
    ) {
      console.error(
        '[ContentHistoryService] PERMISSION ERROR - Check Firebase security rules:',
        '\n  Expected rule: match /users/{userId}/contentHistory/{historyId} {',
        '\n    allow read, write: if request.auth != null && request.auth.uid == userId;',
        '\n  }'
      );
    }

    return [];
  }
}

/**
 * Find History Entry by Request ID
 *
 * Looks up a content history entry using the requestId.
 * Returns the history document ID (historyId) needed for markContentViewed.
 *
 * @param userId - The Firebase Auth UID of the user
 * @param requestId - The requestId of the content
 * @returns Promise<string | null> - The historyId or null if not found
 *
 * WHY DO WE NEED THIS?
 * The GeneratedContent type has requestId but not historyId.
 * To call markContentViewed(), we need the Firestore document ID.
 * This function bridges that gap by querying for the history entry.
 *
 * USAGE:
 * ```typescript
 * const historyId = await getHistoryIdByRequestId(userId, content.requestId);
 * if (historyId) {
 *   await markContentViewed(userId, historyId);
 * }
 * ```
 */
export async function getHistoryIdByRequestId(
  userId: string,
  requestId: string
): Promise<string | null> {
  try {
    console.log('[ContentHistoryService] Looking up history by requestId:', requestId);

    const historyCollection = getContentHistoryCollection(userId);

    // Query for the entry with matching requestId
    const historyQuery = query(
      historyCollection,
      where('requestId', '==', requestId),
      limit(1)
    );

    const snapshot = await getDocs(historyQuery);

    if (snapshot.empty) {
      console.log('[ContentHistoryService] No history entry found for requestId:', requestId);
      return null;
    }

    const historyId = snapshot.docs[0].id;
    console.log('[ContentHistoryService] Found historyId:', historyId);
    return historyId;
  } catch (error) {
    console.error('[ContentHistoryService] Error looking up history by requestId:', error);
    return null;
  }
}

/**
 * Fetch Latest Generated Content
 *
 * Retrieves the most recent generated content for a user.
 * Used to restore content when returning users open the app.
 *
 * @param userId - The Firebase Auth UID of the user
 * @returns Promise<GeneratedContent | null> - The latest content or null if none exists
 *
 * WHY DO WE NEED THIS?
 * When a returning user opens the app, we want to show their last generated
 * content instead of auto-triggering new generation. This provides a better UX:
 * - No unnecessary API calls to n8n
 * - User can review their previous content
 * - User decides when to generate new content via FAB button
 *
 * WHEN TO USE:
 * - On HomeScreen mount for returning users
 * - NOT for new users (they should auto-trigger generation)
 *
 * USAGE:
 * ```typescript
 * const latestContent = await getLatestGeneratedContent(userId);
 * if (latestContent) {
 *   dispatch(contentReceived(latestContent));
 * } else {
 *   // No content exists, show empty state or auto-trigger
 * }
 * ```
 */
export async function getLatestGeneratedContent(
  userId: string
): Promise<GeneratedContent | null> {
  try {
    console.log('[ContentHistoryService] Fetching latest content for user:', userId);

    // Get reference to the user's generated content collection
    const contentCollection = getGeneratedContentCollection(userId);

    /**
     * Build the Query
     *
     * We want the most recent completed content.
     * - orderBy('generatedAt', 'desc') - Newest first
     * - limit(1) - Only get the latest one
     *
     * NOTE: This fetches ALL documents and filters by timestamp.
     * For a more efficient query, you could add a "latest" field
     * or use a single document approach for current content.
     */
    const contentQuery = query(
      contentCollection,
      orderBy('generatedAt', 'desc'),
      limit(1)
    );

    // Execute the query
    const snapshot = await getDocs(contentQuery);

    // No content found
    if (snapshot.empty) {
      console.log('[ContentHistoryService] No generated content found');
      return null;
    }

    // Get the first (and only) document
    const docData = snapshot.docs[0].data();

    // Only return completed content
    if (docData.status !== 'completed') {
      console.log('[ContentHistoryService] Latest content not completed, status:', docData.status);
      return null;
    }

    /**
     * Convert Firestore Document to GeneratedContent
     *
     * Convert Timestamp to ISO string for Redux compatibility.
     */
    const content: GeneratedContent = {
      requestId: docData.requestId,
      status: docData.status,
      content: docData.content,
      topicSummary: docData.topicSummary,
      generatedAt: docData.generatedAt?.toDate?.()?.toISOString?.() || null,
      error: docData.error,
    };

    console.log('[ContentHistoryService] Latest content fetched:', content.requestId);

    return content;
  } catch (error) {
    console.error('[ContentHistoryService] Error fetching latest content:', error);
    return null;
  }
}

// =============================================================================
// STATISTICS OPERATIONS
// =============================================================================

/**
 * Get Weekly Reading Count
 *
 * Returns the number of articles the user has ACTUALLY READ in the current week.
 * Used for the MinimalStatsBar component to show "X this week".
 *
 * IMPORTANT CHANGE:
 * Previously counted based on generatedAt (when AI created content).
 * Now counts based on viewedAt (when user actually read/dismissed).
 * This gives a more accurate representation of user engagement.
 *
 * @param userId - The Firebase Auth UID of the user
 * @returns Promise<number> - Count of articles READ this week
 *
 * HOW IT WORKS:
 * 1. Fetch recent history entries (up to 50)
 * 2. Filter to only entries with viewed: true AND viewedAt timestamp
 * 3. Count entries where viewedAt falls within current week (Sunday-Saturday)
 *
 * BACKWARDS COMPATIBILITY:
 * For older entries without viewedAt, we fall back to checking viewed: true
 * and use generatedAt as the date. This handles legacy data gracefully.
 *
 * USAGE:
 * ```typescript
 * const weeklyCount = await getWeeklyReadingCount(userId);
 * // Returns: 3 (articles user actually read this week)
 * ```
 */
export async function getWeeklyReadingCount(userId: string): Promise<number> {
  try {
    // Get recent history entries (more to ensure we capture full week)
    const history = await getFullContentHistory(userId, 50);

    // Calculate the start of the current week (Sunday at 00:00:00)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Go to Sunday
    startOfWeek.setHours(0, 0, 0, 0); // Start of day

    // Count entries that were READ this week
    // Must have viewed: true AND (viewedAt OR generatedAt) within this week
    const weeklyCount = history.filter((entry) => {
      // Only count entries that have been viewed
      if (!entry.viewed) {
        return false;
      }

      // Use viewedAt if available (new behavior), otherwise fall back to generatedAt (legacy)
      // This ensures backwards compatibility with entries created before viewedAt was added
      const readDate = entry.viewedAt
        ? new Date(entry.viewedAt)
        : new Date(entry.generatedAt);

      return readDate >= startOfWeek;
    }).length;

    console.log('[ContentHistoryService] Weekly read count:', weeklyCount);
    return weeklyCount;
  } catch (error) {
    console.error('[ContentHistoryService] Error getting weekly count:', error);
    return 0;
  }
}

// =============================================================================
// WRITE OPERATIONS
// =============================================================================

/**
 * Add Content History Entry
 *
 * Creates a new history entry when content is received and displayed.
 * This is called from the content listener (Phase 3) after content arrives.
 *
 * @param userId - The Firebase Auth UID of the user
 * @param entry - The history entry data (without id)
 * @returns Promise<string> - The document ID of the created entry
 *
 * WHEN TO CALL THIS:
 * 1. Content arrives via Firestore listener
 * 2. Content is displayed to the user
 * 3. Add entry to history with viewed: true
 *
 * WHY USE addDoc INSTEAD OF setDoc?
 * - addDoc auto-generates a unique document ID
 * - We don't need a specific ID (unlike user documents)
 * - Simpler code, no UUID generation needed
 *
 * USAGE:
 * ```typescript
 * const historyId = await addContentHistoryEntry(userId, {
 *   requestId: content.requestId,
 *   topicSummary: content.topicSummary || content.content?.title?.substring(0, 100) || '',
 *   category: content.content?.category || 'general',
 *   generatedAt: new Date(),
 *   viewed: true,
 *   saved: false,
 * });
 * ```
 */
export async function addContentHistoryEntry(
  userId: string,
  entry: Omit<ContentHistoryEntry, 'id'>
): Promise<string> {
  try {
    console.log('[ContentHistoryService] Adding entry for user:', userId);
    console.log('[ContentHistoryService] Topic:', entry.topicSummary);

    const historyCollection = getContentHistoryCollection(userId);

    /**
     * Prepare Data for Firestore
     *
     * We convert the JavaScript Date to a Firestore Timestamp
     * using serverTimestamp() for consistency.
     *
     * WHY serverTimestamp()?
     * - Ensures timestamp is set by Firebase servers
     * - Avoids issues with client device clock being wrong
     * - Consistent timestamps across all users
     */
    const docData = {
      requestId: entry.requestId,
      topicSummary: entry.topicSummary.substring(0, 100), // Enforce max length
      category: entry.category,
      generatedAt: serverTimestamp(),
      viewed: entry.viewed,
      saved: entry.saved,
    };

    // Add the document and get its reference
    const docRef = await addDoc(historyCollection, docData);

    console.log('[ContentHistoryService] Entry added with ID:', docRef.id);

    return docRef.id;
  } catch (error) {
    console.error('[ContentHistoryService] Error adding entry:', error);
    throw new Error(
      `Failed to add content history: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// =============================================================================
// UPDATE OPERATIONS
// =============================================================================

/**
 * Update Content History Entry
 *
 * Updates specific fields in an existing history entry.
 * Used to mark content as viewed or saved.
 *
 * @param userId - The Firebase Auth UID of the user
 * @param historyId - The document ID of the entry to update
 * @param updates - Object containing fields to update
 * @returns Promise<void>
 *
 * COMMON USE CASES:
 * - Mark as viewed: { viewed: true }
 * - Mark as saved/bookmarked: { saved: true }
 * - Remove bookmark: { saved: false }
 *
 * WHY Partial<Pick<...>>?
 * - Partial: Makes all fields optional (update only what you pass)
 * - Pick: Only allow updating 'viewed' and 'saved' (not requestId, etc.)
 * - This prevents accidental modification of immutable fields
 *
 * USAGE:
 * ```typescript
 * // User saves content
 * await updateContentHistoryEntry(userId, historyId, { saved: true });
 *
 * // User views content
 * await updateContentHistoryEntry(userId, historyId, { viewed: true });
 * ```
 */
export async function updateContentHistoryEntry(
  userId: string,
  historyId: string,
  updates: Partial<Pick<ContentHistoryEntry, 'viewed' | 'saved'>>
): Promise<void> {
  try {
    console.log('[ContentHistoryService] Updating entry:', historyId);

    const docRef = getContentHistoryDoc(userId, historyId);

    // Update only the specified fields
    await updateDoc(docRef, updates);

    console.log('[ContentHistoryService] Entry updated successfully');
  } catch (error) {
    console.error('[ContentHistoryService] Error updating entry:', error);
    throw new Error(
      `Failed to update content history: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Mark Content as Viewed
 *
 * Marks a history entry as viewed AND sets the viewedAt timestamp.
 * This timestamp is used for calculating the weekly read count (streak).
 *
 * WHY SET viewedAt HERE?
 * - viewedAt tracks WHEN the user actually read the content
 * - This is different from generatedAt (when AI created it)
 * - Weekly count uses viewedAt to count reading activity per week
 * - Using serverTimestamp ensures consistent, accurate timestamps
 *
 * @param userId - The Firebase Auth UID of the user
 * @param historyId - The document ID of the entry
 * @returns Promise<void>
 */
export async function markContentViewed(
  userId: string,
  historyId: string
): Promise<void> {
  try {
    console.log('[ContentHistoryService] Marking content as viewed:', historyId);

    const docRef = getContentHistoryDoc(userId, historyId);

    // Set both viewed flag AND viewedAt timestamp
    // viewedAt is used for weekly count calculation
    await updateDoc(docRef, {
      viewed: true,
      viewedAt: serverTimestamp(),
    });

    console.log('[ContentHistoryService] Content marked as viewed with timestamp');
  } catch (error) {
    console.error('[ContentHistoryService] Error marking content viewed:', error);
    throw new Error(
      `Failed to mark content as viewed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Toggle Content Saved Status
 *
 * Toggles the saved/bookmarked status of a history entry.
 * Returns the new saved status.
 *
 * @param userId - The Firebase Auth UID of the user
 * @param historyId - The document ID of the entry
 * @param saved - The new saved status
 * @returns Promise<void>
 *
 * USAGE:
 * ```typescript
 * // User taps bookmark button
 * await toggleContentSaved(userId, historyId, !currentSavedStatus);
 * ```
 */
export async function toggleContentSaved(
  userId: string,
  historyId: string,
  saved: boolean
): Promise<void> {
  return updateContentHistoryEntry(userId, historyId, { saved });
}

// =============================================================================
// DELETE OPERATIONS
// =============================================================================

/**
 * Delete Content History Entry
 *
 * Removes a specific history entry. Use with caution - this is permanent!
 *
 * @param userId - The Firebase Auth UID of the user
 * @param historyId - The document ID of the entry to delete
 * @returns Promise<void>
 *
 * WHEN TO USE:
 * - User explicitly wants to "forget" a topic
 * - Cleanup old/invalid entries
 * - Testing purposes
 *
 * WARNING:
 * Deleting history entries may cause the AI to regenerate similar content
 * in the future, since it won't know to avoid that topic.
 */
export async function deleteContentHistoryEntry(
  userId: string,
  historyId: string
): Promise<void> {
  try {
    console.log('[ContentHistoryService] Deleting entry:', historyId);

    const docRef = getContentHistoryDoc(userId, historyId);
    await deleteDoc(docRef);

    console.log('[ContentHistoryService] Entry deleted successfully');
  } catch (error) {
    console.error('[ContentHistoryService] Error deleting entry:', error);
    throw new Error(
      `Failed to delete content history: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Clear All Content History
 *
 * Deletes all history entries for a user. Use with extreme caution!
 *
 * @param userId - The Firebase Auth UID of the user
 * @returns Promise<number> - Number of entries deleted
 *
 * WHEN TO USE:
 * - User wants to "reset" their content history
 * - Account cleanup before deletion
 * - Testing purposes
 *
 * WARNING:
 * This removes all anti-repetition data. The AI will start fresh
 * and may regenerate topics the user has already seen.
 *
 * NOTE ON BATCH OPERATIONS:
 * For large collections, consider using batched writes or
 * Cloud Functions for better performance and reliability.
 */
export async function clearContentHistory(userId: string): Promise<number> {
  try {
    console.log('[ContentHistoryService] Clearing all history for user:', userId);

    const historyCollection = getContentHistoryCollection(userId);
    const snapshot = await getDocs(historyCollection);

    // Delete each document
    // Note: For large collections, use batch writes or Cloud Functions
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log(
      '[ContentHistoryService] Cleared',
      snapshot.size,
      'entries'
    );

    return snapshot.size;
  } catch (error) {
    console.error('[ContentHistoryService] Error clearing history:', error);
    throw new Error(
      `Failed to clear content history: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. SUBCOLLECTIONS VS ARRAYS
 *    We use a subcollection (users/{userId}/contentHistory) instead of
 *    an array field in the user document because:
 *    - Better scalability (no 1MB document limit)
 *    - Easier querying and pagination
 *    - Individual document updates (not rewriting entire array)
 *    - Firestore charges for document size, not subcollection size
 *
 * 2. QUERY COMPOSITION
 *    Firestore queries are built by composing functions:
 *    query(collection, orderBy(...), limit(...), where(...))
 *    This is called the "builder pattern" and allows flexible queries.
 *
 * 3. TIMESTAMPS
 *    We use serverTimestamp() instead of new Date() because:
 *    - Server timestamps are always accurate
 *    - Client clocks can be wrong or manipulated
 *    - Consistent sorting across all users
 *
 * 4. ERROR HANDLING STRATEGY
 *    - Read operations return empty arrays on error (graceful degradation)
 *    - Write operations throw errors (caller needs to know if save failed)
 *    - All operations log errors for debugging
 *
 * 5. TYPE SAFETY
 *    We use TypeScript types from @/types/content.ts to ensure:
 *    - Consistent data shapes across the app
 *    - Compile-time error checking
 *    - IDE autocomplete and documentation
 *
 * 6. FIRESTORE SECURITY
 *    This service assumes Firebase Security Rules protect the data:
 *    - Users can only read/write their own contentHistory
 *    - n8n/backend can write to generatedContent (Phase 3)
 *    - Rules should be configured in Firebase Console
 *
 * NEXT STEPS (Phase 3):
 * - Create contentListenerService for real-time Firestore updates
 * - Hook up addContentHistoryEntry when content arrives
 * - Create useContentListener hook for component integration
 */
