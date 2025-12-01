/**
 * FullScreenModal Component
 *
 * A full-screen modal designed for complex forms and content.
 * Uses React Native's Modal with `presentationStyle="pageSheet"` to achieve
 * the same look as the article reading view.
 *
 * WHY THIS PATTERN?
 * =================
 * The pageSheet presentation style provides:
 * 1. ~90% screen height with rounded top corners (iOS)
 * 2. Underlying content slightly visible behind
 * 3. Smooth slide-up animation
 * 4. Native iOS feel that matches system modals
 * 5. Consistent behavior across iOS and Android
 *
 * COMPARISON TO BOTTOM SHEET:
 * - BottomSheetModal: Custom gesture-driven sheets with snap points
 * - Modal (pageSheet): Native iOS modal style, more polished appearance
 *
 * We use Modal here because the profile sub-screens need the same
 * polished appearance as the article reading view.
 *
 * USE CASES:
 * - Profile sub-screens (change email, change password, help, about)
 * - Any form that needs full attention
 * - Content that's too long for a partial sheet
 *
 * USAGE:
 * ```tsx
 * const modalRef = useRef<FullScreenModalRef>(null);
 *
 * // Open modal
 * modalRef.current?.present();
 *
 * // Close modal
 * modalRef.current?.dismiss();
 *
 * <FullScreenModal
 *   ref={modalRef}
 *   title="Change Email"
 *   onDismiss={() => console.log('closed')}
 * >
 *   <YourContent />
 * </FullScreenModal>
 * ```
 */

import React, {
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Text } from './Text';
import { colors } from '@/theme';

/**
 * FullScreenModal Props
 *
 * @property title - Header title displayed at the top
 * @property children - Content to render inside the modal
 * @property onDismiss - Called when modal is dismissed
 * @property showCloseButton - Whether to show the X button (default: true)
 * @property scrollable - Whether content should be scrollable (default: true)
 */
interface FullScreenModalProps {
  /** Title displayed in the modal header */
  title: string;
  /** Content to render inside the modal */
  children: React.ReactNode;
  /** Called when modal is dismissed */
  onDismiss?: () => void;
  /** Whether to show the close button (default: true) */
  showCloseButton?: boolean;
  /** Whether content should be scrollable (default: true) */
  scrollable?: boolean;
}

/**
 * Ref interface for controlling the modal
 *
 * Matches the same API as BottomSheetModal for compatibility:
 * - present(): Opens the modal
 * - dismiss(): Closes the modal
 */
export interface FullScreenModalRef {
  present: () => void;
  dismiss: () => void;
}

/**
 * FullScreenModal Component
 *
 * A full-screen modal with header, close button, and scrollable content.
 * Perfect for forms, settings screens, and content that needs full attention.
 *
 * Uses React Native's Modal with pageSheet presentation for a polished,
 * native-feeling appearance that matches the article reading view.
 */
export const FullScreenModal = forwardRef<FullScreenModalRef, FullScreenModalProps>(
  function FullScreenModal(
    {
      title,
      children,
      onDismiss,
      showCloseButton = true,
      scrollable = true,
    },
    ref
  ) {
    /**
     * Modal Visibility State
     *
     * Controlled internally via ref methods (present/dismiss).
     * This allows the same API as BottomSheetModal.
     */
    const [visible, setVisible] = useState(false);

    /**
     * Expose present() and dismiss() methods via ref
     *
     * This maintains API compatibility with the previous BottomSheetModal
     * implementation, so consumers don't need to change their code.
     */
    useImperativeHandle(ref, () => ({
      present: () => setVisible(true),
      dismiss: () => {
        setVisible(false);
        onDismiss?.();
      },
    }));

    /**
     * Close Handler
     *
     * Called when user taps the close button or swipes down (Android back).
     * Updates state and notifies parent via onDismiss callback.
     */
    const handleClose = useCallback(() => {
      setVisible(false);
      onDismiss?.();
    }, [onDismiss]);

    /**
     * Content Wrapper
     *
     * Conditionally wraps content in ScrollView or View
     * based on the scrollable prop.
     */
    const ContentWrapper = scrollable ? ScrollView : View;
    const contentWrapperProps = scrollable
      ? {
          style: styles.content,
          contentContainerStyle: styles.contentContainer,
          showsVerticalScrollIndicator: false,
          keyboardShouldPersistTaps: 'handled' as const,
        }
      : {
          style: [styles.content, styles.contentContainer],
        };

    return (
      <Modal
        /**
         * Modal Configuration
         *
         * visible: Controlled by internal state, updated via ref methods
         * animationType="slide": Smooth slide-up from bottom (matches article view)
         * presentationStyle="pageSheet": iOS-style sheet (~90% height, rounded corners)
         * onRequestClose: Android back button handler
         */
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        {/**
         * SafeAreaView Container
         *
         * Ensures content respects device safe areas:
         * - top: Status bar and notch (iPhone X+)
         * - bottom: Home indicator (iPhone X+)
         *
         * The pageSheet style on iOS already handles some of this,
         * but we still need SafeAreaView for the content padding.
         */}
        <SafeAreaView style={styles.container} edges={['bottom']}>
          {/**
           * KeyboardAvoidingView
           *
           * Adjusts content when keyboard appears.
           * Essential for forms (email, password, etc.)
           *
           * iOS: "padding" behavior works best with modals
           * Android: Modal already handles keyboard with adjustResize
           */}
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/**
             * Header Section
             *
             * Fixed at top with:
             * - Title centered
             * - Close button on the right
             * - Bottom border for separation
             *
             * Note: No safe area padding at top because pageSheet
             * already leaves space for the status bar.
             */}
            <View style={styles.header}>
              {/* Empty view for layout balance (mirrors close button space) */}
              <View style={styles.headerSide} />

              {/* Title */}
              <Text variant="h3" className="flex-1 text-center">
                {title}
              </Text>

              {/* Close Button */}
              <View style={styles.headerSide}>
                {showCloseButton && (
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Close"
                    accessibilityRole="button"
                  >
                    <X size={24} color={colors.foreground} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/**
             * Content Section
             *
             * The main content area that fills remaining space.
             * Wrapped in ScrollView if scrollable is true.
             */}
            <ContentWrapper {...contentWrapperProps}>
              {children}
            </ContentWrapper>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    );
  }
);

