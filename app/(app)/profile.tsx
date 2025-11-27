/**
 * Profile Screen - User Account Tab
 *
 * This screen displays the user's profile information and account settings.
 * It's the central hub for user-related actions like viewing account details,
 * managing settings, and signing out.
 *
 * PURPOSE:
 * The Profile screen is where users:
 * - View their account information
 * - Upload/change their profile photo
 * - Access account settings
 * - Sign out of the app
 *
 * FIREBASE USER DATA DISPLAYED:
 * The SerializableUser type (from authSlice.ts) contains:
 * - uid: Unique user identifier (always present)
 * - email: User's email address (string | null)
 * - displayName: User's display name (string | null)
 * - photoURL: Profile photo URL (string | null)
 * - emailVerified: Whether email is verified (boolean)
 *
 * PROFILE IMAGE FEATURE (PHASE 6):
 * This screen integrates the profile image upload feature:
 * - Avatar component displays current profile photo or initials
 * - Tapping avatar opens ImagePickerSheet bottom sheet
 * - User can choose camera or gallery
 * - Images are uploaded to Firebase Storage via Redux thunks
 * - Loading and error states provide user feedback
 *
 * DESIGN SYSTEM:
 * Follows UI_RULES.md principles:
 * - Minimal: Clean layout with purposeful whitespace
 * - Light: Off-white background (#FAFAF9)
 * - Soft: Muted colors, no harsh tones
 * - Modern: Rounded corners, clean typography
 */

import { useRef, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CircleUser, Mail, Shield, Key, CheckCircle, XCircle, Settings, LogOut } from 'lucide-react-native';

// UI Components - Import Avatar and getInitials for profile photo display
import {
  Text,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Avatar,
  getInitials,
} from '@/components/ui';
import type { BottomSheetRef } from '@/components/ui/BottomSheet';

// ImagePickerSheet - Bottom sheet for choosing camera vs gallery
import { ImagePickerSheet } from '@/components/ImagePickerSheet';

// Custom hook for image selection with permission handling
import { useImagePicker } from '@/hooks/useImagePicker';

// Redux state management
import { useAppDispatch, useAppSelector } from '@/store';
import {
  signOut,
  updateUserProfileImage,
  removeUserProfileImage,
  clearProfileImageError,
} from '@/store/slices/authSlice';

// Theme colors for icons
import { colors } from '@/theme';

/**
 * ProfileScreen Component
 *
 * Displays user profile information from Firebase Auth
 * and provides account management functionality including
 * profile image upload and management.
 *
 * STATE MANAGEMENT:
 * - Reads user data from Redux store (state.auth.user)
 * - Reads profileImageLoading for upload progress
 * - Reads profileImageError for upload failures
 * - Dispatches signOut, updateUserProfileImage, removeUserProfileImage
 *
 * PROFILE IMAGE FLOW:
 * 1. User taps avatar → ImagePickerSheet opens
 * 2. User selects camera or gallery
 * 3. useImagePicker handles permissions and image selection
 * 4. Redux thunk uploads to Firebase Storage
 * 5. Avatar updates with new image
 *
 * @returns The profile screen component
 */
