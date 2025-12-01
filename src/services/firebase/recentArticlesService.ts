/**
 * Recent Articles Service
 *
 * Manages the user's recent reading history in Firestore.
 * Shows the last 3 articles the user has engaged with on the home screen.
 *
 * FIRESTORE STRUCTURE:
 * users/{userId}/recentArticles/{docId}
 * ├── contentBody: { ... }      // Full article content (denormalized)
 * ├── readAt: timestamp         // When the user finished reading
 * └── createdAt: timestamp      // When this entry was created
 *
 * WHY A SEPARATE COLLECTION?
 * We don't reuse contentHistory or savedContent because:
 * 1. contentHistory is for anti-repetition (different purpose)
 * 2. savedContent is for user bookmarks (user intent is different)
 * 3. Recent articles have a max of 3 (different constraint)
 * Each collection has a single, clear responsibility.
 *
 * MAX 3 ARTICLES:
 * When a new article is added and there are already 3, we delete the oldest.
 * This keeps the widget compact and focused on recent reading.
 *
 * LEARNING NOTE:
 * This service demonstrates:
 * - Constraint enforcement in NoSQL (max 3 items pattern)
 * - Denormalization (storing full content for fast reads)
 * - Batch operations for efficient deletion
 */

import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ContentBody, RecentArticle } from '@/types/content';

/**
 * Maximum number of recent articles to keep.
 * When this limit is exceeded, the oldest article is deleted.
 */
const MAX_RECENT_ARTICLES = 3;

/**
 * Add Recent Article
 *
 * Adds an article to the user's recent reading history.
 * If there are already 3 articles, the oldest one is automatically deleted.
 *
 * DUPLICATE HANDLING:
 * Before adding, we check if an article with the same title already exists.
 * If it does, we skip adding (per user's preference: no re-ordering on re-read).
 *
 * @param userId - The Firebase Auth UID of the current user
 * @param contentBody - The article content to add
 * @returns Promise<string | null> - The new document ID, or null if duplicate
 *
 * @example
 * // After user taps "Done" on an article
 * await addRecentArticle(user.uid, article.content);
 *
 * HOW IT WORKS:
 * 1. Check for duplicate (same title) - skip if exists
 * 2. Add the new article document
 * 3. Query all articles ordered by oldest first
 * 4. If more than 3 exist, delete the extras in a batch
 */
