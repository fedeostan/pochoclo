/**
 * storage.ts - Firebase Storage Service
 *
 * This file handles all operations related to Firebase Storage,
 * which is used for uploading, downloading, and managing files (like images).
 *
 * WHAT IS FIREBASE STORAGE?
 * Firebase Storage is like a cloud-based file system. It's perfect for:
 * - Profile pictures
 * - User-uploaded content
 * - Media files (images, videos, audio)
 *
 * HOW STORAGE WORKS:
 * 1. Files are organized in a folder-like structure using "paths"
 * 2. Each file has a "reference" (like a pointer to its location)
 * 3. You can upload, download, delete, and get URLs for files
 *
 * STORAGE REFERENCES:
 * A reference is like a path to a file or folder. For example:
 * - ref(storage, 'profile-images') → references the profile-images folder
 * - ref(storage, 'profile-images/userId/avatar.jpg') → references a specific file
 *
 * SECURITY:
 * Storage is protected by Firebase Security Rules (configured in Firebase Console).
 * Our rules allow:
 * - Users to upload/delete only their own files
 * - Anyone (authenticated) to read profile images
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  UploadResult,
} from 'firebase/storage';
import { storage } from '@/config/firebase';

/**
 * STORAGE PATH CONSTANTS
 *
 * We define paths as constants to:
 * - Avoid typos when using the same path in multiple places
 * - Make it easy to change the structure later
 * - Document the storage structure clearly
 *
 * STRUCTURE:
 * profile-images/
 *   └── {userId}/
 *         └── avatar.jpg
 */
const STORAGE_PATHS = {
  /** Base folder for all profile images */
  PROFILE_IMAGES: 'profile-images',
} as const;

/**
 * Generate the storage path for a user's profile image
 *
 * @param userId - The user's unique ID from Firebase Auth
 * @returns The full path to the user's avatar file
 *
 * WHY A FUNCTION?
 * - Encapsulates the path logic in one place
 * - Easy to change the naming convention later
 * - Provides type safety for the userId parameter
 *
 * EXAMPLE:
 * getProfileImagePath('abc123') → 'profile-images/abc123/avatar.jpg'
 */
const getProfileImagePath = (userId: string): string => {
  return `${STORAGE_PATHS.PROFILE_IMAGES}/${userId}/avatar.jpg`;
};

/**
 * Upload a profile image to Firebase Storage
 *
 * @param userId - The user's unique ID
 * @param imageUri - The local URI of the image (from ImagePicker)
 * @returns Promise with the download URL of the uploaded image
 *
 * HOW THIS FUNCTION WORKS:
 * 1. Convert the local image URI to a Blob (binary data)
 * 2. Create a reference to where we want to store it
 * 3. Upload the blob to that location
 * 4. Get and return the public download URL
 *
 * WHAT IS A BLOB?
 * A Blob (Binary Large Object) is raw binary data.
 * Images need to be converted to Blobs before uploading.
 *
 * WHY FETCH + BLOB?
 * In React Native, we can't directly read files like in Node.js.
 * The fetch API can read local file URIs and convert them to Blobs.
 * This is a common pattern for file uploads in React Native.
 *
 * ERROR HANDLING:
 * We catch and re-throw errors with more context.
 * This makes debugging easier when something goes wrong.
 */
