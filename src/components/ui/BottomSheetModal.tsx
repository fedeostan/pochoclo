/**
 * BottomSheetModal Component
 *
 * A modal variant of our BottomSheet that renders ABOVE ALL other UI elements,
 * including navigation bars and tab bars.
 *
 * WHY TWO BOTTOM SHEET COMPONENTS?
 *
 * 1. BottomSheet (regular):
 *    - Renders within its parent view hierarchy
 *    - Good for inline sheets that are part of a screen
 *    - Appears BEHIND tab bars and navigation
 *
 * 2. BottomSheetModal (this component):
 *    - Uses a "portal" to render at the root level
 *    - Appears ABOVE everything (including tab bars)
 *    - Good for modal interactions that need full attention
 *
 * WHEN TO USE WHICH?
 *
 * Use BottomSheetModal when:
 * - The sheet should cover the entire screen including navigation
 * - You need focused user attention (e.g., time picker, image picker)
 * - The sheet represents a blocking/modal interaction
 *
 * Use regular BottomSheet when:
 * - The sheet is part of the screen's content flow
 * - Navigation should remain visible
 * - The sheet is secondary to main content
 *
 * REQUIREMENTS:
 * - App must be wrapped with BottomSheetModalProvider (see app/_layout.tsx)
 * - Must be inside GestureHandlerRootView
 *
 * API DIFFERENCES FROM BottomSheet:
 * - Uses present() instead of expand() to show
 * - Uses dismiss() instead of close() to hide
 * - Ref type is BottomSheetModal (not BottomSheetMethods)
 */

import React, { useCallback, useMemo, forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  BottomSheetModal as BottomSheetModalLib,
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import type { BottomSheetModal as BottomSheetModalType } from '@gorhom/bottom-sheet';
import { cn } from '@/utils';

/**
 * BottomSheetModal Props
 *
 * Similar to BottomSheet props, with the same styling options.
 *
 * @property children - Content to render inside the modal
 * @property snapPoints - Array of heights (e.g., ['25%', '50%'])
 * @property onDismiss - Called when modal is dismissed
 * @property enablePanDownToClose - Allow swipe down to close
 * @property className - Additional styles for content container
 */
interface BottomSheetModalProps {
  children: React.ReactNode;
  /** Heights the modal can snap to (default: ['25%']) */
  snapPoints?: (string | number)[];
  /** Called when modal is dismissed (via gesture, backdrop tap, or dismiss()) */
  onDismiss?: () => void;
  /** Allow swipe down to dismiss (default: true) */
  enablePanDownToClose?: boolean;
  /** Additional styles for content container */
  className?: string;
  /** Show backdrop behind modal (default: true) */
  showBackdrop?: boolean;
}

/**
 * BottomSheetModal Component
 *
 * A modal bottom sheet that renders above all other UI elements.
 * Requires BottomSheetModalProvider in the component tree.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const modalRef = useRef<BottomSheetModalRef>(null);
 *
 *   // IMPORTANT: Use present()/dismiss(), NOT expand()/close()
 *   const openModal = () => modalRef.current?.present();
 *   const closeModal = () => modalRef.current?.dismiss();
 *
 *   return (
 *     <>
 *       <Button onPress={openModal}>Open Modal</Button>
 *       <BottomSheetModal
 *         ref={modalRef}
 *         snapPoints={['25%', '50%']}
 *         onDismiss={() => console.log('Dismissed!')}
 *       >
 *         <Text>Modal Content - appears above tab bar!</Text>
 *       </BottomSheetModal>
 *     </>
 *   );
 * }
 * ```
 *
 * REF METHODS:
 * - present() - Show the modal (animates in)
 * - dismiss() - Hide the modal (animates out)
 * - snapToIndex(index) - Animate to specific snap point
 * - expand() - Expand to highest snap point (while visible)
 * - collapse() - Collapse to lowest snap point
 */
export const BottomSheetModal = forwardRef<BottomSheetModalType, BottomSheetModalProps>(
  function BottomSheetModal(
    {
      children,
      snapPoints = ['25%'],
      onDismiss,
      enablePanDownToClose = true,
      className,
      showBackdrop = true,
    },
    ref
  ) {
    // Memoize snap points to prevent unnecessary re-renders
    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

    /**
     * Render Backdrop
     *
     * The backdrop is the semi-transparent overlay behind the modal.
     * When tapped, it dismisses the modal.
     *
     * IMPORTANT: For modals, the backdrop typically covers the ENTIRE screen,
     * including areas that would normally be behind navigation bars.
     */
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          // Backdrop appears immediately when modal is presented
          appearsOnIndex={0}
          // Backdrop disappears when modal is fully dismissed
          disappearsOnIndex={-1}
          // Tap backdrop to dismiss
          pressBehavior="close"
          // Opacity when fully visible (0.5 = 50% black overlay)
          opacity={0.5}
        />
      ),
      []
    );

    return (
      <BottomSheetModalLib
        ref={ref}
        snapPoints={memoizedSnapPoints}
        onDismiss={onDismiss}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={showBackdrop ? renderBackdrop : undefined}
        // Style the modal background (matches regular BottomSheet)
        backgroundStyle={styles.background}
        // Style the drag handle
        handleIndicatorStyle={styles.handleIndicator}
        // Disable dynamic sizing (we use explicit snap points)
        enableDynamicSizing={false}
      >
        <BottomSheetView
          className={cn('flex-1 px-4 pt-2 pb-8', className)}
        >
          {children}
        </BottomSheetView>
      </BottomSheetModalLib>
    );
  }
);

