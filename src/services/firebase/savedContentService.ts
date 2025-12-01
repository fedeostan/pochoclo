/**
 * Saved Content Service
 *
 * Manages bookmarked/saved content in Firestore.
 * Users can save content they want to revisit later.
 *
 * FIRESTORE STRUCTURE:
 * users/{userId}/savedContent/{contentId}
 * ├── content: { ... }           // Copy of the content object
 * ├── savedAt: timestamp         // When the content was saved
 * └── notes?: string             // Optional user notes
 *
 * WHY SAVE A COPY?
 * We copy the full content rather than just referencing it because:
 * 1. generatedContent documents may be cleaned up over time
 * 2. Users expect saved content to persist indefinitely
 * 3. Faster reads (no need to look up original)
 *
 * LEARNING NOTE:
 * This is a common pattern called "denormalization" in NoSQL databases.
 * We trade storage space for read performance and reliability.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { GeneratedContent, ContentBody } from '@/types/content';

/**
 * SavedContent Interface
 *
 * The structure of a saved content document in Firestore.
 */
export interface SavedContent {
  id: string;
  content: ContentBody;
  requestId: string;
  savedAt: Date;
  notes?: string;
}

/**
 * Save Content
 *
 * Saves a piece of generated content to the user's saved content collection.
 *
 * @param userId - The Firebase Auth UID of the current user
 * @param content - The generated content to save
 * @param notes - Optional notes about why the user saved this
 * @returns Promise<string> - The ID of the saved content document
 *
 * @example
 * const savedId = await saveContent(user.uid, generatedContent);
 * console.log('Content saved with ID:', savedId);
 *
 * FIRESTORE PATH: users/{userId}/savedContent/{requestId}
 */
export async function saveContent(
  userId: string,
  content: GeneratedContent,
  notes?: string
): Promise<string> {
  // Validate input
  if (!content.content) {
    throw new Error('Cannot save content without body');
  }

  // Use requestId as document ID for easy lookup
  const docRef = doc(db, 'users', userId, 'savedContent', content.requestId);

  // Prepare the document data
  const savedData = {
    content: content.content,
    requestId: content.requestId,
    savedAt: serverTimestamp(),
    ...(notes && { notes }),
  };

  // Write to Firestore
  await setDoc(docRef, savedData);

  console.log('[savedContentService] Content saved:', content.requestId);
  return content.requestId;
}

/**
 * Unsave Content
 *
 * Removes a piece of content from the user's saved collection.
 *
 * @param userId - The Firebase Auth UID of the current user
 * @param requestId - The requestId of the content to unsave
 * @returns Promise<void>
 *
 * @example
 * await unsaveContent(user.uid, 'request-123');
 */
export async function unsaveContent(
  userId: string,
  requestId: string
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'savedContent', requestId);
  await deleteDoc(docRef);

  console.log('[savedContentService] Content unsaved:', requestId);
}

/**
 * Check if Content is Saved
 *
 * Checks whether a specific piece of content is in the user's saved collection.
 *
 * @param userId - The Firebase Auth UID of the current user
 * @param requestId - The requestId to check
 * @returns Promise<boolean> - True if content is saved
 *
 * @example
 * const isSaved = await isContentSaved(user.uid, content.requestId);
 * if (isSaved) {
 *   // Show "Saved" indicator
 * }
 */
export async function isContentSaved(
  userId: string,
  requestId: string
): Promise<boolean> {
  const docRef = doc(db, 'users', userId, 'savedContent', requestId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

/**
 * Get Saved Content
 *
 * Retrieves a specific saved content document.
 *
 * @param userId - The Firebase Auth UID of the current user
 * @param requestId - The requestId of the saved content
 * @returns Promise<SavedContent | null> - The saved content or null if not found
 */
export async function getSavedContent(
  userId: string,
  requestId: string
): Promise<SavedContent | null> {
  const docRef = doc(db, 'users', userId, 'savedContent', requestId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    content: data.content,
    requestId: data.requestId,
    savedAt: data.savedAt?.toDate?.() || new Date(),
    notes: data.notes,
  };
}

/**
 * Get All Saved Content
 *
 * Retrieves all saved content for a user, ordered by most recently saved.
 *
 * @param userId - The Firebase Auth UID of the current user
 * @param maxEntries - Maximum number of entries to return (default: 50)
 * @returns Promise<SavedContent[]> - Array of saved content
 *
 * @example
 * const savedContent = await getAllSavedContent(user.uid);
 * savedContent.forEach(item => {
 *   console.log(item.content.title, 'saved at', item.savedAt);
 * });
 */
export async function getAllSavedContent(
  userId: string,
  maxEntries: number = 50
): Promise<SavedContent[]> {
  const savedRef = collection(db, 'users', userId, 'savedContent');
  const q = query(
    savedRef,
    orderBy('savedAt', 'desc'),
    limit(maxEntries)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      content: data.content,
      requestId: data.requestId,
      savedAt: data.savedAt?.toDate?.() || new Date(),
      notes: data.notes,
    };
  });
}