/**
 * Styles
 */
const styles = StyleSheet.create({
  /**
   * Container
   *
   * Full-screen container with app background color.
   */
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9', // warm off-white from design system
  },

  /**
   * KeyboardAvoidingView
   *
   * Fills available space so keyboard adjustment works properly.
   */
  keyboardView: {
    flex: 1,
  },

  /**
   * Header
   *
   * Fixed header with title and close button.
   * Uses flexbox for layout with title centered.
   */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E4', // border color from design system
    backgroundColor: '#FAFAF9',
  },

  /**
   * Header Side
   *
   * Container for close button (and empty space on left).
   * Fixed width ensures title stays centered.
   */
  headerSide: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /**
   * Close Button
   *
   * Touch target for the X icon.
   */
  closeButton: {
    padding: 8,
  },

  /**
   * Content
   *
   * Main content area that fills remaining space.
   */
  content: {
    flex: 1,
  },

  /**
   * Content Container
   *
   * Inner container for scroll content.
   * Provides consistent padding.
   */
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
});

export type { FullScreenModalProps };

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. MODAL vs BOTTOM SHEET
 *
 *    React Native's Modal component provides native modal behavior:
 *    - iOS: Respects system modal styles (pageSheet, formSheet, etc.)
 *    - Android: Full-screen overlay with back button handling
 *
 *    @gorhom/bottom-sheet provides custom gesture-driven sheets:
 *    - Snap points for multiple heights
 *    - Custom gesture handling
 *    - More control but requires more setup
 *
 *    We use Modal here because we want the polished pageSheet style.
 *
 * 2. presentationStyle OPTIONS
 *
 *    iOS supports several presentation styles:
 *    - "fullScreen": Covers entire screen
 *    - "pageSheet": Card-like with rounded corners (~90% height)
 *    - "formSheet": Centered card (iPad mainly)
 *    - "overFullScreen": Full coverage, content behind still renders
 *
 *    pageSheet is perfect for settings/forms - it feels native and
 *    keeps context (underlying screen slightly visible).
 *
 * 3. IMPERATIVE HANDLE PATTERN
 *
 *    useImperativeHandle lets us expose custom methods via ref:
 *    ```tsx
 *    useImperativeHandle(ref, () => ({
 *      present: () => setVisible(true),
 *      dismiss: () => setVisible(false),
 *    }));
 *    ```
 *
 *    This lets consumers call modalRef.current?.present() just like
 *    they would with BottomSheetModal, maintaining API compatibility.
 *
 * 4. KEYBOARD HANDLING
 *
 *    Forms in modals need keyboard handling:
 *    - iOS: KeyboardAvoidingView with behavior="padding"
 *    - Android: Modal handles this automatically with adjustResize
 *
 *    The behavior prop only applies to iOS; Android uses the window
 *    soft input mode setting.
 *
 * 5. SAFE AREAS IN MODALS
 *
 *    pageSheet on iOS already respects the top safe area (status bar),
 *    so we only need SafeAreaView with edges={['bottom']} for the
 *    home indicator area.
 *
 *    On Android, the modal is full-screen but SafeAreaView still
 *    helps with the content padding.
 *
 * 6. CLOSE HANDLING
 *
 *    Three ways to close the modal:
 *    - Close button (X) at top right
 *    - Android back button (onRequestClose)
 *    - Swipe down gesture (native on iOS pageSheet)
 *
 *    All paths call handleClose which updates state and fires onDismiss.
 */
