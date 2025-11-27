/**
 * Avatar Component
 *
 * A versatile avatar component that displays either:
 * - A user's profile image (from URL)
 * - Fallback initials (when no image is available)
 *
 * Features:
 * - Multiple size variants (sm, md, lg, xl)
 * - Edit indicator overlay (+ icon for profile editing)
 * - Loading state while image loads
 * - Pressable wrapper for interactions
 * - Accessible with proper roles
 *
 * DESIGN SYSTEM COMPLIANCE:
 * - Primary background: bg-primary (#6B8E7B)
 * - White text on primary: text-primary-foreground
 * - Rounded full: rounded-full for circular shape
 * - Edit indicator: Small circle in bottom-right corner
 */

import React, { useState } from 'react';
import {
  View,
  Image,
  Pressable,
  PressableProps,
  ActivityIndicator,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { cn } from '@/utils';
import { Text } from './Text';

/**
 * Avatar Size Variants
 *
 * Different sizes for different contexts:
 * - sm: 32px - For compact lists, comments
 * - md: 48px - For cards, medium displays
 * - lg: 64px - For profile headers
 * - xl: 96px - For main profile page (current use case)
 */
type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Avatar Props
 *
 * @property imageUri - URL of the profile image (optional)
 * @property initials - Fallback initials when no image (1-2 characters)
 * @property size - Size variant (default: 'lg')
 * @property showEditIndicator - Show the + icon overlay (default: false)
 * @property onPress - Called when avatar is pressed
 * @property isLoading - Show loading state
 * @property className - Additional styles for container
 */
interface AvatarProps extends Omit<PressableProps, 'children'> {
  /** URL of the profile image */
  imageUri?: string | null;
  /** Fallback text (initials) when no image */
  initials?: string;
  /** Size variant */
  size?: AvatarSize;
  /** Show edit indicator (+ icon in corner) */
  showEditIndicator?: boolean;
  /** Show loading spinner overlay */
  isLoading?: boolean;
  /** Additional styles */
  className?: string;
}

/**
 * Size Configurations
 *
 * Maps each size variant to its dimensions and related styles.
 * Using a configuration object makes it easy to:
 * - Add new sizes
 * - Adjust proportions consistently
 * - Generate appropriate icon/text sizes
 */
const sizeConfig: Record<
  AvatarSize,
  {
    containerSize: string;
    textSize: string;
    editIndicatorSize: string;
    editIconSize: number;
    editIndicatorOffset: string;
  }
> = {
  sm: {
    containerSize: 'w-8 h-8', // 32px
    textSize: 'text-sm',
    editIndicatorSize: 'w-4 h-4', // 16px
    editIconSize: 10,
    editIndicatorOffset: '-bottom-0.5 -right-0.5',
  },
  md: {
    containerSize: 'w-12 h-12', // 48px
    textSize: 'text-lg',
    editIndicatorSize: 'w-5 h-5', // 20px
    editIconSize: 12,
    editIndicatorOffset: '-bottom-0.5 -right-0.5',
  },
  lg: {
    containerSize: 'w-16 h-16', // 64px
    textSize: 'text-2xl',
    editIndicatorSize: 'w-6 h-6', // 24px
    editIconSize: 14,
    editIndicatorOffset: '-bottom-1 -right-1',
  },
  xl: {
    containerSize: 'w-24 h-24', // 96px
    textSize: 'text-4xl',
    editIndicatorSize: 'w-7 h-7', // 28px
    editIconSize: 16,
    editIndicatorOffset: '-bottom-1 -right-1',
  },
};

/**
 * Avatar Component
 *
 * @example
 * // Simple avatar with initials
 * <Avatar initials="JD" />
 *
 * @example
 * // Avatar with image
 * <Avatar imageUri="https://example.com/avatar.jpg" initials="JD" />
 *
 * @example
 * // Profile page avatar with edit indicator
 * <Avatar
 *   imageUri={user.photoURL}
 *   initials={getInitials(user.displayName)}
 *   size="xl"
 *   showEditIndicator
 *   onPress={handleEditAvatar}
 * />
 *
 * @example
 * // Loading state during upload
 * <Avatar initials="JD" size="xl" isLoading />
 */
export function Avatar({
  imageUri,
  initials = '?',
  size = 'lg',
  showEditIndicator = false,
  isLoading = false,
  className,
  onPress,
  ...props
}: AvatarProps) {
  // Track image loading state
  const [isImageLoading, setIsImageLoading] = useState(!!imageUri);
  // Track if image failed to load
  const [imageError, setImageError] = useState(false);

  // Get size configuration
  const config = sizeConfig[size];

  // Determine if we should show the image or fallback
  const showImage = imageUri && !imageError;

  /**
   * Handle image load complete
   */
  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  /**
   * Handle image load error
   * Falls back to initials if image fails
   */
  const handleImageError = () => {
    setIsImageLoading(false);
    setImageError(true);
  };

  /**
   * Avatar Content
   *
   * Renders either:
   * - The profile image (if available and loaded)
   * - Initials fallback (if no image or image failed)
   * - Loading indicator (while image is loading)
   */
  const renderContent = () => {
    // Show image if available
    if (showImage) {
      return (
        <>
          <Image
            source={{ uri: imageUri }}
            className={cn('w-full h-full rounded-full')}
            onLoad={handleImageLoad}
            onError={handleImageError}
            resizeMode="cover"
          />
          {/* Show loading overlay while image loads */}
          {isImageLoading && (
            <View className="absolute inset-0 items-center justify-center bg-primary rounded-full">
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          )}
        </>
      );
    }

    // Show initials fallback
    return (
      <Text
        className={cn(
          'font-bold text-primary-foreground',
          config.textSize
        )}
      >
        {initials.substring(0, 2).toUpperCase()}
      </Text>
    );
  };

  /**
   * Edit Indicator
   *
   * A small circular badge in the bottom-right corner
   * indicating the avatar can be edited.
   * Uses a + icon on primary background.
   */
  const renderEditIndicator = () => {
    if (!showEditIndicator) return null;

    return (
      <View
        className={cn(
          'absolute bg-primary rounded-full items-center justify-center',
          'border-2 border-background',
          config.editIndicatorSize,
          config.editIndicatorOffset
        )}
      >
        <Plus
          size={config.editIconSize}
          color="#FFFFFF"
          strokeWidth={2.5}
        />
      </View>
    );
  };

  /**
   * Loading Overlay
   *
   * Shown when isLoading prop is true (e.g., during upload).
   * Semi-transparent overlay with spinner.
   */
  const renderLoadingOverlay = () => {
    if (!isLoading) return null;

    return (
      <View className="absolute inset-0 items-center justify-center bg-black/40 rounded-full">
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  };

  // Wrap in Pressable if onPress is provided
  const Container = onPress ? Pressable : View;

  return (
    <Container
      className={cn(
        'relative',
        config.containerSize,
        className
      )}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={
        onPress
          ? `Profile picture${showEditIndicator ? ', tap to edit' : ''}`
          : 'Profile picture'
      }
      {...props}
    >
      {/* Main Avatar Circle */}
      <View
        className={cn(
          'w-full h-full rounded-full items-center justify-center overflow-hidden',
          !showImage && 'bg-primary'
        )}
      >
        {renderContent()}
      </View>

      {/* Edit Indicator Badge */}
      {renderEditIndicator()}

      {/* Loading Overlay */}
      {renderLoadingOverlay()}
    </Container>
  );
}

/**
 * Helper function to get initials from a name
 *
 * @param name - Full name string
 * @returns 1-2 character initials
 *
 * @example
 * getInitials('John Doe') // 'JD'
 * getInitials('Alice') // 'A'
 * getInitials('john@email.com') // 'J'
 * getInitials('') // '?'
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';

  // If it looks like an email, use first letter before @
  if (name.includes('@')) {
    return name.split('@')[0].charAt(0).toUpperCase();
  }

  // Split by spaces and get first letter of each word
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    // Single word - return first letter
    return parts[0].charAt(0).toUpperCase();
  }

  // Multiple words - return first letter of first and last word
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export type { AvatarProps, AvatarSize };
