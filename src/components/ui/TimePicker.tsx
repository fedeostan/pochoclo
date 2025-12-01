/**
 * TimePicker Component
 *
 * A modal bottom sheet for selecting a time for daily notification reminders.
 * Uses the native DateTimePicker for platform-appropriate time selection
 * wrapped in our design system's BottomSheetModal component.
 *
 * WHY A DEDICATED TIME PICKER COMPONENT?
 * - Encapsulates the complexity of time selection in one place
 * - Handles conversion between Date objects (for picker) and "HH:MM" strings (for storage)
 * - Provides a consistent UX across iOS and Android
 * - Follows the design system with proper styling
 *
 * WHY USE BottomSheetModal INSTEAD OF BottomSheet?
 * - BottomSheetModal renders ABOVE ALL other UI elements (including tab bar)
 * - Regular BottomSheet renders within its parent view hierarchy
 * - This ensures the time picker covers the entire screen for focused interaction
 * - Users won't accidentally tap navigation while selecting time
 *
 * COMPONENT ARCHITECTURE:
 * This component wraps @react-native-community/datetimepicker in our BottomSheetModal.
 * The picker itself is platform-specific:
 * - iOS: Shows an inline spinner-style picker
 * - Android: Shows a modal time picker dialog
 *
 * TIME FORMAT:
 * - Internal: Date object (for DateTimePicker)
 * - External (props): "HH:MM" string (for storage and display)
 * - Conversion helpers handle the translation
 *
 * USAGE:
 * ```tsx
 * const [showPicker, setShowPicker] = useState(false);
 * const [time, setTime] = useState('09:00');
 *
 * <TimePicker
 *   visible={showPicker}
 *   time={time}
 *   onSave={(newTime) => {
 *     setTime(newTime);
 *     setShowPicker(false);
 *   }}
 *   onCancel={() => setShowPicker(false)}
 * />
 * ```
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Platform } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import our design system components
// Using BottomSheetModal instead of BottomSheet so it renders ABOVE the tab bar
import { BottomSheetModal as BottomSheetModalComponent } from './BottomSheetModal';
import { Button } from './Button';
import { Text } from './Text';

/**
 * =============================================================================
 * TIME CONVERSION HELPERS
 * =============================================================================
 *
 * These functions convert between the "HH:MM" string format we use for storage
 * and the Date object format that DateTimePicker requires.
 */

/**
 * Convert "HH:MM" string to a Date object
 *
 * @param timeString - Time in "HH:MM" 24-hour format (e.g., "09:00", "14:30")
 * @returns Date object with today's date and the specified time
 *
 * WHY RETURN A DATE WITH TODAY'S DATE?
 * - DateTimePicker requires a full Date object
 * - We only care about hours and minutes
 * - The date portion is ignored for our purposes
 *
 * EXAMPLE:
 * timeStringToDate("14:30") => Date object set to today at 2:30 PM
 */
const timeStringToDate = (timeString: string): Date => {
  // Create a new Date for today
  const date = new Date();

  // Parse the time string
  // "14:30" -> ["14", "30"]
  const [hoursStr, minutesStr] = timeString.split(':');

  // parseInt with radix 10 for explicit decimal parsing
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  // Validate parsed values - fall back to 9:00 AM if invalid
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    console.warn('[TimePicker] Invalid time string:', timeString, '- using default 09:00');
    date.setHours(9, 0, 0, 0);
    return date;
  }

  // Set the time on the date object
  // setHours(hours, minutes, seconds, milliseconds)
  date.setHours(hours, minutes, 0, 0);

  return date;
};

/**
 * Convert a Date object to "HH:MM" string format
 *
 * @param date - Date object with the time to convert
 * @returns Time string in "HH:MM" 24-hour format
 *
 * WHY 24-HOUR FORMAT?
 * - Unambiguous (no AM/PM confusion)
 * - Easier to parse and compare
 * - Standard format for storage
 * - We convert to 12-hour display format in the UI
 *
 * EXAMPLE:
 * dateToTimeString(new Date('2024-01-01T14:30:00')) => "14:30"
 */
const dateToTimeString = (date: Date): string => {
  // Get hours and minutes
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Pad with zeros to ensure "09:05" not "9:5"
  // padStart(2, '0') ensures at least 2 characters, padding with '0'
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');

  return `${hoursStr}:${minutesStr}`;
};

