/**
 * imageHelpers.ts - Image Utility Functions
 *
 * This file contains helper functions for working with images:
 * - Validation (file size, type, dimensions)
 * - Error message formatting
 * - URI manipulation
 *
 * WHY SEPARATE UTILITIES?
 * - Keep the hook focused on core functionality
 * - Reusable across different parts of the app
 * - Easier to test in isolation
 * - Single responsibility principle
 */

import * as FileSystem from 'expo-file-system';

/**
 * Image validation result
 *
 * Returns an object indicating if validation passed
 * and an error message if it failed.
 */
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Configuration for image validation
 */
interface ImageValidationConfig {
  /** Maximum file size in bytes (default: 10MB) */
  maxSizeBytes?: number;
  /** Allowed file extensions (default: jpg, jpeg, png, gif, webp) */
  allowedTypes?: string[];
  /** Minimum width in pixels (default: 50) */
  minWidth?: number;
  /** Minimum height in pixels (default: 50) */
  minHeight?: number;
  /** Maximum width in pixels (default: 4096) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 4096) */
  maxHeight?: number;
}

/**
 * Default validation configuration
 *
 * These defaults are generous to accommodate most use cases
 * while still providing reasonable limits.
 */
const DEFAULT_VALIDATION_CONFIG: Required<ImageValidationConfig> = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  minWidth: 50,
  minHeight: 50,
  maxWidth: 4096,
  maxHeight: 4096,
};

/**
 * Validate an image file
 *
 * @param uri - The local file URI to validate
 * @param config - Optional validation configuration
 * @returns Promise<ValidationResult>
 *
 * WHAT THIS VALIDATES:
 * 1. File exists and is readable
 * 2. File size is within limits
 * 3. File extension is allowed
 *
 * NOTE: We don't validate actual image dimensions here because
 * getting dimensions requires loading the image, which is expensive.
 * The ImagePicker already handles this during selection.
 *
 * USAGE:
 * ```ts
 * const result = await validateImage(uri);
 * if (!result.isValid) {
 *   Alert.alert('Invalid Image', result.error);
 * }
 * ```
 */
export const validateImage = async (
  uri: string,
  config?: ImageValidationConfig
): Promise<ValidationResult> => {
  const mergedConfig = { ...DEFAULT_VALIDATION_CONFIG, ...config };

  try {
    // Check if file exists and get info
    const fileInfo = await FileSystem.getInfoAsync(uri);

    // File doesn't exist
    if (!fileInfo.exists) {
      return {
        isValid: false,
        error: 'The selected image could not be found.',
      };
    }

    // Check file size (if available)
    // Note: fileInfo.size may be undefined on some platforms
    if (fileInfo.size && fileInfo.size > mergedConfig.maxSizeBytes) {
      const maxSizeMB = (mergedConfig.maxSizeBytes / (1024 * 1024)).toFixed(1);
      const fileSizeMB = (fileInfo.size / (1024 * 1024)).toFixed(1);
      return {
        isValid: false,
        error: `Image is too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB.`,
      };
    }

    // Extract and check file extension
    const extension = getFileExtension(uri).toLowerCase();
    if (extension && !mergedConfig.allowedTypes.includes(extension)) {
      return {
        isValid: false,
        error: `Invalid image type (.${extension}). Allowed types: ${mergedConfig.allowedTypes.join(', ')}`,
      };
    }

    // All validations passed
    return { isValid: true };
  } catch (error) {
    console.error('Error validating image:', error);
    return {
      isValid: false,
      error: 'Could not validate the image. Please try again.',
    };
  }
};

/**
 * Get the file extension from a URI or path
 *
 * @param uri - The file URI or path
 * @returns The file extension (without dot) or empty string
 *
 * EXAMPLES:
 * - 'file:///path/to/image.jpg' → 'jpg'
 * - '/path/to/image.PNG' → 'png' (lowercased)
 * - 'https://example.com/image.jpeg?query=1' → 'jpeg'
 * - '/path/to/file' → ''
 */
export const getFileExtension = (uri: string): string => {
  try {
    // Remove query parameters if present
    const cleanUri = uri.split('?')[0];

    // Get the last part after the final dot
    const parts = cleanUri.split('.');

    // No extension found
    if (parts.length < 2) {
      return '';
    }

    // Return the extension, lowercased
    return parts[parts.length - 1].toLowerCase();
  } catch {
    return '';
  }
};

/**
 * Get the filename from a URI or path
 *
 * @param uri - The file URI or path
 * @returns The filename or 'unknown'
 *
 * EXAMPLES:
 * - 'file:///path/to/image.jpg' → 'image.jpg'
 * - '/path/to/document.pdf' → 'document.pdf'
 */
export const getFileName = (uri: string): string => {
  try {
    // Remove query parameters
    const cleanUri = uri.split('?')[0];

    // Get the last path segment
    const segments = cleanUri.split('/');
    return segments[segments.length - 1] || 'unknown';
  } catch {
    return 'unknown';
  }
};

