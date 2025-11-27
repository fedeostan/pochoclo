/**
 * useImagePicker.ts - Custom Hook for Image Selection
 *
 * This hook provides a clean API for selecting images from the camera or gallery
 * with proper permission handling, user-friendly messages, and image optimization.
 *
 * WHAT IS A CUSTOM HOOK?
 * A custom hook is a function that starts with "use" and can use other React hooks.
 * It lets you extract reusable logic from components. Think of it as a way to
 * share stateful logic between components without copy-pasting code.
 *
 * WHY A HOOK FOR IMAGE PICKING?
 * - Permission handling is complex and repetitive
 * - Need to handle both camera and gallery
 * - Image optimization should happen automatically
 * - Error handling needs to be consistent
 * - A hook encapsulates all this complexity
 *
 * EXPO IMAGE PICKER:
 * Expo provides expo-image-picker which handles the platform differences
 * between iOS and Android for accessing camera and photo library.
 * It returns a result object with the selected image URI.
 */

import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert, Linking, Platform } from 'react-native';

/**
 * Configuration options for the image picker
 *
 * These options control how the image picker behaves:
 * - allowsEditing: Let user crop the image before selecting
 * - aspect: Force a specific aspect ratio when cropping
 * - quality: Image compression quality (0-1)
 * - maxSize: Maximum dimension for resizing
 */
interface ImagePickerConfig {
  /** Allow user to edit/crop the image (default: true) */
  allowsEditing?: boolean;
  /** Aspect ratio for cropping [width, height] (default: [1, 1] for square) */
  aspect?: [number, number];
  /** Image quality 0-1 (default: 0.8) */
  quality?: number;
  /** Maximum width/height in pixels (default: 500) */
  maxSize?: number;
}

/**
 * Result returned when an image is successfully selected
 *
 * WHY SEPARATE SUCCESS AND CANCELLED STATES?
 * - Clear distinction between success, cancel, and error
 * - TypeScript can narrow the type based on 'success' property
 * - Caller knows exactly what to expect
 */
interface ImagePickerSuccess {
  success: true;
  /** The optimized image URI (local file path) */
  uri: string;
  /** Width of the optimized image */
  width: number;
  /** Height of the optimized image */
  height: number;
}

interface ImagePickerCancelled {
  success: false;
  cancelled: true;
}

interface ImagePickerError {
  success: false;
  cancelled: false;
  error: string;
}

/** Union type for all possible results */
type ImagePickerResult = ImagePickerSuccess | ImagePickerCancelled | ImagePickerError;

/**
 * State returned by the useImagePicker hook
 */
interface UseImagePickerState {
  /** Whether an operation is in progress */
  isLoading: boolean;
  /** Take a photo using the camera */
  takePhoto: () => Promise<ImagePickerResult>;
  /** Pick an image from the gallery */
  pickFromGallery: () => Promise<ImagePickerResult>;
  /** Request camera permission (call before takePhoto) */
  requestCameraPermission: () => Promise<boolean>;
  /** Request gallery permission (call before pickFromGallery) */
  requestGalleryPermission: () => Promise<boolean>;
}

/**
 * Default configuration for the image picker
 */
const DEFAULT_CONFIG: Required<ImagePickerConfig> = {
  allowsEditing: true,
  aspect: [1, 1], // Square aspect ratio for profile pictures
  quality: 0.8, // 80% quality - good balance of size vs quality
  maxSize: 500, // 500x500 max - plenty for profile pictures
};

/**
 * useImagePicker - Custom hook for selecting and optimizing images
 *
 * @param config - Optional configuration options
 * @returns Object with loading state and functions to pick/take images
 *
 * USAGE EXAMPLE:
 * ```tsx
 * function ProfileScreen() {
 *   const { isLoading, takePhoto, pickFromGallery } = useImagePicker();
 *
 *   const handleTakePhoto = async () => {
 *     const result = await takePhoto();
 *     if (result.success) {
 *       console.log('Image URI:', result.uri);
 *     }
 *   };
 *
 *   return (
 *     <Button onPress={handleTakePhoto} disabled={isLoading}>
 *       Take Photo
 *     </Button>
 *   );
 * }
 * ```
 */
