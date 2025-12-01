/**
 * ProfileHeader Component
 *
 * The hero section at the top of the profile screen that displays:
 * - User's profile photo (Avatar with edit capability)
 * - Display name
 * - Email address
 * - Member since date
 *
 * PURPOSE:
 * This is the "identity" section - it answers "Who am I?" for the user.
 * It's the most prominent part of the profile, following mobile UX conventions
 * where user identity is displayed at the top.
 *
 * DESIGN DECISIONS:
 * - Centered layout: Creates visual hierarchy and draws attention
 * - Avatar with edit indicator: Shows the photo is tappable
 * - Muted email: Secondary information, less prominent than name
 * - Member since: Creates sense of investment/belonging
 *
 * PROPS:
 * - user: Firebase user data (displayName, email, photoURL, metadata)
 * - onAvatarPress: Handler when avatar is tapped (opens image picker)
 * - isLoadingImage: Shows loading state during image upload
 */

import React from 'react';
import { View } from 'react-native';

// UI Components
import { Text, Avatar, getInitials } from '@/components/ui';

// Types
import type { SerializableUser } from '@/store/slices/authSlice';

/**
 * Props for ProfileHeader
 *
 * @property user - The authenticated user object from Redux
 * @property onAvatarPress - Called when avatar is tapped
 * @property isLoadingImage - Whether avatar is in loading state
 */
interface ProfileHeaderProps {
  /** The authenticated user from Firebase/Redux (can be null/undefined) */
  user: SerializableUser | null | undefined;
  /** Handler for avatar tap - typically opens image picker */
  onAvatarPress: () => void;
  /** Shows loading overlay on avatar during image upload */
  isLoadingImage: boolean;
}

/**
 * Format the "Member since" date from Firebase metadata
 *
 * Firebase stores creationTime as an ISO string like "2024-01-15T10:30:00Z"
 * We convert it to a user-friendly format like "Jan 2024"
 *
 * @param creationTime - ISO date string from Firebase
 * @returns Formatted string like "Jan 2024" or null if no date
 *
 * @example
 * formatMemberSince("2024-01-15T10:30:00Z") // "Jan 2024"
 * formatMemberSince(undefined) // null
 */
function formatMemberSince(creationTime: string | null | undefined): string | null {
  if (!creationTime) return null;

  try {
    const date = new Date(creationTime);
    // Format: "Jan 2024" (month abbreviation + year)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  } catch {
    // If date parsing fails, return null
    return null;
  }
}

/**
 * ProfileHeader Component
 *
 * Renders the user's identity section at the top of the profile screen.
 *
 * @example
 * <ProfileHeader
 *   user={currentUser}
 *   onAvatarPress={() => imagePickerRef.current?.expand()}
 *   isLoadingImage={profileImageLoading}
 * />
 */
export function ProfileHeader({
  user,
  onAvatarPress,
  isLoadingImage,
}: ProfileHeaderProps) {
  // Calculate "Member since" from Firebase metadata
  // Note: In SerializableUser, we may need to add createdAt from metadata
  // For now, we'll show it if available, otherwise skip it
  const memberSince = formatMemberSince(user?.createdAt);

  return (
    <View className="items-center py-6">
      {/**
       * Profile Avatar
       *
       * Uses our reusable Avatar component with:
       * - imageUri: Profile photo from Firebase Storage
       * - initials: Fallback when no photo (e.g., "JD" for John Doe)
       * - size="xl": Large size (96px) for profile page prominence
       * - showEditIndicator: Shows + badge indicating tappable
       * - isLoading: Shows spinner during upload
       * - onPress: Opens image picker sheet
       */}
      <Avatar
        imageUri={user?.photoURL}
        initials={getInitials(user?.displayName ?? user?.email ?? undefined)}
        size="xl"
        showEditIndicator
        isLoading={isLoadingImage}
        onPress={onAvatarPress}
        className="mb-4"
      />

      {/**
       * Display Name
       *
       * The user's name is the most important identifier.
       * Falls back to "User" if no display name is set.
       */}
      <Text variant="h3" className="mb-1">
        {user?.displayName || 'User'}
      </Text>

      {/**
       * Email Address
       *
       * Secondary identifier, shown in muted style.
       * Uses smaller text variant for visual hierarchy.
       */}
      <Text variant="muted" className="mb-1">
        {user?.email || 'No email'}
      </Text>

      {/**
       * Member Since
       *
       * Creates sense of investment and belonging.
       * Only shown if we have the creation date.
       * Uses small/muted style for subtle presence.
       */}
      {memberSince && (
        <Text variant="small" className="text-muted-foreground">
          Member since {memberSince}
        </Text>
      )}
    </View>
  );
}

/**
 * LEARNING NOTES:
 *
 * 1. COMPONENT EXTRACTION
 *    We extracted this header from the main profile.tsx for several reasons:
 *    - Single Responsibility: This component only handles user identity display
 *    - Reusability: Could be used in other screens (e.g., account settings)
 *    - Testability: Easier to test in isolation
 *    - Maintainability: Changes to header don't affect other profile logic
 *
 * 2. PROPS INTERFACE PATTERN
 *    We define a clear TypeScript interface for props:
 *    - Documents what the component needs
 *    - Provides autocomplete in IDE
 *    - Catches errors at compile time
 *    - Serves as self-documentation
 *
 * 3. OPTIONAL CHAINING (?.)
 *    We use user?.displayName because:
 *    - user could be null (not logged in)
 *    - displayName could be null (not set during signup)
 *    - Optional chaining prevents runtime errors
 *
 * 4. FALLBACK VALUES
 *    {user?.displayName || 'User'} provides sensible defaults:
 *    - If displayName exists, show it
 *    - If null/undefined, show "User"
 *    - Never shows empty space or crashes
 *
 * 5. CONDITIONAL RENDERING
 *    {memberSince && (...)} only renders when memberSince has a value:
 *    - If memberSince is null, nothing renders
 *    - Cleaner than showing "Member since: N/A"
 *    - React short-circuit evaluation pattern
 */