/**
 * Format file size for display
 *
 * @param bytes - Size in bytes
 * @returns Human-readable size string
 *
 * EXAMPLES:
 * - 500 → '500 B'
 * - 1024 → '1.0 KB'
 * - 1048576 → '1.0 MB'
 * - 1073741824 → '1.0 GB'
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

/**
 * Check if a URI is a local file (as opposed to a remote URL)
 *
 * @param uri - The URI to check
 * @returns true if the URI is a local file
 *
 * WHY THIS MATTERS:
 * - Local files use file:// or content:// schemes
 * - Remote URLs use http:// or https://
 * - Different handling may be needed for each
 *
 * EXAMPLES:
 * - 'file:///path/to/image.jpg' → true
 * - 'content://media/images/123' → true (Android content URI)
 * - '/path/to/image.jpg' → true (implicit file path)
 * - 'https://example.com/image.jpg' → false
 */
export const isLocalFile = (uri: string): boolean => {
  // Check for explicit schemes
  if (uri.startsWith('file://') || uri.startsWith('content://')) {
    return true;
  }

  // Check for remote URLs
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return false;
  }

  // Assume paths without schemes are local files
  return true;
};

/**
 * Generate a unique filename for uploads
 *
 * @param extension - The file extension (without dot)
 * @returns A unique filename
 *
 * FORMAT: profile_{timestamp}_{random}.{extension}
 *
 * WHY UNIQUE FILENAMES?
 * - Prevents naming conflicts in storage
 * - Allows keeping multiple versions
 * - Easier to debug with timestamps
 *
 * NOTE: For profile images, we use a fixed name ('avatar.jpg')
 * because we only keep one per user. This function is for
 * other use cases where unique names are needed.
 */
export const generateUniqueFilename = (extension: string = 'jpg'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `profile_${timestamp}_${random}.${extension}`;
};

/**
 * Image picker error messages
 *
 * Centralized error messages for consistent user experience.
 * These are user-friendly versions of technical errors.
 */
export const IMAGE_ERROR_MESSAGES = {
  /** User cancelled the picker */
  CANCELLED: 'Image selection cancelled',

  /** Permission was denied */
  PERMISSION_DENIED: 'Permission to access photos was denied',

  /** Camera permission was denied */
  CAMERA_PERMISSION_DENIED: 'Permission to access camera was denied',

  /** File is too large */
  FILE_TOO_LARGE: 'The selected image is too large',

  /** Invalid file type */
  INVALID_TYPE: 'The selected file is not a valid image',

  /** Failed to load image */
  LOAD_FAILED: 'Failed to load the selected image',

  /** Failed to optimize image */
  OPTIMIZE_FAILED: 'Failed to process the image',

  /** Failed to upload image */
  UPLOAD_FAILED: 'Failed to upload the image',

  /** Unknown error */
  UNKNOWN: 'An unexpected error occurred',
} as const;

/**
 * Get a user-friendly error message
 *
 * @param error - The error object or string
 * @returns A user-friendly error message
 *
 * This function tries to provide helpful error messages
 * based on common error patterns from image operations.
 */
export const getImageErrorMessage = (error: unknown): string => {
  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If it's an Error object, check the message
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for common error patterns
    if (message.includes('permission')) {
      return IMAGE_ERROR_MESSAGES.PERMISSION_DENIED;
    }
    if (message.includes('cancel')) {
      return IMAGE_ERROR_MESSAGES.CANCELLED;
    }
    if (message.includes('size') || message.includes('large')) {
      return IMAGE_ERROR_MESSAGES.FILE_TOO_LARGE;
    }
    if (message.includes('type') || message.includes('format')) {
      return IMAGE_ERROR_MESSAGES.INVALID_TYPE;
    }
    if (message.includes('load')) {
      return IMAGE_ERROR_MESSAGES.LOAD_FAILED;
    }
    if (message.includes('upload')) {
      return IMAGE_ERROR_MESSAGES.UPLOAD_FAILED;
    }

    // Return the original message if it seems user-friendly
    if (message.length < 100 && !message.includes('error')) {
      return error.message;
    }
  }

  // Default unknown error
  return IMAGE_ERROR_MESSAGES.UNKNOWN;
};

/**
 * EXPO FILE SYSTEM - KEY CONCEPTS
 *
 * FileSystem.documentDirectory:
 * - Persistent directory for app documents
 * - Survives app updates
 * - Good for user-generated content
 *
 * FileSystem.cacheDirectory:
 * - Temporary cache directory
 * - May be cleared by system
 * - Good for temporary files
 *
 * FileSystem.getInfoAsync(uri):
 * - Returns info about a file/directory
 * - { exists, isDirectory, size, modificationTime, uri }
 *
 * FileSystem.readAsStringAsync(uri, options):
 * - Read file contents as string
 * - Can read as base64 with { encoding: 'base64' }
 *
 * FileSystem.writeAsStringAsync(uri, contents, options):
 * - Write string contents to file
 * - Can write base64 with { encoding: 'base64' }
 *
 * FileSystem.copyAsync({ from, to }):
 * - Copy a file from one location to another
 *
 * FileSystem.deleteAsync(uri):
 * - Delete a file or directory
 */