export const useImagePicker = (config?: ImagePickerConfig): UseImagePickerState => {
  // Merge provided config with defaults
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Loading state to show spinner during operations
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Show a user-friendly alert explaining why we need camera permission
   *
   * WHY EXPLAIN BEFORE ASKING?
   * - Users are more likely to grant permission if they understand why
   * - Apple and Google recommend explaining permission requests
   * - Reduces permission denials and improves UX
   */
  const showPermissionExplanation = useCallback(
    (type: 'camera' | 'gallery'): Promise<boolean> => {
      return new Promise((resolve) => {
        const title = type === 'camera' ? 'Camera Access' : 'Photo Library Access';
        const message =
          type === 'camera'
            ? 'POCHOCLO needs access to your camera to take a profile photo. Your photo will only be used for your profile picture.'
            : 'POCHOCLO needs access to your photo library to choose a profile picture. We only access photos you select.';

        Alert.alert(title, message, [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Continue',
            onPress: () => resolve(true),
          },
        ]);
      });
    },
    []
  );

  /**
   * Show alert when permission is permanently denied
   *
   * On iOS and Android, after denying permission twice, the system
   * won't show the permission dialog again. We need to direct users
   * to Settings to enable the permission manually.
   */
  const showPermissionDeniedAlert = useCallback((type: 'camera' | 'gallery') => {
    const permissionName = type === 'camera' ? 'Camera' : 'Photo Library';

    Alert.alert(
      `${permissionName} Access Required`,
      `To ${type === 'camera' ? 'take photos' : 'choose photos'}, please enable ${permissionName} access in your device settings.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => {
            // Open the app's settings page
            // On iOS: Opens the app's settings in the Settings app
            // On Android: Opens the app's info page in Settings
            Linking.openSettings();
          },
        },
      ]
    );
  }, []);

  /**
   * Request camera permission with user-friendly flow
   *
   * @returns Promise<boolean> - true if permission granted
   *
   * PERMISSION FLOW:
   * 1. Check current permission status
   * 2. If already granted, return true
   * 3. If undetermined, explain why we need it, then request
   * 4. If denied, show instructions to enable in Settings
   */
  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Check current permission status
      const { status: currentStatus } = await ImagePicker.getCameraPermissionsAsync();

      // If already granted, we're good
      if (currentStatus === 'granted') {
        return true;
      }

      // If permission hasn't been asked yet, explain and request
      if (currentStatus === 'undetermined') {
        // Show explanation first
        const shouldContinue = await showPermissionExplanation('camera');
        if (!shouldContinue) {
          return false;
        }

        // Request the actual permission
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        return status === 'granted';
      }

      // Permission was denied - show instructions
      showPermissionDeniedAlert('camera');
      return false;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }, [showPermissionExplanation, showPermissionDeniedAlert]);

  /**
   * Request gallery/photo library permission with user-friendly flow
   *
   * @returns Promise<boolean> - true if permission granted
   *
   * NOTE ON iOS 14+:
   * iOS 14 introduced "limited" photo access where users can select
   * specific photos. For profile pictures, we want full access for
   * a better UX, but limited access also works.
   */
  const requestGalleryPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Check current permission status
      const { status: currentStatus } =
        await ImagePicker.getMediaLibraryPermissionsAsync();

      // If already granted (or limited on iOS 14+), we're good
      if (currentStatus === 'granted') {
        return true;
      }

      // If permission hasn't been asked yet, explain and request
      if (currentStatus === 'undetermined') {
        // Show explanation first
        const shouldContinue = await showPermissionExplanation('gallery');
        if (!shouldContinue) {
          return false;
        }

        // Request the actual permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return status === 'granted';
      }

      // Permission was denied - show instructions
      showPermissionDeniedAlert('gallery');
      return false;
    } catch (error) {
      console.error('Error requesting gallery permission:', error);
      return false;
    }
  }, [showPermissionExplanation, showPermissionDeniedAlert]);

  /**
   * Optimize an image by resizing and compressing it
   *
   * @param uri - The original image URI
   * @returns Promise with optimized image result
   *
   * WHY OPTIMIZE?
   * - Reduces file size (faster uploads, less storage cost)
   * - Ensures consistent dimensions for profile pictures
   * - Improves loading performance when displaying images
   *
   * HOW ImageManipulator WORKS:
   * 1. Takes an input image URI
   * 2. Applies a series of actions (resize, rotate, flip, crop)
   * 3. Saves the result with specified format and quality
   * 4. Returns the new image URI
   */
  const optimizeImage = useCallback(
    async (
      uri: string
    ): Promise<{ uri: string; width: number; height: number }> => {
      try {
        // Resize the image to max dimensions while maintaining aspect ratio
        // The resize action scales the image proportionally
        const result = await ImageManipulator.manipulateAsync(
          uri,
          [
            {
              // Resize to fit within maxSize x maxSize box
              // ImageManipulator preserves aspect ratio automatically
              resize: {
                width: mergedConfig.maxSize,
                height: mergedConfig.maxSize,
              },
            },
          ],
          {
            // Output as JPEG for smaller file size
            format: ImageManipulator.SaveFormat.JPEG,
            // Compress with our quality setting
            compress: mergedConfig.quality,
          }
        );

        return {
          uri: result.uri,
          width: result.width,
          height: result.height,
        };
      } catch (error) {
        console.error('Error optimizing image:', error);
        // If optimization fails, return original (better than nothing)
        throw new Error('Failed to optimize image');
      }
    },
    [mergedConfig.maxSize, mergedConfig.quality]
  );

  /**
   * Take a photo using the device camera
   *
   * @returns Promise<ImagePickerResult> - The result of the operation
   *
   * FLOW:
   * 1. Request camera permission
   * 2. If denied, return early
   * 3. Launch camera with our settings
   * 4. If cancelled, return cancelled result
   * 5. Optimize the captured image
   * 6. Return the optimized image URI
   *
   * TESTING NOTE:
   * iOS Simulator does NOT support camera - test on physical device
   * Android Emulator has a simulated camera you can use
   */
  const takePhoto = useCallback(async (): Promise<ImagePickerResult> => {
    setIsLoading(true);

    try {
      // Request permission first
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return { success: false, cancelled: true };
      }

      // Launch the camera
      const result = await ImagePicker.launchCameraAsync({
        // Use the media type for images
        mediaTypes: ['images'],
        // Allow editing if configured
        allowsEditing: mergedConfig.allowsEditing,
        // Set aspect ratio for cropping
        aspect: mergedConfig.aspect,
        // Set initial quality (we'll compress more later)
        quality: 1, // Full quality, we optimize afterward
      });

      // User cancelled
      if (result.canceled) {
        return { success: false, cancelled: true };
      }

      // Get the first (and only) selected image
      const selectedImage = result.assets[0];

      // Optimize the image
      const optimized = await optimizeImage(selectedImage.uri);

      return {
        success: true,
        uri: optimized.uri,
        width: optimized.width,
        height: optimized.height,
      };
    } catch (error) {
      console.error('Error taking photo:', error);
      return {
        success: false,
        cancelled: false,
        error: error instanceof Error ? error.message : 'Failed to take photo',
      };
    } finally {
      setIsLoading(false);
    }
  }, [
    requestCameraPermission,
    mergedConfig.allowsEditing,
    mergedConfig.aspect,
    optimizeImage,
  ]);

  /**
   * Pick an image from the device's photo gallery
   *
   * @returns Promise<ImagePickerResult> - The result of the operation
   *
   * FLOW:
   * 1. Request gallery permission
   * 2. If denied, return early
   * 3. Launch image picker (gallery view)
   * 4. If cancelled, return cancelled result
   * 5. Optimize the selected image
   * 6. Return the optimized image URI
   */
  const pickFromGallery = useCallback(async (): Promise<ImagePickerResult> => {
    setIsLoading(true);

    try {
      // Request permission first
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) {
        return { success: false, cancelled: true };
      }

      // Launch the image library picker
      const result = await ImagePicker.launchImageLibraryAsync({
        // Only allow images (not videos)
        mediaTypes: ['images'],
        // Allow editing if configured
        allowsEditing: mergedConfig.allowsEditing,
        // Set aspect ratio for cropping
        aspect: mergedConfig.aspect,
        // Set initial quality (we'll compress more later)
        quality: 1, // Full quality, we optimize afterward
      });

      // User cancelled
      if (result.canceled) {
        return { success: false, cancelled: true };
      }

      // Get the first (and only) selected image
      const selectedImage = result.assets[0];

      // Optimize the image
      const optimized = await optimizeImage(selectedImage.uri);

      return {
        success: true,
        uri: optimized.uri,
        width: optimized.width,
        height: optimized.height,
      };
    } catch (error) {
      console.error('Error picking image:', error);
      return {
        success: false,
        cancelled: false,
        error: error instanceof Error ? error.message : 'Failed to pick image',
      };
    } finally {
      setIsLoading(false);
    }
  }, [
    requestGalleryPermission,
    mergedConfig.allowsEditing,
    mergedConfig.aspect,
    optimizeImage,
  ]);

  return {
    isLoading,
    takePhoto,
    pickFromGallery,
    requestCameraPermission,
    requestGalleryPermission,
  };
};

/**
 * EXPO IMAGE PICKER - KEY CONCEPTS
 *
 * MediaType:
 * - 'images': Only show images
 * - 'videos': Only show videos
 * - 'all': Show both (deprecated, use arrays now)
 * - ['images']: Array format (current)
 * - ['images', 'videos']: Multiple types
 *
 * Result Object:
 * {
 *   canceled: boolean,        // True if user cancelled
 *   assets: [{                // Array of selected assets
 *     uri: string,            // Local file URI
 *     width: number,          // Image width in pixels
 *     height: number,         // Image height in pixels
 *     type: 'image'|'video',  // Asset type
 *     fileName: string,       // Original filename
 *     fileSize: number,       // Size in bytes
 *   }]
 * }
 *
 * Permission Status:
 * - 'granted': User gave permission
 * - 'denied': User denied permission
 * - 'undetermined': Haven't asked yet
 *
 * IMAGE MANIPULATOR ACTIONS:
 * - resize: { width?, height? } - Scale image
 * - rotate: number (degrees) - Rotate image
 * - flip: FlipType.Horizontal | FlipType.Vertical
 * - crop: { originX, originY, width, height }
 */

export type { ImagePickerResult, ImagePickerConfig };