/**
 * Update Saved Content Notes
 *
 * Updates the notes for a saved content item.
 *
 * @param userId - The Firebase Auth UID of the current user
 * @param requestId - The requestId of the saved content
 * @param notes - The new notes (or undefined to remove)
 * @returns Promise<void>
 */
export async function updateSavedContentNotes(
  userId: string,
  requestId: string,
  notes: string | undefined
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'savedContent', requestId);

  if (notes) {
    await setDoc(docRef, { notes }, { merge: true });
  } else {
    // Remove notes field by setting to deleteField() would require import
    // For simplicity, we set to empty string
    await setDoc(docRef, { notes: '' }, { merge: true });
  }

  console.log('[savedContentService] Notes updated for:', requestId);
}

/**
 * Toggle Saved State
 *
 * Convenience function to toggle the saved state of content.
 * If saved, it unsaves. If not saved, it saves.
 *
 * @param userId - The Firebase Auth UID of the current user
 * @param content - The content to toggle
 * @returns Promise<boolean> - New saved state (true if now saved)
 *
 * @example
 * const isNowSaved = await toggleSavedContent(user.uid, content);
 * console.log(isNowSaved ? 'Saved!' : 'Removed from saved');
 */
export async function toggleSavedContent(
  userId: string,
  content: GeneratedContent
): Promise<boolean> {
  const currentlySaved = await isContentSaved(userId, content.requestId);

  if (currentlySaved) {
    await unsaveContent(userId, content.requestId);
    return false;
  } else {
    await saveContent(userId, content);
    return true;
  }
}

/**
 * Get Saved Content Count
 *
 * Returns the total number of saved articles for a user.
 * Used for the MinimalStatsBar component to show saved count.
 *
 * @param userId - The Firebase Auth UID of the current user
 * @returns Promise<number> - Total count of saved articles
 *
 * USAGE:
 * ```typescript
 * const savedCount = await getSavedContentCount(userId);
 * // Returns: 5
 * ```
 */
export async function getSavedContentCount(userId: string): Promise<number> {
  try {
    const savedRef = collection(db, 'users', userId, 'savedContent');
    const snapshot = await getDocs(savedRef);
    return snapshot.size;
  } catch (error) {
    console.error('[savedContentService] Error getting saved count:', error);
    return 0;
  }
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. DOCUMENT IDs
 *    We use requestId as the document ID because:
 *    - It's unique per content piece
 *    - Allows direct lookup without queries
 *    - Makes checking "is saved" very efficient
 *
 * 2. serverTimestamp()
 *    Instead of new Date(), we use serverTimestamp() for savedAt.
 *    This ensures consistent timestamps from Firebase servers,
 *    avoiding issues with device clock drift.
 *
 * 3. SPREAD OPERATOR WITH CONDITIONALS
 *    `...(notes && { notes })` only adds the notes field if notes exists.
 *    This is cleaner than writing an if statement.
 *
 * 4. MERGE OPTION
 *    `{ merge: true }` in setDoc updates only specified fields,
 *    preserving other fields. Without it, setDoc replaces the entire document.
 *
 * 5. ERROR HANDLING
 *    We throw errors for invalid input (no content body).
 *    Calling code should wrap in try/catch for proper error handling.
 *
 * 6. DENORMALIZATION TRADE-OFFS
 *    PRO: Fast reads, content persists even if original is deleted
 *    CON: Uses more storage, content updates don't propagate
 *
 *    For our use case, this is acceptable because:
 *    - Generated content is immutable (AI output doesn't change)
 *    - Users expect saved content to be permanent
 *    - We prioritize read performance for the saved content list
 *
 * 7. PAGINATION (Future Enhancement)
 *    For users with many saved items, consider adding cursor-based
 *    pagination to getAllSavedContent using startAfter().
 */