export default function ProfileScreen() {
  /**
   * Redux Hooks
   *
   * useAppDispatch: Returns typed dispatch function for actions
   * useAppSelector: Reads from Redux store with TypeScript support
   *
   * We read:
   * - user: The current authenticated user (SerializableUser)
   * - loading: Whether an auth operation is in progress
   * - profileImageLoading: Whether a profile image operation is in progress
   * - profileImageError: Error message from failed image operations
   */
  const dispatch = useAppDispatch();
  const { user, loading, profileImageLoading, profileImageError } = useAppSelector(
    (state) => state.auth
  );

  /**
   * Ref for ImagePickerSheet
   *
   * We use a ref to control the bottom sheet imperatively:
   * - expand() to open the sheet
   * - close() to close the sheet
   *
   * WHY A REF INSTEAD OF STATE?
   * Bottom sheets from @gorhom/bottom-sheet are optimized for
   * imperative control. Using state would cause unnecessary re-renders.
   */
  const imagePickerSheetRef = useRef<BottomSheetRef>(null);

  /**
   * Image Picker Hook
   *
   * This hook provides:
   * - takePhoto(): Launch camera and capture photo
   * - pickFromGallery(): Open photo library picker
   * - isLoading: Whether an image operation is in progress
   *
   * The hook handles:
   * - Permission requests with user-friendly messages
   * - Image optimization (resizing, compression)
   * - Error handling
   */
  const { takePhoto, pickFromGallery, isLoading: isImagePickerLoading } = useImagePicker();

  /**
   * Effect: Show Error Alert When Profile Image Upload Fails
   *
   * We use an effect to watch profileImageError and show an alert
   * when an error occurs. After showing the alert, we clear the error.
   *
   * WHY AN EFFECT?
   * - The error comes from Redux (async thunk rejection)
   * - We want to show a user-friendly alert
   * - The effect ensures we only show the alert once per error
   */
  useEffect(() => {
    if (profileImageError) {
      Alert.alert(
        'Upload Failed',
        profileImageError,
        [
          {
            text: 'OK',
            onPress: () => dispatch(clearProfileImageError()),
          },
        ]
      );
    }
  }, [profileImageError, dispatch]);

  /**
   * Handle Avatar Press
   *
   * Opens the ImagePickerSheet when user taps on their avatar.
   * The sheet provides options to choose from gallery or take a photo.
   */
  const handleAvatarPress = () => {
    imagePickerSheetRef.current?.expand();
  };

  /**
   * Handle Gallery Selection
   *
   * Called when user selects "Choose from Library" in the sheet.
   *
   * FLOW:
   * 1. Close the sheet
   * 2. Open photo library picker
   * 3. If image selected, dispatch upload thunk
   * 4. Redux handles loading state and errors
   */
  const handleSelectGallery = async () => {
    // Close the sheet first for better UX
    imagePickerSheetRef.current?.close();

    // Pick an image from the gallery
    const result = await pickFromGallery();

    // If user selected an image (not cancelled), upload it
    if (result.success) {
      dispatch(updateUserProfileImage({ imageUri: result.uri }));
    }
    // If cancelled or error, the hook already handles it
  };

  /**
   * Handle Camera Selection
   *
   * Called when user selects "Take Photo" in the sheet.
   *
   * FLOW:
   * 1. Close the sheet
   * 2. Open camera
   * 3. If photo captured, dispatch upload thunk
   * 4. Redux handles loading state and errors
   */
  const handleSelectCamera = async () => {
    // Close the sheet first
    imagePickerSheetRef.current?.close();

    // Take a photo with the camera
    const result = await takePhoto();

    // If photo was taken (not cancelled), upload it
    if (result.success) {
      dispatch(updateUserProfileImage({ imageUri: result.uri }));
    }
  };

  /**
   * Handle Sheet Close
   *
   * Called when the sheet is dismissed (via backdrop tap or swipe).
   * Currently just for cleanup, but could be used for analytics, etc.
   */
  const handleSheetClose = () => {
    // Optional: Add any cleanup logic here
  };

  /**
   * Sign Out Handler
   *
   * Dispatches the signOut async thunk to:
   * 1. Call Firebase signOut()
   * 2. Clear tokens from AsyncStorage
   * 3. Update Redux state (user = null)
   * 4. Navigate to /welcome explicitly
   *
   * WHY EXPLICIT NAVIGATION?
   * The Redirect component in index.tsx only evaluates on initial render.
   * It doesn't re-trigger when Redux state changes mid-session.
   * So we explicitly navigate after successful sign-out.
   */
  const handleSignOut = async () => {
    try {
      await dispatch(signOut()).unwrap();
      // Success! Navigate to welcome screen
      router.replace('/welcome');
    } catch {
      // Error is already set in Redux state
      // Sign out rarely fails, but if it does, user can try again
    }
  };

  /**
   * Computed: Is Loading Image
   *
   * True if either the image picker is working (selecting/optimizing)
   * or Redux is uploading to Firebase Storage.
   *
   * We combine both states because from the user's perspective,
   * it's one continuous "loading" experience.
   */
  const isLoadingImage = isImagePickerLoading || profileImageLoading;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/**
       * ScrollView Container
       *
       * Profile screens can have lots of settings and options.
       * ScrollView ensures all content is accessible.
       */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 py-8">
          {/**
           * Header Section
           *
           * Shows "Profile" title and subtitle.
           * Consistent with other tab screens.
           */}
          <View className="mb-8">
            <Text variant="h1" className="mb-2">
              Profile
            </Text>
            <Text variant="lead" className="text-muted-foreground">
              Manage your account
            </Text>
          </View>

          {/**
           * Profile Avatar Card
           *
           * Shows user avatar with profile photo or initials fallback.
           * Tapping the avatar opens the image picker sheet.
           *
           * AVATAR FEATURES:
           * - Displays photoURL if available, otherwise initials
           * - Edit indicator (+ icon) shows it's tappable
           * - Loading overlay during image upload
           * - Accessible with proper role and label
           */}
          <Card className="mb-6">
            <CardContent className="items-center py-8">
              {/**
               * Avatar Component
               *
               * The Avatar component from our UI library handles:
               * - Displaying the image from photoURL
               * - Fallback to initials when no image
               * - Loading state during image fetch
               * - Edit indicator badge
               *
               * Props explained:
               * - imageUri: The Firebase Storage download URL
               * - initials: Fallback text (uses getInitials helper)
               * - size="xl": Large size for profile page (96px)
               * - showEditIndicator: Shows + badge indicating tappable
               * - isLoading: Shows spinner during upload
               * - onPress: Opens the image picker sheet
               * - className: Additional margin below
               */}
              <Avatar
                imageUri={user?.photoURL}
                initials={getInitials(user?.displayName || user?.email)}
                size="xl"
                showEditIndicator
                isLoading={isLoadingImage}
                onPress={handleAvatarPress}
                className="mb-4"
              />
              <Text variant="h3" className="mb-1">
                {user?.displayName || 'User'}
              </Text>
              <Text variant="muted">
                {user?.email || 'No email'}
              </Text>
            </CardContent>
          </Card>

          {/**
           * Account Details Card
           *
           * Displays all available Firebase Auth user data.
           * Each row shows a label, icon, and value.
           */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>
                Information from Firebase Authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              {/**
               * User ID Row
               * The uid is always present and unique.
               */}
              <DataRow
                icon={<Key size={20} color={colors.mutedForeground} />}
                label="User ID"
                value={user?.uid || 'N/A'}
                isMonospace
              />

              {/**
               * Email Row
               * User's email address used for authentication.
               */}
              <DataRow
                icon={<Mail size={20} color={colors.mutedForeground} />}
                label="Email"
                value={user?.email || 'Not provided'}
              />

              {/**
               * Display Name Row
               * Set during sign up via updateProfile().
               */}
              <DataRow
                icon={<CircleUser size={20} color={colors.mutedForeground} />}
                label="Display Name"
                value={user?.displayName || 'Not set'}
              />

              {/**
               * Email Verified Status
               * Shows checkmark or X icon based on status.
               */}
              <DataRow
                icon={<Shield size={20} color={colors.mutedForeground} />}
                label="Email Verified"
                value={
                  <View className="flex-row items-center gap-2">
                    {user?.emailVerified ? (
                      <>
                        <CheckCircle size={18} color={colors.primary} />
                        <Text className="text-primary font-medium">Verified</Text>
                      </>
                    ) : (
                      <>
                        <XCircle size={18} color={colors.destructive} />
                        <Text className="text-destructive font-medium">Not Verified</Text>
                      </>
                    )}
                  </View>
                }
              />
            </CardContent>
          </Card>

          {/**
           * Settings Section (Placeholder)
           *
           * Quick access to future settings options.
           * Currently shows what settings could be available.
           */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex-row items-center py-2">
                <View className="w-10 h-10 rounded-lg bg-primary-100 items-center justify-center mr-3">
                  <Settings size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-medium">App Settings</Text>
                  <Text variant="small" className="text-muted-foreground">
                    Preferences coming soon
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/**
           * Spacer
           *
           * flex-1 pushes the sign out button to the bottom
           * when there's extra space.
           */}
          <View className="flex-1" />

          {/**
           * Sign Out Button
           *
           * Uses ghost variant with destructive text color for a minimal,
           * text-only appearance. Less prominent than a filled button,
           * but still clearly recognizable as an action.
           *
           * WHY GHOST INSTEAD OF FILLED?
           * - Sign out is not a frequent action
           * - Filled destructive button felt too prominent/alarming
           * - Ghost with red text is subtle but clear
           * - Fits our minimal design philosophy
           */}
          <Button
            variant="ghost"
            onPress={handleSignOut}
            isLoading={loading}
            disabled={loading}
            leftIcon={<LogOut size={20} color="#991B1B" />}
            className="mt-4"
          >
            <Text className="text-destructive-foreground font-semibold">Sign Out</Text>
          </Button>
        </View>
      </ScrollView>

      {/**
       * ImagePickerSheet
       *
       * Bottom sheet that appears when user taps on their avatar.
       * Provides two options: "Choose from Library" and "Take Photo".
       *
       * HOW IT WORKS:
       * 1. User taps avatar → handleAvatarPress calls expand() on ref
       * 2. Sheet slides up with two options
       * 3. User taps an option → handler is called
       * 4. Sheet closes and image picker/camera opens
       * 5. If image selected, Redux thunk handles upload
       *
       * THE REF PATTERN:
       * We control the sheet via ref.current.expand() and ref.current.close()
       * This is the recommended pattern from @gorhom/bottom-sheet
       * because it avoids unnecessary re-renders.
       *
       * PROPS:
       * - ref: Allows imperative control (expand/close)
       * - onSelectGallery: Handler for gallery option
       * - onSelectCamera: Handler for camera option
       * - onClose: Called when sheet is dismissed
       */}
      <ImagePickerSheet
        ref={imagePickerSheetRef}
        onSelectGallery={handleSelectGallery}
        onSelectCamera={handleSelectCamera}
        onClose={handleSheetClose}
      />
    </SafeAreaView>
  );
}