/**
 * =============================================================================
 * COMPONENT PROPS
 * =============================================================================
 */

/**
 * TimePicker Props Interface
 *
 * @property visible - Whether the time picker is visible
 * @property time - Current time in "HH:MM" format
 * @property onSave - Called when user confirms their selection
 * @property onCancel - Called when user dismisses without saving
 */
export interface TimePickerProps {
  /**
   * Controls visibility of the time picker modal
   *
   * When true: Sheet expands and shows the picker
   * When false: Sheet is hidden
   */
  visible: boolean;

  /**
   * The currently selected time in "HH:MM" 24-hour format
   *
   * Examples: "09:00", "14:30", "20:00"
   * This is the initial value shown in the picker when opened.
   */
  time: string;

  /**
   * Called when user taps "Save Time"
   *
   * @param newTime - The selected time in "HH:MM" format
   *
   * Parent component should:
   * 1. Update state with new time
   * 2. Close the picker (set visible to false)
   * 3. Optionally persist to storage/reschedule notifications
   */
  onSave: (newTime: string) => void;

  /**
   * Called when user dismisses the picker without saving
   *
   * Parent component should close the picker (set visible to false).
   * Original time value is preserved.
   */
  onCancel: () => void;
}

/**
 * =============================================================================
 * TIMEPICKER COMPONENT
 * =============================================================================
 */

/**
 * TimePicker Component
 *
 * A modal bottom sheet for selecting notification time.
 * Wraps the native DateTimePicker in our design system's BottomSheet.
 *
 * COMPONENT BEHAVIOR:
 * 1. When visible becomes true, the sheet expands
 * 2. User sees description, time picker, and action buttons
 * 3. User can spin/select their preferred time
 * 4. "Save Time" confirms and calls onSave with new time
 * 5. "Cancel" dismisses without changes
 * 6. Swiping down also dismisses (calls onCancel)
 *
 * PLATFORM DIFFERENCES:
 * - iOS: Inline spinner that's always visible
 * - Android: Taps open a modal time picker dialog
 *
 * We handle these differences by always showing the picker inline
 * and using "spinner" display mode for consistent UX.
 */
