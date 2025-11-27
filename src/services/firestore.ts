/**
 * firestore.ts - Firebase Firestore Service
 *
 * This file handles all operations related to Firebase Firestore,
 * which is our NoSQL database for storing structured data.
 *
 * WHAT IS FIRESTORE?
 * Firestore is a flexible, scalable NoSQL cloud database. Unlike SQL databases:
 * - Data is stored in documents (like JSON objects)
 * - Documents are organized in collections (like folders)
 * - Schema is flexible (each document can have different fields)
 *
 * DATA STRUCTURE:
 * Firestore uses a hierarchy: Collections → Documents → Fields
 *
 * For our app:
 * users (collection)
 *   └── {userId} (document ID = Firebase Auth UID)
 *         ├── uid: string
 *         ├── email: string
 *         ├── displayName: string | null
 *         ├── photoURL: string | null
 *         ├── createdAt: Timestamp
 *         └── updatedAt: Timestamp
 *
 * WHY USE FIRESTORE FOR USER DATA?
 * Firebase Auth stores basic profile info, but Firestore gives us:
 * - More fields (preferences, settings, bio, etc.)
 * - Real-time updates with listeners
 * - Complex queries (find users by criteria)
 * - Better scalability for additional features
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * COLLECTION NAMES
 *
 * We define collection names as constants to:
 * - Avoid typos when referencing collections
 * - Make renaming easy (change in one place)
 * - Document the database structure
 */
const COLLECTIONS = {
  /** Collection for user profile data */
  USERS: 'users',
} as const;

/**
 * User Document Interface
 *
 * This TypeScript interface defines the shape of a user document.
 * It ensures type safety when reading/writing user data.
 *
 * WHY DEFINE AN INTERFACE?
 * - TypeScript catches errors at compile time
 * - IDE provides autocomplete for fields
 * - Documentation for what fields exist
 * - Easier to maintain as the app grows
 *
 * FIELDS EXPLAINED:
 * - uid: Firebase Auth user ID (matches document ID)
 * - email: User's email address
 * - displayName: User's chosen display name
 * - photoURL: URL to profile image in Firebase Storage
 * - createdAt: When the document was created
 * - updatedAt: When the document was last modified
 */