export async function addRecentArticle(
  userId: string,
  contentBody: ContentBody
): Promise<string | null> {
  // Reference to the user's recentArticles subcollection
  const recentRef = collection(db, 'users', userId, 'recentArticles');

  // Step 1: Check for duplicates (same title means same article)
  // We query for articles with the same title to avoid duplicates
  const duplicateQuery = query(
    recentRef,
    where('contentBody.title', '==', contentBody.title),
    limit(1)
  );
  const duplicateSnapshot = await getDocs(duplicateQuery);

  if (!duplicateSnapshot.empty) {
    // Article already exists in recent - don't add again
    // (User chose not to re-order on re-read)
    console.log('[recentArticlesService] Duplicate article skipped:', contentBody.title);
    return null;
  }

  // Step 2: Add the new article
  const newDocRef = await addDoc(recentRef, {
    contentBody,
    readAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  console.log('[recentArticlesService] Article added:', newDocRef.id);

  // Step 3: Enforce the max 3 articles constraint
  // Query all articles ordered by readAt ascending (oldest first)
  const allArticlesQuery = query(
    recentRef,
    orderBy('readAt', 'asc'),
    limit(10) // Get more than needed to handle edge cases
  );
  const snapshot = await getDocs(allArticlesQuery);

  // Step 4: Delete oldest articles if we exceed the limit
  if (snapshot.size > MAX_RECENT_ARTICLES) {
    // Calculate how many to delete
    const deleteCount = snapshot.size - MAX_RECENT_ARTICLES;

    // The oldest ones are at the beginning (we ordered by asc)
    const docsToDelete = snapshot.docs.slice(0, deleteCount);

    // Use a batch write for efficiency (all deletes in one round trip)
    const batch = writeBatch(db);
    docsToDelete.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    await batch.commit();

    console.log('[recentArticlesService] Deleted', deleteCount, 'old article(s)');
  }

  return newDocRef.id;
}

/**
 * Get Recent Articles
 *
 * Retrieves all recent articles for a user, ordered by most recently read.
 * Returns a maximum of 3 articles (the limit enforced by addRecentArticle).
 *
 * @param userId - The Firebase Auth UID of the current user
 * @returns Promise<RecentArticle[]> - Array of recent articles (max 3)
 *
 * @example
 * const recentArticles = await getRecentArticles(user.uid);
 * recentArticles.forEach(article => {
 *   console.log(article.contentBody.title);
 * });
 *
 * USAGE IN COMPONENT:
 * This is typically called once on component mount.
 * For real-time updates, use the useRecentArticles hook instead.
 */
export async function getRecentArticles(userId: string): Promise<RecentArticle[]> {
  const recentRef = collection(db, 'users', userId, 'recentArticles');

  // Query for articles ordered by most recently read
  const q = query(
    recentRef,
    orderBy('readAt', 'desc'),
    limit(MAX_RECENT_ARTICLES)
  );

  const snapshot = await getDocs(q);

  // Transform Firestore documents to our RecentArticle type
  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      contentBody: data.contentBody as ContentBody,
      // Convert Firestore Timestamp to ISO string for Redux compatibility
      readAt: (data.readAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
      createdAt: (data.createdAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  });
}

/**
 * Delete Recent Article
 *
 * Removes a specific article from the recent history.
 * This might be used if we add a "remove from recent" feature later.
 *
 * @param userId - The Firebase Auth UID of the current user
 * @param articleId - The Firestore document ID of the article to remove
 * @returns Promise<void>
 *
 * @example
 * await deleteRecentArticle(user.uid, 'abc123');
 */
export async function deleteRecentArticle(
  userId: string,
  articleId: string
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'recentArticles', articleId);
  await deleteDoc(docRef);

  console.log('[recentArticlesService] Article deleted:', articleId);
}

/**
 * Clear All Recent Articles
 *
 * Removes all articles from the user's recent history.
 * Useful for testing or if the user wants to "clear history".
 *
 * @param userId - The Firebase Auth UID of the current user
 * @returns Promise<number> - Number of articles deleted
 *
 * @example
 * const deletedCount = await clearRecentArticles(user.uid);
 * console.log(`Cleared ${deletedCount} articles`);
 */
export async function clearRecentArticles(userId: string): Promise<number> {
  const recentRef = collection(db, 'users', userId, 'recentArticles');
  const snapshot = await getDocs(recentRef);

  if (snapshot.empty) {
    return 0;
  }

  // Batch delete all documents
  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref);
  });
  await batch.commit();

  console.log('[recentArticlesService] Cleared all recent articles:', snapshot.size);
  return snapshot.size;
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. CONSTRAINT ENFORCEMENT IN NOSQL
 *    Unlike SQL databases with CHECK constraints or triggers, Firestore
 *    doesn't have built-in constraints. We enforce "max 3 items" in
 *    application code by:
 *    - Adding the new item first
 *    - Querying to count total items
 *    - Deleting extras if over limit
 *
 *    This is a common pattern in NoSQL databases.
 *
 * 2. BATCH WRITES
 *    writeBatch() groups multiple write operations into one network request.
 *    This is:
 *    - Faster than individual deletes
 *    - Atomic (all succeed or all fail)
 *    - More efficient for Firestore billing
 *
 * 3. ORDER BY + LIMIT
 *    We use orderBy('readAt', 'asc') + limit(10) to get oldest first.
 *    Then slice() the first N to delete.
 *    We query 10 instead of 4 to handle edge cases (e.g., race conditions).
 *
 * 4. TIMESTAMP CONVERSION
 *    Firestore stores Timestamps as special objects.
 *    We convert to ISO strings for Redux compatibility:
 *    timestamp.toDate().toISOString() → "2024-01-15T10:30:00.000Z"
 *
 * 5. DUPLICATE CHECKING
 *    We query by title to check for duplicates before adding.
 *    This prevents the same article appearing twice in the list.
 *    Alternative approaches:
 *    - Use content hash as document ID
 *    - Store a unique identifier in the document
 *    We chose title because it's simple and articles have unique titles.
 *
 * 6. WHY NOT TRANSACTIONS?
 *    We could use a transaction for the add + delete operation, but:
 *    - Transactions are more complex
 *    - Max 3 items is not a critical constraint (4 items briefly is OK)
 *    - Eventual consistency is acceptable here
 *    For a learning project, simplicity wins.
 *
 * 7. REAL-TIME VS. ONE-TIME FETCH
 *    This service provides getRecentArticles() for one-time fetches.
 *    For real-time updates in the UI, use the useRecentArticles hook
 *    which sets up an onSnapshot listener.
 */