export const uploadProfileImage = async (
  userId: string,
  imageUri: string
): Promise<string> => {
  try {
    // Step 1: Convert the image URI to a Blob
    // The fetch API in React Native can read local file:// URIs
    // .blob() converts the response to binary data
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Step 2: Create a reference to the storage location
    // ref() creates a pointer to where we want to store the file
    const storageRef = ref(storage, getProfileImagePath(userId));

    // Step 3: Upload the blob to Firebase Storage
    // uploadBytes() sends the binary data to Firebase
    // It returns metadata about the upload (we don't need it here)
    const uploadResult: UploadResult = await uploadBytes(storageRef, blob);

    // Step 4: Get the public download URL
    // After upload, Firebase generates a URL that anyone can use to view the image
    // This URL includes a token for security
    const downloadURL = await getDownloadURL(uploadResult.ref);

    return downloadURL;
  } catch (error) {
    // Log the error for debugging
    console.error('Error uploading profile image:', error);

    // Re-throw with more context
    // This helps identify where the error came from
    throw new Error(
      `Failed to upload profile image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Delete a user's profile image from Firebase Storage
 *
 * @param userId - The user's unique ID
 * @returns Promise that resolves when deletion is complete
 *
 * WHEN TO USE THIS:
 * - When a user wants to remove their profile picture
 * - Before uploading a new image (to avoid storage buildup)
 * - When deleting a user account
 *
 * ERROR HANDLING:
 * We silently handle "object not found" errors because:
 * - The user might not have a profile image yet
 * - The image might have been deleted already
 * - We don't want to fail if there's nothing to delete
 *
 * Other errors (like permission denied) are thrown.
 */
export const deleteProfileImage = async (userId: string): Promise<void> => {
  try {
    // Create a reference to the user's profile image
    const storageRef = ref(storage, getProfileImagePath(userId));

    // Delete the file
    // This permanently removes the file from storage
    await deleteObject(storageRef);
  } catch (error: unknown) {
    // Type guard for Firebase Storage errors
    const storageError = error as { code?: string };

    // If the file doesn't exist, that's okay - nothing to delete
    // Firebase Storage returns 'storage/object-not-found' when the file doesn't exist
    if (storageError.code === 'storage/object-not-found') {
      // File doesn't exist, nothing to delete - this is fine
      console.log('No profile image to delete for user:', userId);
      return;
    }

    // Log and re-throw other errors
    console.error('Error deleting profile image:', error);
    throw new Error(
      `Failed to delete profile image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Get the download URL for a user's profile image
 *
 * @param userId - The user's unique ID
 * @returns Promise with the download URL, or null if no image exists
 *
 * WHEN TO USE THIS:
 * - To display a user's profile image
 * - To check if a user has a profile image
 *
 * WHY RETURN NULL INSTEAD OF THROWING?
 * - It's common for users to not have a profile image
 * - Returning null lets the caller show a default/fallback
 * - Throwing would require try/catch everywhere we display avatars
 *
 * THE DOWNLOAD URL:
 * Firebase Storage URLs look like:
 * https://firebasestorage.googleapis.com/v0/b/bucket/o/path?token=xxx
 *
 * The token provides temporary access. The URL is:
 * - Public (anyone with the URL can view it)
 * - Long-lived (doesn't expire quickly)
 * - Revocable (if you regenerate the token)
 */
export const getProfileImageUrl = async (
  userId: string
): Promise<string | null> => {
  try {
    // Create a reference to the user's profile image
    const storageRef = ref(storage, getProfileImagePath(userId));

    // Get the download URL
    const url = await getDownloadURL(storageRef);

    return url;
  } catch (error: unknown) {
    // Type guard for Firebase Storage errors
    const storageError = error as { code?: string };

    // If the file doesn't exist, return null
    if (storageError.code === 'storage/object-not-found') {
      return null;
    }

    // Log and re-throw other errors
    console.error('Error getting profile image URL:', error);
    throw new Error(
      `Failed to get profile image URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * FIREBASE STORAGE ERROR CODES
 *
 * Common error codes you might encounter:
 *
 * - storage/object-not-found: File doesn't exist
 * - storage/unauthorized: User doesn't have permission
 * - storage/canceled: User canceled the upload
 * - storage/unknown: Unknown error occurred
 * - storage/quota-exceeded: Storage quota exceeded
 * - storage/invalid-url: Invalid storage URL
 * - storage/retry-limit-exceeded: Too many retries
 *
 * For user-friendly error messages, use the getStorageErrorMessage helper below.
 */

/**
 * Convert Firebase Storage error codes to user-friendly messages
 *
 * @param errorCode - The Firebase Storage error code
 * @returns A user-friendly error message
 *
 * WHY THIS HELPER?
 * - Firebase error codes are technical (e.g., 'storage/unauthorized')
 * - Users need friendly messages (e.g., 'You don't have permission...')
 * - Centralizing this logic makes it easy to update messages
 */
export const getStorageErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'storage/object-not-found': 'The file could not be found.',
    'storage/unauthorized': "You don't have permission to access this file.",
    'storage/canceled': 'The upload was canceled.',
    'storage/unknown': 'An unknown error occurred. Please try again.',
    'storage/quota-exceeded':
      'Storage limit reached. Please contact support.',
    'storage/invalid-url': 'Invalid file URL.',
    'storage/retry-limit-exceeded':
      'Too many attempts. Please try again later.',
    'storage/invalid-checksum':
      'File was corrupted during upload. Please try again.',
    'storage/server-file-wrong-size':
      'File size mismatch. Please try uploading again.',
  };

  return errorMessages[errorCode] || 'An error occurred. Please try again.';
};
