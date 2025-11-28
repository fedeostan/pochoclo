/**
 * userPreferencesService.ts - Firebase Firestore Service for User Preferences
 *
 * This file handles all Firestore operations related to user learning preferences.
 * It provides a clean API for saving and loading preferences data.
 *
 * WHY A SEPARATE SERVICE?
 * - Separates data layer from UI layer (Redux manages UI state, this handles persistence)
 * - Makes testing easier (can mock this service)
 * - Keeps Firestore logic in one place
 * - Follows the same pattern as firestore.ts for consistency
 *
 * DATA LOCATION IN FIRESTORE:
 * users (collection)
 *   └── {userId} (document)
 *         └── preferences (field - embedded object, NOT subcollection)
 *               ├── categories: string[]
 *               ├── dailyLearningMinutes: number
 *               ├── onboardingCompleted: boolean
 *               └── updatedAt: Timestamp
 *
 * WHY EMBEDDED OBJECT VS SUBCOLLECTION?
 * - Embedded object: Preferences is a single object within the user document
 * - Subcollection: Would be a separate collection under the user document
 *
 * We chose embedded object because:
 * - Preferences are always loaded with user data (one read instead of two)
 * - Preferences data is small and won't grow unbounded
 * - Simpler queries (no need to join collections)
 * - Atomic updates (can update user + preferences in one write)
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  UserPreferences,
  SavePreferencesInput,
} from '@/types/preferences';

/**
 * COLLECTION NAME
 *
 * Same as in firestore.ts - preferences are stored within user documents.
 */
const USERS_COLLECTION = 'users';

/**
 * =============================================================================
 * FIRESTORE DATA TYPES
 * =============================================================================
 *
 * Firestore stores timestamps as Firestore Timestamp objects.
 * We need to convert between JS Date and Firestore Timestamp.
 */

/**
 * Internal type for preferences as stored in Firestore
 *
 * This differs from UserPreferences because:
 * - updatedAt is a Firestore Timestamp, not a JS Date
 */
interface FirestorePreferences {
  categories: string[];
  dailyLearningMinutes: number;
  onboardingCompleted: boolean;
  updatedAt: Timestamp | null;
}

/**
 * =============================================================================
 * SERVICE FUNCTIONS
 * =============================================================================
 */

/**
 * Get user preferences from Firestore
 *
 * @param userId - The user's UID
 * @returns Promise with UserPreferences, or null if not found
 *
 * HOW THIS WORKS:
 * 1. Get the user document
 * 2. Extract the preferences field
 * 3. Convert Firestore Timestamp to JS Date
 * 4. Return null if preferences don't exist yet
 *
 * WHEN TO USE:
 * - On app init (load preferences into Redux)
 * - When navigating to profile/settings
 * - After successful auth to check onboardingCompleted
 */