/**
 * =============================================================================
 * DATA ROW COMPONENT
 * =============================================================================
 *
 * A reusable component for displaying labeled data.
 * Used in the Account Details card.
 *
 * Props:
 * @param icon - Lucide icon component
 * @param label - Label text (e.g., "Email")
 * @param value - Value to display (string or JSX element)
 * @param isMonospace - Whether to use monospace font for value
 */
interface DataRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  isMonospace?: boolean;
}

function DataRow({ icon, label, value, isMonospace = false }: DataRowProps) {
  return (
    <View className="flex-row items-start">
      {/**
       * Icon Container
       * Fixed width ensures alignment across rows.
       */}
      <View className="w-8 mt-0.5">
        {icon}
      </View>

      {/**
       * Label and Value Container
       * flex-1 takes remaining space.
       */}
      <View className="flex-1 gap-1">
        <Text variant="small" className="text-muted-foreground">
          {label}
        </Text>
        {typeof value === 'string' ? (
          <Text
            className={isMonospace ? 'font-mono text-sm' : ''}
            numberOfLines={1}
          >
            {value}
          </Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

/**
 * LEARNING NOTES:
 *
 * 1. PROFILE TAB PATTERNS
 *    Profile tabs typically include:
 *    - User avatar and basic info at top
 *    - Account details section
 *    - Settings/preferences links
 *    - Sign out button at bottom
 *
 *    This structure is familiar to users from most apps.
 *
 * 2. PROFILE IMAGE UPLOAD (PHASE 6)
 *    The profile image feature demonstrates several patterns:
 *
 *    COMPONENT ARCHITECTURE:
 *    - Avatar: Reusable UI component for displaying images/initials
 *    - ImagePickerSheet: Bottom sheet with camera/gallery options
 *    - useImagePicker: Custom hook for image selection logic
 *    - Redux thunks: Handle async upload to Firebase Storage
 *
 *    DATA FLOW:
 *    User taps avatar → Sheet opens → User picks option →
 *    Hook handles permissions → Image selected →
 *    Redux thunk uploads → State updates → Avatar re-renders
 *
 *    SEPARATION OF CONCERNS:
 *    - UI components know nothing about Firebase
 *    - Hooks handle platform-specific logic (permissions, image picking)
 *    - Redux coordinates multi-service operations
 *    - Services abstract Firebase API calls
 *
 * 3. BOTTOM SHEET PATTERN
 *    We use refs for bottom sheets instead of state because:
 *    - @gorhom/bottom-sheet is optimized for imperative control
 *    - Avoids unnecessary re-renders
 *    - Better performance for gesture-driven animations
 *
 *    Pattern: const ref = useRef<BottomSheetRef>(null);
 *    Open:    ref.current?.expand();
 *    Close:   ref.current?.close();
 *
 * 4. SIGN OUT IN PROFILE
 *    Sign out is commonly placed in the Profile tab because:
 *    - It's account-related action
 *    - Users expect to find it here
 *    - It's not a frequent action (shouldn't be prominent elsewhere)
 *
 * 5. REDUX FOR AUTH STATE
 *    We use Redux instead of local state because:
 *    - Auth state is needed across the app
 *    - Other components react to auth changes
 *    - DevTools help debug auth flow
 *    - Centralized state management
 *    - profileImageLoading/Error are separate from main loading/error
 *
 * 6. NAVIGATION AFTER SIGN OUT
 *    We use router.replace('/welcome') because:
 *    - replace() removes current screen from stack
 *    - User can't go "back" to authenticated screens
 *    - Clean navigation history
 *
 * 7. ERROR HANDLING WITH useEffect
 *    We use useEffect to watch profileImageError because:
 *    - Errors come from async Redux operations
 *    - We want to show an Alert (imperative API)
 *    - Effect ensures we only show alert once per error
 *    - We clear the error after showing it
 *
 * 8. SAFE AREA WITH TABS
 *    We use edges={['top']} because:
 *    - Tab bar handles bottom safe area
 *    - We only need top safe area for notch
 *    - Prevents double padding at bottom
 *
 * 9. DESTRUCTIVE BUTTON
 *    The destructive variant signals danger:
 *    - Red/muted styling draws attention
 *    - User knows this is a significant action
 *    - Consistent with UX conventions
 *
 * FUTURE ENHANCEMENTS:
 * - Add "Remove Photo" option to ImagePickerSheet
 * - Add edit profile functionality
 * - Add email verification sending
 * - Add additional user data from Firestore
 * - Add settings navigation
 * - Add notification preferences
 * - Add theme/appearance settings
 */