/**
 * Styles
 *
 * Identical to regular BottomSheet for visual consistency.
 * The only difference is in rendering behavior (portal vs inline).
 */
const styles = StyleSheet.create({
  /**
   * Modal Background
   *
   * - Background color: #FAFAF9 (our background color)
   * - Rounded top corners: 24px radius
   * - Shadow for elevation effect
   */
  background: {
    backgroundColor: '#FAFAF9',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // IMPORTANT: overflow: 'hidden' is required for Android to properly
    // clip content to the border radius. Without this, Android may show
    // square corners even with borderRadius set.
    overflow: 'hidden',
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
   * The small bar at the top that indicates the modal is draggable.
   */
  handleIndicator: {
    backgroundColor: '#A8A29E', // stone-400
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});

/**
 * Export the ref type for consumers
 *
 * This allows TypeScript users to properly type their refs:
 * const modalRef = useRef<BottomSheetModalRef>(null);
 */
export type BottomSheetModalRef = BottomSheetModalType;

export type { BottomSheetModalProps };

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. PORTAL PATTERN
 *
 *    This component uses the "portal" pattern to render content outside
 *    its parent's DOM/view hierarchy. In web development, this is similar
 *    to React's createPortal(). In React Native, @gorhom/bottom-sheet
 *    achieves this through BottomSheetModalProvider.
 *
 *    Provider creates a "portal container" at the root level.
 *    When you call present(), the modal renders into that container,
 *    not where the component is placed in the tree.
 *
 * 2. present() vs expand()
 *
 *    Regular BottomSheet:
 *    - expand(): Makes sheet visible, animates to highest snap point
 *    - close(): Hides the sheet
 *
 *    BottomSheetModal:
 *    - present(): Makes modal visible (adds to portal, then animates)
 *    - dismiss(): Hides modal (animates out, then removes from portal)
 *
 *    This distinction matters because modal needs to be "mounted" to the
 *    portal container first before it can animate.
 *
 * 3. WHY SAME STYLING?
 *
 *    We keep the styling identical between BottomSheet and BottomSheetModal
 *    so they look the same to users. The only difference is WHERE they render
 *    (inline vs portal), not how they appear.
 *
 * 4. BACKDROP BEHAVIOR
 *
 *    The backdrop for a modal typically covers the entire screen because
 *    the modal itself renders above everything. This ensures:
 *    - User can't accidentally interact with content behind
 *    - Visual focus is on the modal content
 *    - Tapping outside dismisses (standard modal behavior)
 *
 * 5. WHEN THINGS GO WRONG
 *
 *    Common errors:
 *    - "BottomSheetModalProvider not found": Forgot to wrap app with provider
 *    - Modal not appearing: Using expand() instead of present()
 *    - Modal appears but can't dismiss: Using close() instead of dismiss()
 *
 * 6. ACCESSIBILITY
 *
 *    Modal bottom sheets should:
 *    - Trap focus within the modal (library handles this)
 *    - Be announced to screen readers
 *    - Be dismissible via gesture (swipe down)
 *    - Be dismissible via backdrop tap
 *    - Return focus when dismissed (requires manual implementation if needed)
 */