export const getUserPreferences = async (
  userId: string
): Promise<UserPreferences | null> => {
  try {
    // Reference to the user document
    const userRef = doc(db, USERS_COLLECTION, userId);

    // Fetch the document
    const docSnapshot = await getDoc(userRef);

    // Check if document exists
    if (!docSnapshot.exists()) {
      return null;
    }

    // Get the preferences field from the document
    const data = docSnapshot.data();
    const preferences = data?.preferences as FirestorePreferences | undefined;

    // If no preferences field, return null (user hasn't completed onboarding)
    if (!preferences) {
      return null;
    }

    // Convert Firestore Timestamp to JS Date
    // Firestore Timestamps have a toDate() method
    const userPreferences: UserPreferences = {
      categories: preferences.categories || [],
      dailyLearningMinutes: preferences.dailyLearningMinutes || 0,
      onboardingCompleted: preferences.onboardingCompleted || false,
      updatedAt: preferences.updatedAt?.toDate() || null,
    };

    return userPreferences;

  } catch (error) {
    console.error('Error getting user preferences:', error);
    throw new Error(
      `Failed to load preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Save user preferences to Firestore
 *
 * @param userId - The user's UID
 * @param preferences - The preferences to save
 * @returns Promise that resolves when saved
 *
 * HOW THIS WORKS:
 * 1. Create document reference
 * 2. Use setDoc with merge:true to update only preferences field
 * 3. Server timestamp is set automatically
 *
 * WHY setDoc WITH MERGE?
 * - Updates only the preferences field without overwriting other user data
 * - Works whether or not the document already exists
 * - Atomic operation (all fields update together)
 *
 * WHEN TO USE:
 * - After completing onboarding (with onboardingCompleted: true)
 * - When editing preferences from profile/settings
 */
export const saveUserPreferences = async (
  userId: string,
  preferences: SavePreferencesInput
): Promise<void> => {
  try {
    // Reference to the user document
    const userRef = doc(db, USERS_COLLECTION, userId);

    // Prepare the preferences data
    // We nest it under 'preferences' field in the user document
    const dataToSave = {
      preferences: {
        categories: preferences.categories,
        dailyLearningMinutes: preferences.dailyLearningMinutes,
        onboardingCompleted: preferences.onboardingCompleted ?? false,
        updatedAt: serverTimestamp(),
      },
    };

    // Save with merge to avoid overwriting other user fields
    await setDoc(userRef, dataToSave, { merge: true });

  } catch (error) {
    console.error('Error saving user preferences:', error);
    throw new Error(
      `Failed to save preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Update specific preference fields
 *
 * @param userId - The user's UID
 * @param updates - Partial preferences to update
 * @returns Promise that resolves when updated
 *
 * DIFFERENCE FROM saveUserPreferences:
 * - This uses updateDoc which requires the document to exist
 * - Only updates the specified fields (doesn't touch others)
 *
 * WHEN TO USE:
 * - Updating just categories without changing time
 * - Updating just time without changing categories
 * - Any partial update after initial setup
 *
 * NOTE ON NESTED FIELD UPDATES:
 * To update nested fields with updateDoc, use dot notation:
 * 'preferences.categories' instead of { preferences: { categories } }
 *
 * This is important because without dot notation, updateDoc would
 * overwrite the entire preferences object!
 */
export const updateUserPreferences = async (
  userId: string,
  updates: Partial<SavePreferencesInput>
): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);

    // Build the update object with dot notation for nested fields
    // This ensures we only update specific fields, not overwrite the whole object
    const updateData: Record<string, unknown> = {
      'preferences.updatedAt': serverTimestamp(),
    };

    // Only include fields that were provided
    if (updates.categories !== undefined) {
      updateData['preferences.categories'] = updates.categories;
    }

    if (updates.dailyLearningMinutes !== undefined) {
      updateData['preferences.dailyLearningMinutes'] = updates.dailyLearningMinutes;
    }

    if (updates.onboardingCompleted !== undefined) {
      updateData['preferences.onboardingCompleted'] = updates.onboardingCompleted;
    }

    await updateDoc(userRef, updateData);

  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw new Error(
      `Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Check if user has completed onboarding
 *
 * @param userId - The user's UID
 * @returns Promise with boolean (true if onboarding completed)
 *
 * WHY A DEDICATED FUNCTION?
 * - This is a common check (happens on every app launch)
 * - Returns a simple boolean, no need for full preferences
 * - Optimized for the specific use case
 *
 * WHEN TO USE:
 * - On auth state change to decide navigation
 * - In root layout to route to onboarding or home
 */
export const hasCompletedOnboarding = async (
  userId: string
): Promise<boolean> => {
  try {
    const preferences = await getUserPreferences(userId);

    // If preferences exist and onboardingCompleted is true
    return preferences?.onboardingCompleted === true;

  } catch (error) {
    // If there's an error, assume onboarding not completed
    // This is a safe default - user will see onboarding again
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

/**
 * Set content request flag in Firestore
 *
 * @param userId - The user's UID
 * @param requestId - The UUID of the content request
 * @returns Promise that resolves when updated
 *
 * WHY THIS FLAG?
 * This flag tracks whether we've sent a content request to n8n.
 * - contentRequested: true means we've sent a request and are waiting for content
 * - lastContentRequestId: The UUID to listen for in Firestore
 *
 * HOME SCREEN BEHAVIOR:
 * - If contentRequested = true and no content → Show loading
 * - If contentRequested = true and content exists → Show content
 * - If contentRequested = false → Should trigger at end of onboarding
 *
 * WHEN TO USE:
 * - At the end of onboarding, after triggering n8n webhook
 * - When manually requesting new content (pull-to-refresh)
 */
export const setContentRequested = async (
  userId: string,
  requestId: string
): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);

    await updateDoc(userRef, {
      contentRequested: true,
      lastContentRequestId: requestId,
      contentRequestedAt: serverTimestamp(),
    });

    console.log('[PreferencesService] Content request flag set:', requestId);

  } catch (error) {
    console.error('Error setting content request flag:', error);
    throw new Error(
      `Failed to set content request flag: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Get content request status from Firestore
 *
 * @param userId - The user's UID
 * @returns Object with contentRequested flag and lastContentRequestId
 */
export const getContentRequestStatus = async (
  userId: string
): Promise<{ contentRequested: boolean; lastContentRequestId: string | null }> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const docSnapshot = await getDoc(userRef);

    if (!docSnapshot.exists()) {
      return { contentRequested: false, lastContentRequestId: null };
    }

    const data = docSnapshot.data();

    return {
      contentRequested: data?.contentRequested === true,
      lastContentRequestId: data?.lastContentRequestId || null,
    };

  } catch (error) {
    console.error('Error getting content request status:', error);
    return { contentRequested: false, lastContentRequestId: null };
  }
};

/**
 * =============================================================================
 * ERROR HANDLING
 * =============================================================================
 *
 * Firestore can throw various errors. Here's how to handle them:
 */

/**
 * Map Firestore error codes to user-friendly messages
 *
 * @param errorCode - The Firestore error code
 * @returns User-friendly error message
 */
export const getPreferencesErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'permission-denied': "You don't have permission to access preferences.",
    'not-found': 'User profile not found.',
    'unavailable': 'Service temporarily unavailable. Please try again.',
    'unauthenticated': 'Please sign in to access preferences.',
  };

  return errorMessages[errorCode] || 'Failed to load preferences. Please try again.';
};

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. EMBEDDED OBJECTS VS SUBCOLLECTIONS
 *
 *    Embedded Object (what we use):
 *    users/{userId}
 *      └── preferences: { categories: [...], ... }
 *
 *    Subcollection (alternative):
 *    users/{userId}
 *      └── preferences (subcollection)
 *            └── settings (document)
 *                  └── categories: [...]
 *
 *    Embedded objects are better when:
 *    - Data is always needed with parent (preferences + user)
 *    - Data is small and bounded
 *    - You want single-document reads
 *
 *    Subcollections are better when:
 *    - Data can be large or unbounded (like posts, comments)
 *    - Data needs its own queries
 *    - Data is accessed independently
 *
 * 2. DOT NOTATION FOR NESTED UPDATES
 *
 *    updateDoc(ref, { 'preferences.categories': [...] })
 *    vs
 *    updateDoc(ref, { preferences: { categories: [...] } })
 *
 *    The first (dot notation) updates ONLY the categories field.
 *    The second would REPLACE the entire preferences object!
 *
 * 3. SERVER TIMESTAMP
 *
 *    serverTimestamp() is a special value that tells Firestore:
 *    "Set this field to the server's current time when you write"
 *
 *    Benefits:
 *    - Consistent timestamps (not affected by user's device clock)
 *    - Atomic with the write (no separate call)
 *    - Works offline (timestamp set when sync happens)
 *
 * 4. TYPE CONVERSION (TIMESTAMP → DATE)
 *
 *    Firestore returns Timestamp objects, not JS Dates.
 *    Timestamp has methods:
 *    - toDate(): Converts to JS Date
 *    - toMillis(): Converts to milliseconds since epoch
 *    - seconds & nanoseconds: Raw components
 *
 *    Always convert to Date for use in React components!
 *
 * 5. ERROR HANDLING PATTERN
 *
 *    We catch errors, log them, and re-throw with user-friendly messages.
 *    This pattern:
 *    - Preserves detailed logs for debugging
 *    - Gives users understandable feedback
 *    - Allows callers to handle errors consistently
 */
