/**
 * ImagePickerSheet Component
 *
 * A specialized bottom sheet for selecting profile images.
 * Provides two options: "Choose from Library" and "Take Photo".
 *
 * WHY A DEDICATED COMPONENT?
 * - Encapsulates the image picker UI logic
 * - Reusable for any image selection flow
 * - Handles option rendering and callbacks
 * - Follows design system consistently
 *
 * USAGE:
 * This component works with the useImagePicker hook for the actual
 * image picking logic. This component just provides the UI.
 *
 * DESIGN SYSTEM:
 * - Uses our BottomSheet with proper styling
 * - Option rows with icons from Lucide
 * - Consistent spacing and typography
 */

import React, { forwardRef, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Image, Camera } from 'lucide-react-native';
import { BottomSheet, Text } from '@/components/ui';
import type { BottomSheetRef } from '@/components/ui/BottomSheet';
import { cn } from '@/utils';

/**
 * ImagePickerSheet Props
 *
 * @property onSelectGallery - Called when user selects "Choose from Library"
 * @property onSelectCamera - Called when user selects "Take Photo"
 * @property onClose - Called when sheet is closed
 */
interface ImagePickerSheetProps {
  /** Called when "Choose from Library" is selected */
  onSelectGallery: () => void;
  /** Called when "Take Photo" is selected */
  onSelectCamera: () => void;
  /** Called when sheet is closed (via backdrop or cancel) */
  onClose?: () => void;
}

/**
 * Option Item Interface
 *
 * Defines the structure for each option in the sheet.
 */
interface OptionItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
}

/**
 * ImagePickerSheet Component
 *
 * @example
 * ```tsx
 * function ProfileScreen() {
 *   const sheetRef = useRef<BottomSheetRef>(null);
 *   const { takePhoto, pickFromGallery } = useImagePicker();
 *
 *   const handleSelectGallery = async () => {
 *     sheetRef.current?.close();
 *     const result = await pickFromGallery();
 *     // Handle result...
 *   };
 *
 *   const handleSelectCamera = async () => {
 *     sheetRef.current?.close();
 *     const result = await takePhoto();
 *     // Handle result...
 *   };
 *
 *   return (
 *     <>
 *       <Avatar onPress={() => sheetRef.current?.expand()} />
 *       <ImagePickerSheet
 *         ref={sheetRef}
 *         onSelectGallery={handleSelectGallery}
 *         onSelectCamera={handleSelectCamera}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export const ImagePickerSheet = forwardRef<BottomSheetRef, ImagePickerSheetProps>(
  function ImagePickerSheet(
    { onSelectGallery, onSelectCamera, onClose },
    ref
  ) {
    /**
     * Options Array
     *
     * Defines the available options in the sheet.
     * Each option has an icon, label, description, and handler.
     */
    const options: OptionItem[] = [
      {
        id: 'gallery',
        label: 'Choose from Library',
        description: 'Select a photo from your gallery',
        icon: <Image size={24} color="#6B8E7B" strokeWidth={2} />,
        onPress: onSelectGallery,
      },
      {
        id: 'camera',
        label: 'Take Photo',
        description: 'Use camera to take a new photo',
        icon: <Camera size={24} color="#6B8E7B" strokeWidth={2} />,
        onPress: onSelectCamera,
      },
    ];

    /**
     * Render Option Row
     *
     * Each option is a pressable row with:
     * - Icon on the left
     * - Label and description text
     * - Subtle hover/press state
     */
    const renderOption = useCallback((option: OptionItem, isLast: boolean) => {
      return (
        <Pressable
          key={option.id}
          onPress={option.onPress}
          className={cn(
            'flex-row items-center py-4 px-2',
            'active:bg-muted/20 rounded-lg',
            !isLast && 'border-b border-border'
          )}
          accessibilityRole="button"
          accessibilityLabel={option.label}
          accessibilityHint={option.description}
        >
          {/* Icon Container */}
          <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
            {option.icon}
          </View>

          {/* Text Content */}
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">
              {option.label}
            </Text>
            <Text className="text-sm text-muted-foreground mt-0.5">
              {option.description}
            </Text>
          </View>
        </Pressable>
      );
    }, []);

    return (
      <BottomSheet
        ref={ref}
        snapPoints={['28%']}
        onClose={onClose}
        enablePanDownToClose
      >
        {/* Header */}
        <View className="mb-4">
          <Text variant="h4" className="text-foreground">
            Change Profile Photo
          </Text>
        </View>

        {/* Options List */}
        <View className="mt-2">
          {options.map((option, index) =>
            renderOption(option, index === options.length - 1)
          )}
        </View>
      </BottomSheet>
    );
  }
);

export type { ImagePickerSheetProps };