export function TimePicker({
  visible,
  time,
  onSave,
  onCancel,
}: TimePickerProps) {
  // =========================================================================
  // SAFE AREA INSETS
  // =========================================================================

  /**
   * Get device safe area insets
   *
   * WHY DO WE NEED THIS?
   * Modern iPhones have a "home indicator" bar at the bottom (~34px).
   * Without accounting for this, content can be hidden behind it.
   * We use the bottom inset to add padding to our action buttons.
   */
  const insets = useSafeAreaInsets();

  // =========================================================================
  // REFS
  // =========================================================================

  /**
   * Reference to the BottomSheetModal for programmatic control
   *
   * We use this to:
   * - Present the modal when visible becomes true
   * - Dismiss the modal when user cancels or saves
   *
   * IMPORTANT: BottomSheetModal uses different methods than BottomSheet:
   * - present() instead of expand()
   * - dismiss() instead of close()
   */
  const modalRef = useRef<BottomSheetModal>(null);

  // =========================================================================
  // STATE
  // =========================================================================

  /**
   * Internal state for the selected time
   *
   * WHY INTERNAL STATE?
   * - DateTimePicker needs a Date object
   * - User might change the time multiple times before saving
   * - We only want to notify parent when user confirms
   * - Keeps the "draft" state local until saved
   */
  const [selectedDate, setSelectedDate] = useState<Date>(() => timeStringToDate(time));

  // =========================================================================
  // EFFECTS
  // =========================================================================

  /**
   * Sync internal state with prop when time prop changes
   *
   * This ensures that when the parent updates the time (e.g., loading from storage),
   * our internal state reflects that change.
   */
  useEffect(() => {
    setSelectedDate(timeStringToDate(time));
  }, [time]);

  /**
   * Control modal visibility based on visible prop
   *
   * When visible changes:
   * - true: Present the modal (show it)
   * - false: Dismiss the modal (hide it)
   *
   * IMPORTANT: BottomSheetModal uses different methods:
   * - present() to show (not expand())
   * - dismiss() to hide (not close())
   */
  useEffect(() => {
    if (visible) {
      // Reset to the current time prop when opening
      // This ensures user sees the correct starting time
      setSelectedDate(timeStringToDate(time));
      // Present after a short delay to ensure modal is ready
      // requestAnimationFrame ensures the DOM is updated
      requestAnimationFrame(() => {
        modalRef.current?.present();
      });
    } else {
      modalRef.current?.dismiss();
    }
  }, [visible, time]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  /**
   * Handle time selection in the picker
   *
   * @param event - The picker event (dismissed or set)
   * @param date - The selected date/time (undefined if dismissed)
   *
   * ANDROID NOTE:
   * On Android, the picker fires 'dismissed' if user taps outside.
   * On iOS, there's no dismiss event - user just picks a time.
   * We handle both cases here.
   */
  const handleTimeChange = useCallback((
    event: DateTimePickerEvent,
    date?: Date
  ) => {
    // On Android, 'dismissed' means user cancelled the picker
    // In that case, we do nothing (keep current selection)
    if (event.type === 'dismissed') {
      return;
    }

    // Update our internal state if a date was provided
    if (date) {
      setSelectedDate(date);
    }
  }, []);

  /**
   * Handle save button tap
   *
   * Converts the selected Date to "HH:MM" string and notifies parent.
   */
  const handleSave = useCallback(() => {
    // Convert Date to "HH:MM" string
    const newTime = dateToTimeString(selectedDate);

    // Notify parent
    onSave(newTime);
  }, [selectedDate, onSave]);

  /**
   * Handle modal dismiss (swipe down or backdrop tap)
   *
   * This is called by BottomSheetModal when it is dismissed via gesture.
   * We treat this as a cancel action.
   *
   * NOTE: For BottomSheetModal, this is called onDismiss (not onClose)
   */
  const handleModalDismiss = useCallback(() => {
    // Only call onCancel if we're supposed to be visible
    // This prevents double-calling when parent sets visible=false
    if (visible) {
      onCancel();
    }
  }, [visible, onCancel]);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <BottomSheetModalComponent
      ref={modalRef}
      snapPoints={['55%']}
      onDismiss={handleModalDismiss}
      enablePanDownToClose={true}
      showBackdrop={true}
    >
      {/**
       * Content Container
       *
       * Vertical layout with:
       * 1. Title
       * 2. Description text
       * 3. Time picker
       * 4. Action buttons
       */}
      <View className="flex-1 pt-2">
        {/* ----------------------------------------------------------------
            HEADER
            Title explaining what this picker is for
            ---------------------------------------------------------------- */}
        <Text variant="h3" className="text-center mb-2">
          Set Reminder Time
        </Text>

        {/* ----------------------------------------------------------------
            DESCRIPTION
            Explains what the notification will do
            ---------------------------------------------------------------- */}
        <Text
          variant="body"
          className="text-muted-foreground text-center mb-6 px-4"
        >
          Choose when you'd like to receive your daily learning reminder.
          We'll send you a gentle nudge to keep your streak going!
        </Text>

        {/* ----------------------------------------------------------------
            TIME PICKER
            Native date/time picker in "time" mode
            ---------------------------------------------------------------- */}
        <View className="items-center mb-6">
          {/**
           * DateTimePicker Component
           *
           * Props explained:
           * - value: The currently selected Date
           * - mode: "time" for time-only picker (no date)
           * - display: "spinner" for wheel-style picker
           * - onChange: Called when user selects a time
           * - minuteInterval: Steps between minutes (5 = 00, 05, 10...)
           *
           * PLATFORM STYLING:
           * iOS: Light background with dark text (matches our theme)
           * Android: Uses system theme
           */}
          <DateTimePicker
            value={selectedDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
            onChange={handleTimeChange}
            // 5-minute intervals make selection faster
            // Users rarely need precise minutes for reminders
            minuteInterval={5}
            // iOS specific: set text color
            // Android handles this automatically
            textColor="#1C1917"
          />
        </View>

        {/* ----------------------------------------------------------------
            ACTION BUTTONS
            Save (primary) and Cancel (ghost/text)

            NOTE: We add bottom padding using the safe area inset to ensure
            buttons are not hidden behind the iPhone home indicator.
            ---------------------------------------------------------------- */}
        <View className="px-4 gap-3" style={{ paddingBottom: insets.bottom + 8 }}>
          {/**
           * Save Button
           *
           * Primary action - saves the selected time.
           * Uses our Button component with "default" variant (which is the primary style).
           *
           * NOTE: In our Button component, "default" is the primary filled style,
           * not "primary" - this follows shadcn/ui naming conventions.
           */}
          <Button
            variant="default"
            onPress={handleSave}
            className="w-full"
          >
            Save Time
          </Button>

          {/**
           * Cancel Button
           *
           * Secondary action - dismisses without saving.
           * Uses ghost variant for less visual weight.
           */}
          <Button
            variant="ghost"
            onPress={onCancel}
            className="w-full"
          >
            Cancel
          </Button>
        </View>
      </View>
    </BottomSheetModalComponent>
  );
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. TIME FORMAT STRATEGY
 *
 *    We use "HH:MM" strings for storage and props because:
 *    - Simple to store in Firestore
 *    - Easy to compare ("09:00" < "14:00")
 *    - Human-readable in logs/debugging
 *    - Timezone-independent (always local time)
 *
 *    The DateTimePicker needs Date objects, so we convert
 *    at the boundary (in this component).
 *
 * 2. CONTROLLED vs UNCONTROLLED
 *
 *    This component uses a semi-controlled pattern:
 *    - Props control the INITIAL value and visibility
 *    - Internal state tracks user selections (draft)
 *    - Only on "Save" do we notify the parent
 *
 *    This prevents unnecessary re-renders and state updates
 *    while user is making their selection.
 *
 * 3. PLATFORM DIFFERENCES
 *
 *    DateTimePicker behaves differently on each platform:
 *
 *    iOS:
 *    - Renders inline as a spinner
 *    - User spins to select time
 *    - No separate "confirm" (value updates live)
 *
 *    Android:
 *    - Can show as dialog or spinner
 *    - Dialog has OK/Cancel buttons
 *    - We use "spinner" for consistency
 *
 *    Our BottomSheet wrapper provides consistent behavior
 *    on both platforms with explicit Save/Cancel buttons.
 *
 * 4. MINUTE INTERVAL
 *
 *    We set minuteInterval={5} because:
 *    - Faster selection (fewer options)
 *    - Most people don't need exact minutes
 *    - "9:00 AM" is more common than "9:07 AM"
 *    - Better UX for reminders
 *
 * 5. REFS AND EFFECTS FOR VISIBILITY
 *
 *    We control the BottomSheetModal via ref instead of props because:
 *    - BottomSheetModal manages its own animation state
 *    - present()/dismiss() triggers smooth animations
 *    - The useEffect watching `visible` bridges our prop-based API
 *      with the ref-based modal control
 *
 *    IMPORTANT: BottomSheetModal uses different methods than BottomSheet:
 *    - present() to show (not expand())
 *    - dismiss() to hide (not close())
 *
 * 6. WHY BottomSheetModal INSTEAD OF BottomSheet?
 *
 *    Regular BottomSheet renders within its parent view hierarchy,
 *    which means it appears BEHIND tab bars and navigation.
 *
 *    BottomSheetModal uses a "portal" pattern to render at the ROOT level,
 *    above ALL other UI elements. This ensures:
 *    - Modal covers the entire screen (including tab bar)
 *    - User focus is on the time picker
 *    - No accidental navigation taps
 *    - Proper modal behavior users expect from other apps
 *
 *    Requires BottomSheetModalProvider at app root (see app/_layout.tsx).
 *
 * 7. DESIGN SYSTEM COMPLIANCE
 *
 *    This component follows our design system:
 *    - Uses bg-background (from BottomSheetModal)
 *    - Text uses our Text component with proper variants
 *    - Buttons use our Button component
 *    - Spacing follows Tailwind scale (mb-6, px-4)
 *    - Rounded corners inherited from BottomSheetModal
 *
 * 8. ACCESSIBILITY CONSIDERATIONS
 *
 *    - DateTimePicker is natively accessible
 *    - Screen readers announce selected time
 *    - Buttons have clear labels
 *    - Description explains the feature's purpose
 *    - Users can dismiss via swipe (motor accessibility)
 *    - BottomSheetModal traps focus within the modal
 */
