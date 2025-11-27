/**
 * BottomSheet Component
 *
 * A reusable bottom sheet component built on @gorhom/bottom-sheet.
 * Provides a smooth, gesture-driven sheet that slides up from the bottom.
 *
 * WHY BOTTOM SHEETS?
 * - Natural mobile interaction pattern
 * - Keeps user in context (doesn't navigate away)
 * - Great for options, confirmations, and forms
 * - Touch-friendly and gesture-enabled
 *
 * WHAT IS @gorhom/bottom-sheet?
 * A performant, gesture-driven bottom sheet library that:
 * - Uses React Native Reanimated for smooth animations
 * - Supports gesture handling (swipe to dismiss)
 * - Has snap points for different heights
 * - Works on both iOS and Android
 *
 * DESIGN SYSTEM COMPLIANCE:
 * - Background: bg-background (#FAFAF9)
 * - Handle: bg-muted (#78716C)
 * - Rounded corners: rounded-t-3xl (24px top corners)
 * - Shadow for elevation
 */

import React, { useCallback, useMemo, forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import BottomSheetLib, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import type { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { cn } from '@/utils';

/**
 * BottomSheet Props
 *
 * @property children - Content to render inside the sheet
 * @property snapPoints - Array of heights (e.g., ['25%', '50%'])
 * @property onClose - Called when sheet is dismissed
 * @property enablePanDownToClose - Allow swipe down to close
 * @property index - Initial snap point index (-1 = closed)
 * @property className - Additional styles for content container
 */
interface BottomSheetProps {
  children: React.ReactNode;
  /** Heights the sheet can snap to (default: ['25%']) */
  snapPoints?: (string | number)[];
  /** Called when sheet is fully closed */
  onClose?: () => void;
  /** Allow swipe down to dismiss (default: true) */
  enablePanDownToClose?: boolean;
  /** Initial snap point index, -1 = closed (default: 0) */
  index?: number;
  /** Additional styles for content container */
  className?: string;
  /** Show backdrop behind sheet (default: true) */
  showBackdrop?: boolean;
}

/**
 * BottomSheet Component
 *
 * A wrapper around @gorhom/bottom-sheet with our design system styling.
 * Use the ref to control the sheet programmatically.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const sheetRef = useRef<BottomSheetMethods>(null);
 *
 *   const openSheet = () => sheetRef.current?.expand();
 *   const closeSheet = () => sheetRef.current?.close();
 *
 *   return (
 *     <>
 *       <Button onPress={openSheet}>Open Sheet</Button>
 *       <BottomSheet
 *         ref={sheetRef}
 *         snapPoints={['25%', '50%']}
 *         onClose={() => console.log('Closed!')}
 *       >
 *         <Text>Sheet Content</Text>
 *       </BottomSheet>
 *     </>
 *   );
 * }
 * ```
 *
 * REF METHODS:
 * - snapToIndex(index) - Animate to specific snap point
 * - expand() - Expand to highest snap point
 * - collapse() - Collapse to lowest snap point
 * - close() - Close the sheet completely
 * - forceClose() - Close immediately without animation
 */
export const BottomSheet = forwardRef<BottomSheetMethods, BottomSheetProps>(
  function BottomSheet(
    {
      children,
      snapPoints = ['25%'],
      onClose,
      enablePanDownToClose = true,
      index = -1,
      className,
      showBackdrop = true,
    },
    ref
  ) {
    // Memoize snap points to prevent unnecessary re-renders
    // BottomSheet re-renders when snapPoints array reference changes
    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

    /**
     * Render Backdrop
     *
     * The backdrop is the semi-transparent overlay behind the sheet.
     * We customize it to:
     * - Fade in/out smoothly
     * - Close sheet when tapped (pressBehavior: 'close')
     * - Match our design system opacity
     */
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          // Backdrop starts appearing at index 0
          appearsOnIndex={0}
          // Backdrop fully disappears at index -1 (closed)
          disappearsOnIndex={-1}
          // Close when tapping backdrop
          pressBehavior="close"
          // Opacity when fully visible (0.5 = 50% black)
          opacity={0.5}
        />
      ),
      []
    );

    /**
     * Handle Sheet Changes
     *
     * Called whenever the sheet position changes.
     * Index -1 means the sheet is fully closed.
     */
    const handleSheetChanges = useCallback(
      (sheetIndex: number) => {
        // Call onClose when sheet reaches closed state
        if (sheetIndex === -1 && onClose) {
          onClose();
        }
      },
      [onClose]
    );

    return (
      <BottomSheetLib
        ref={ref}
        index={index}
        snapPoints={memoizedSnapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={showBackdrop ? renderBackdrop : undefined}
        // Style the sheet background
        backgroundStyle={styles.background}
        // Style the drag handle
        handleIndicatorStyle={styles.handleIndicator}
        // Enable content to be scrollable
        enableDynamicSizing={false}
      >
        <BottomSheetView
          className={cn('flex-1 px-4 pt-2 pb-8', className)}
        >
          {children}
        </BottomSheetView>
      </BottomSheetLib>
    );
  }
);

/**
 * Styles
 *
 * We use StyleSheet for some styles because:
 * - Background color needs to match our theme exactly
 * - Shadow properties work better with StyleSheet
 * - Handle indicator needs specific dimensions
 *
 * These could be converted to NativeWind when those features are supported.
 */
const styles = StyleSheet.create({
  /**
   * Sheet Background
   *
   * - Background color: #FAFAF9 (our background color)
   * - Rounded top corners: 24px radius
   * - Shadow for elevation effect
   */
  background: {
    backgroundColor: '#FAFAF9',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 16,
  },

  /**
   * Handle Indicator
   *
   * The small bar at the top that indicates the sheet is draggable.
   * - Centered, 40px wide, 4px tall
   * - Muted color from our palette
   * - Rounded pill shape
   */
  handleIndicator: {
    backgroundColor: '#A8A29E', // stone-400 - slightly lighter than muted
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});

/**
 * Export the ref type for consumers
 *
 * This allows TypeScript users to properly type their refs:
 * const sheetRef = useRef<BottomSheetRef>(null);
 */
export type BottomSheetRef = BottomSheetMethods;

export type { BottomSheetProps };