export interface UserDocument {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Input type for creating a new user document
 *
 * This uses Omit to exclude fields that are set automatically:
 * - createdAt and updatedAt are set by the server
 *
 * WHAT IS Omit<T, K>?
 * It creates a new type from T without the specified keys K.
 * This lets us require some fields while auto-generating others.
 */
export type CreateUserInput = Omit<UserDocument, 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating a user document
 *
 * This makes all fields optional using Partial<T>.
 * We only need to pass the fields we want to update.
 *
 * WHAT IS Partial<T>?
 * It makes all properties of T optional.
 * This is perfect for update operations where you might
 * only want to change one or two fields.
 */
export type UpdateUserInput = Partial<Omit<UserDocument, 'uid' | 'createdAt' | 'updatedAt'>>;

/**
 * Create or update a user document in Firestore
 *
 * @param userData - The user data to save
 * @returns Promise that resolves when the document is saved
 *
 * HOW THIS WORKS:
 * 1. Create a document reference using the user's UID
 * 2. Use setDoc with merge: true to create or update
 * 3. Add timestamps automatically
 *
 * WHAT IS setDoc WITH MERGE?
 * - Without merge: Overwrites the entire document
 * - With merge: true: Updates only the specified fields
 * - If document doesn't exist, it creates it
 *
 * WHY USE serverTimestamp()?
 * - The timestamp is set by Firebase's server, not the client
 * - This prevents issues with incorrect device clocks
 * - Consistent timestamps across all users
 */
export const createOrUpdateUserDocument = async (
  userData: CreateUserInput
): Promise<void> => {
  try {
    // Create a reference to the user's document
    // doc(database, collection, documentId)
    const userRef = doc(db, COLLECTIONS.USERS, userData.uid);

    // Check if the document exists to determine timestamps
    const existingDoc = await getDoc(userRef);
    const isNewDocument = !existingDoc.exists();

    // Prepare the data with timestamps
    const dataToSave = {
      ...userData,
      updatedAt: serverTimestamp(),
      // Only set createdAt for new documents
      ...(isNewDocument && { createdAt: serverTimestamp() }),
    };

    // Save the document with merge to avoid overwriting existing fields
    await setDoc(userRef, dataToSave, { merge: true });
  } catch (error) {
    console.error('Error creating/updating user document:', error);
    throw new Error(
      `Failed to save user data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Get a user document from Firestore
 *
 * @param userId - The user's UID
 * @returns Promise with the user data, or null if not found
 *
 * WHY RETURN NULL INSTEAD OF THROWING?
 * - A missing document is a valid state (new user)
 * - Lets the caller decide how to handle missing data
 * - Avoids try/catch everywhere we fetch user data
 *
 * DOCUMENT SNAPSHOTS:
 * getDoc returns a DocumentSnapshot which contains:
 * - exists(): Boolean if document exists
 * - data(): The document data (or undefined)
 * - id: The document ID
 * - ref: Reference to the document
 */
export const getUserDocument = async (
  userId: string
): Promise<UserDocument | null> => {
  try {
    // Create a reference to the user's document
    const userRef = doc(db, COLLECTIONS.USERS, userId);

    // Fetch the document
    const docSnapshot: DocumentSnapshot = await getDoc(userRef);

    // Check if the document exists
    if (!docSnapshot.exists()) {
      return null;
    }

    // Return the document data with proper typing
    // We use 'as UserDocument' because we know the shape of our data
    return docSnapshot.data() as UserDocument;
  } catch (error) {
    console.error('Error getting user document:', error);
    throw new Error(
      `Failed to get user data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Update specific fields in a user document
 *
 * @param userId - The user's UID
 * @param updates - Object containing fields to update
 * @returns Promise that resolves when the update is complete
 *
 * DIFFERENCE FROM createOrUpdateUserDocument:
 * - updateDoc requires the document to exist (throws if not found)
 * - setDoc with merge creates the document if missing
 *
 * WHEN TO USE WHICH:
 * - Use createOrUpdateUserDocument for initial setup or uncertain existence
 * - Use updateUserDocument when you know the document exists
 *
 * WHY updateDoc INSTEAD OF setDoc?
 * - updateDoc fails if the document doesn't exist (catches bugs)
 * - updateDoc is slightly more efficient for updates
 * - Makes intent clearer in the code
 */
export const updateUserDocument = async (
  userId: string,
  updates: UpdateUserInput
): Promise<void> => {
  try {
    // Create a reference to the user's document
    const userRef = doc(db, COLLECTIONS.USERS, userId);

    // Update the document with new values and timestamp
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user document:', error);
    throw new Error(
      `Failed to update user data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Update only the profile image URL for a user
 *
 * @param userId - The user's UID
 * @param photoURL - The new profile image URL (or null to remove)
 * @returns Promise that resolves when the update is complete
 *
 * WHY A DEDICATED FUNCTION?
 * - Profile image updates are common
 * - Provides a cleaner API for this specific operation
 * - Makes the code more readable where it's used
 *
 * WHY setDoc WITH MERGE INSTEAD OF updateDoc?
 * - The user document might not exist in Firestore yet
 * - Users created via Firebase Auth don't automatically get Firestore docs
 * - setDoc with merge: true creates the document if missing
 * - This prevents "No document to update" errors
 *
 * SETTING photoURL TO NULL:
 * Passing null removes the profile image reference.
 * This is useful when a user deletes their profile picture.
 */
export const updateUserProfileImage = async (
  userId: string,
  photoURL: string | null
): Promise<void> => {
  try {
    // Create a reference to the user's document
    const userRef = doc(db, COLLECTIONS.USERS, userId);

    // Use setDoc with merge: true to create document if it doesn't exist
    // This is more robust than updateDoc which fails on missing documents
    await setDoc(
      userRef,
      {
        photoURL,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating profile image:', error);
    throw new Error(
      `Failed to update profile image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Delete a user document from Firestore
 *
 * @param userId - The user's UID
 * @returns Promise that resolves when deletion is complete
 *
 * WHEN TO USE THIS:
 * - When a user deletes their account
 * - For cleanup operations
 *
 * WARNING:
 * This permanently deletes the user's data!
 * Consider soft deletion (setting a 'deleted' flag) for recovery options.
 *
 * NOTE ON SUBCOLLECTIONS:
 * Deleting a document does NOT delete its subcollections.
 * If you have subcollections under user documents, delete them first.
 */
export const deleteUserDocument = async (userId: string): Promise<void> => {
  try {
    // Create a reference to the user's document
    const userRef = doc(db, COLLECTIONS.USERS, userId);

    // Delete the document
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user document:', error);
    throw new Error(
      `Failed to delete user data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * FIRESTORE ERROR CODES
 *
 * Common error codes you might encounter:
 *
 * - permission-denied: Security rules blocked the operation
 * - not-found: Document doesn't exist (for updateDoc)
 * - already-exists: Document already exists (for createDoc without merge)
 * - invalid-argument: Invalid data or query
 * - resource-exhausted: Quota exceeded
 * - unavailable: Service temporarily unavailable
 *
 * For user-friendly error messages, use the helper below.
 */

/**
 * Convert Firestore error codes to user-friendly messages
 *
 * @param errorCode - The Firestore error code
 * @returns A user-friendly error message
 */
export const getFirestoreErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'permission-denied': "You don't have permission to perform this action.",
    'not-found': 'The requested data could not be found.',
    'already-exists': 'This data already exists.',
    'invalid-argument': 'Invalid data provided.',
    'resource-exhausted': 'Service limit reached. Please try again later.',
    'unavailable': 'Service temporarily unavailable. Please try again.',
    'deadline-exceeded': 'Request took too long. Please try again.',
    'cancelled': 'Operation was cancelled.',
    'unauthenticated': 'You must be signed in to perform this action.',
  };

  return errorMessages[errorCode] || 'An error occurred. Please try again.';
};
