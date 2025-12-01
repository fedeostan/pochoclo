/**
 * Profile Screen - User Account Tab
 *
 * This screen is the central hub for user-related settings and account management.
 * It follows mobile UX best practices with a clear information hierarchy:
 *
 * 1. IDENTITY (Profile Header) - Who am I?
 * 2. PERSONALIZATION (My Learning) - How do I customize my experience?
 * 3. NOTIFICATIONS - How do I stay engaged?
 * 4. ACCOUNT - How do I manage my account?
 * 5. SUPPORT - Help when I need it
 * 6. SIGN OUT - Destructive action at bottom
 *
 * DESIGN PRINCIPLES:
 * - Grouped list pattern: Settings organized into logical sections
 * - Clear visual hierarchy: Important items first
 * - Consistent interactions: Navigation items show chevrons, toggles show switches
 * - Accessibility: Touch targets meet 44pt minimum, proper labels
 *
 * WHAT WAS REMOVED (from previous version):
 * - Firebase UID display (internal technical data)
 * - Duplicate email/name in Account Details card
 * - "Coming Soon" placeholder
 * These were removed because users don't need to see technical data.
 */

import { useRef, useEffect, useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Bell,
  Clock, // For reminder time row
  Mail,
  Lock,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Info,
  LogOut,
} from 'lucide-react-native';

// UI Components
import { Text, Button, TimePicker } from '@/components/ui';
// Use BottomSheetModalRef because ImagePickerSheet now uses BottomSheetModal
import type { BottomSheetModalRef } from '@/components/ui/BottomSheetModal';

// Profile-specific components
import {
  ProfileHeader,
  SettingsSection,
  SettingsItem,
  // Modal components for profile sub-screens
  ChangeEmailModal,
  ChangePasswordModal,
  EditPreferencesModal,
  HelpModal,
  AboutModal,
} from '@/components/profile';
import type {
  ChangeEmailModalRef,
  ChangePasswordModalRef,
  EditPreferencesModalRef,
  HelpModalRef,
  AboutModalRef,
} from '@/components/profile';

// Preferences helpers
import {
  getCategoryDisplayName,
  PREDEFINED_TIME_OPTIONS,
} from '@/types/preferences';

// ImagePickerSheet - Bottom sheet for choosing camera vs gallery
import { ImagePickerSheet } from '@/components/ImagePickerSheet';

// Custom hook for image selection with permission handling
import { useImagePicker } from '@/hooks/useImagePicker';

// Redux state management
import { useAppDispatch, useAppSelector } from '@/store';
import {
  signOut,
  updateUserProfileImage,
  clearProfileImageError,
} from '@/store/slices/authSlice';

// Notification Redux actions
// These actions update the notification state in Redux
import {
  setNotificationEnabled,
  setNotificationTime,
  setNotificationPermissionStatus,
  saveNotificationPreferencesAsync,
} from '@/store/slices/userPreferencesSlice';

// Notification service functions
// These handle the actual Expo notification operations
import {
  requestNotificationPermission,
  scheduleDailyNotification,
  cancelDailyNotification,
  getNotificationPermissionStatus,
} from '@/services/notificationService';

// Default notification preferences for fallback values
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/types/preferences';

// Theme colors for icons
import { colors } from '@/theme';

// App version - we'll get this from app config
import Constants from 'expo-constants';

/**
 * Get the app version string
 * Falls back to '1.0.0' if not available
 */
function getAppVersion(): string {
  return Constants.expoConfig?.version || '1.0.0';
}

/**
 * ProfileScreen Component
 *
 * The main profile screen with organized settings sections.
 */
export default function ProfileScreen() {
  // ==========================================================================
  // TRANSLATION
  // ==========================================================================

  /**
   * Translation Hook
   *
   * useTranslation('profile') loads translations from the 'profile' namespace.
   * We also use 'common' for shared button text and error messages.
   */
  const { t } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');

  // ==========================================================================
  // REDUX STATE
  // ==========================================================================

  const dispatch = useAppDispatch();

  // Auth state: user info and loading states
  const { user, loading, profileImageLoading, profileImageError } = useAppSelector(
    (state) => state.auth
  );

  // User preferences: categories, daily learning time, and notifications
  // We destructure notifications separately for clearer access
  const {
    categories,
    dailyLearningMinutes,
    onboardingCompleted,
    notifications, // Notification preferences from Redux
  } = useAppSelector((state) => state.userPreferences);

  // ==========================================================================
  // LOCAL STATE
  // ==========================================================================

  /**
   * Controls visibility of the TimePicker modal
   *
   * This is local UI state - it only matters for showing/hiding the picker.
   * The actual time value comes from Redux (notifications.time).
   */
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ==========================================================================
  // REFS
  // ==========================================================================

  // Ref for controlling the image picker bottom sheet modal
  // IMPORTANT: Uses BottomSheetModalRef (not BottomSheetRef) because
  // ImagePickerSheet now uses BottomSheetModal for proper z-index
  const imagePickerSheetRef = useRef<BottomSheetModalRef>(null);

  // Refs for profile sub-screen modals
  // These modals replace navigation to separate screens
  // Using modals ensures pressing "back" always returns to Profile
  const changeEmailModalRef = useRef<ChangeEmailModalRef>(null);
  const changePasswordModalRef = useRef<ChangePasswordModalRef>(null);
  const editPreferencesModalRef = useRef<EditPreferencesModalRef>(null);
  const helpModalRef = useRef<HelpModalRef>(null);
  const aboutModalRef = useRef<AboutModalRef>(null);

  // ==========================================================================
  // HOOKS
  // ==========================================================================

  // Image picker hook for avatar changes
  const { takePhoto, pickFromGallery, isLoading: isImagePickerLoading } = useImagePicker();

  // Combined loading state for avatar
  const isLoadingImage = isImagePickerLoading || profileImageLoading;

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  /**
   * Check notification permission status on mount
   *
   * WHY CHECK ON MOUNT?
   * - User might have changed permissions in system settings
   * - We need to know current status to show correct UI
   * - Permission is device-specific, not stored in Firestore
   *
   * This effect runs once when the profile screen loads and syncs
   * the current OS permission status with our Redux state.
   */
  useEffect(() => {
    const checkPermissionStatus = async () => {
      // Get the current permission status from the OS
      const status = await getNotificationPermissionStatus();

      // Update Redux with the current status
      // This ensures our UI reflects reality (e.g., if user disabled in Settings)
      dispatch(setNotificationPermissionStatus(status));
    };

    checkPermissionStatus();
  }, [dispatch]);

  /**
   * Show error alert when profile image upload fails
   */
  useEffect(() => {
    if (profileImageError) {
      Alert.alert(
        t('alerts.uploadFailed'),
        profileImageError,
        [
          {
            text: tCommon('button.ok'),
            onPress: () => dispatch(clearProfileImageError()),
          },
        ]
      );
    }
  }, [profileImageError, dispatch, t, tCommon]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  /**
   * Open the image picker modal when avatar is tapped
   *
   * IMPORTANT: Use present() not expand() for BottomSheetModal!
   * - expand(): Used by regular BottomSheet
   * - present(): Used by BottomSheetModal (adds to portal, then animates)
   */
  const handleAvatarPress = () => {
    imagePickerSheetRef.current?.present();
  };

  /**
   * Handle gallery selection for avatar
   *
   * IMPORTANT: Use dismiss() not close() for BottomSheetModal!
   */
  const handleSelectGallery = async () => {
    imagePickerSheetRef.current?.dismiss();
    const result = await pickFromGallery();
    if (result.success) {
      dispatch(updateUserProfileImage({ imageUri: result.uri }));
    }
  };

  /**
   * Handle camera selection for avatar
   *
   * IMPORTANT: Use dismiss() not close() for BottomSheetModal!
   */
  const handleSelectCamera = async () => {
    imagePickerSheetRef.current?.dismiss();
    const result = await takePhoto();
    if (result.success) {
      dispatch(updateUserProfileImage({ imageUri: result.uri }));
    }
  };

  /**
   * Handle image picker sheet close
   */
  const handleSheetClose = () => {
    // Optional cleanup
  };

  /**
   * Open the Edit Preferences modal
   *
   * MODAL APPROACH:
   * Instead of navigating to a separate screen, we present a full-screen
   * bottom sheet modal. This solves the back navigation issue because:
   * - Modals don't affect the navigation stack
   * - Dismissing always returns to exactly where we were (Profile)
   * - Better UX: modal slides up, making the action feel contained
   */
  const handleEditPreferences = () => {
    editPreferencesModalRef.current?.present();
  };

  /**
   * Toggle daily reminder notifications on/off
   *
   * This is the main handler for the notification toggle switch.
   * It handles both enabling and disabling notifications.
   *
   * ENABLING FLOW:
   * 1. Check current permission status
   * 2. If undetermined, request permission (shows pre-permission alert)
   * 3. If denied, show message directing to Settings
   * 4. If granted, schedule the notification
   * 5. Update Redux state
   * 6. Persist to Firestore
   *
   * DISABLING FLOW:
   * 1. Cancel any scheduled notification
   * 2. Update Redux state
   * 3. Persist to Firestore
   *
   * @param enabled - Whether user wants notifications enabled
   */
  const handleToggleReminder = async (enabled: boolean) => {
    // Get the current notification time (use default if not set)
    const notificationTime = notifications.time ?? DEFAULT_NOTIFICATION_PREFERENCES.time ?? '09:00';

    if (enabled) {
      // -----------------------------------------------------------------------
      // ENABLING NOTIFICATIONS
      // -----------------------------------------------------------------------

      try {
        // Step 1: Request permission (handles all permission states internally)
        // This function:
        // - Returns true immediately if already granted
        // - Shows pre-permission alert if undetermined, then requests
        // - Shows "go to Settings" alert if previously denied
        const granted = await requestNotificationPermission();

        // Update permission status in Redux
        const newStatus = await getNotificationPermissionStatus();
        dispatch(setNotificationPermissionStatus(newStatus));

        if (!granted) {
          // Permission not granted - don't enable notifications
          // The requestNotificationPermission function already showed an appropriate alert
          console.log('[Profile] Notification permission not granted');
          return;
        }

        // Step 2: Permission granted - schedule the notification
        await scheduleDailyNotification(notificationTime);

        // Step 3: Update Redux state (optimistically)
        dispatch(setNotificationEnabled(true));

        // Step 4: Persist to Firestore
        if (user?.uid) {
          dispatch(saveNotificationPreferencesAsync({
            userId: user.uid,
            notifications: {
              enabled: true,
              time: notificationTime,
            },
          }));
        }

        console.log('[Profile] Notifications enabled at', notificationTime);

      } catch (error) {
        // Handle any errors during the enable process
        console.error('[Profile] Error enabling notifications:', error);
        Alert.alert(
          t('alerts.errorTitle'),
          t('notifications.errorEnable'),
          [{ text: tCommon('button.ok') }]
        );
      }
    } else {
      // -----------------------------------------------------------------------
      // DISABLING NOTIFICATIONS
      // -----------------------------------------------------------------------

      try {
        // Step 1: Cancel any scheduled notification
        await cancelDailyNotification();

        // Step 2: Update Redux state
        dispatch(setNotificationEnabled(false));

        // Step 3: Persist to Firestore (keep the time for when user re-enables)
        if (user?.uid) {
          dispatch(saveNotificationPreferencesAsync({
            userId: user.uid,
            notifications: {
              enabled: false,
              time: notificationTime, // Preserve time preference
            },
          }));
        }

        console.log('[Profile] Notifications disabled');

      } catch (error) {
        console.error('[Profile] Error disabling notifications:', error);
        // Still update UI even if cancel failed (notification might not have existed)
        dispatch(setNotificationEnabled(false));
      }
    }
  };

  /**
   * Handle tapping on the notification time
   *
   * Opens the TimePicker modal so user can change when they receive reminders.
   * Only opens if notifications are enabled (otherwise time is irrelevant).
   */
  const handleTimePress = () => {
    // Only allow changing time if notifications are enabled
    if (notifications.enabled) {
      setShowTimePicker(true);
    }
  };

  /**
   * Handle saving a new notification time
   *
   * Called when user confirms their time selection in the TimePicker.
   *
   * FLOW:
   * 1. Close the picker
   * 2. Update Redux state with new time
   * 3. Reschedule the notification at the new time
   * 4. Persist to Firestore
   *
   * @param newTime - The selected time in "HH:MM" format
   */
  const handleTimeSave = async (newTime: string) => {
    // Close the picker first for responsive UI
    setShowTimePicker(false);

    try {
      // Update Redux state immediately (optimistic update)
      dispatch(setNotificationTime(newTime));

      // Reschedule the notification at the new time
      // This cancels the old one and schedules a new one
      if (notifications.enabled) {
        await scheduleDailyNotification(newTime);
      }

      // Persist to Firestore
      if (user?.uid) {
        dispatch(saveNotificationPreferencesAsync({
          userId: user.uid,
          notifications: {
            enabled: notifications.enabled,
            time: newTime,
          },
        }));
      }

      console.log('[Profile] Notification time updated to', newTime);

    } catch (error) {
      console.error('[Profile] Error updating notification time:', error);
      Alert.alert(
        t('alerts.errorTitle'),
        t('notifications.errorTime'),
        [{ text: tCommon('button.ok') }]
      );
    }
  };

  /**
   * Handle canceling the TimePicker
   *
   * Just closes the picker without making any changes.
   */
  const handleTimeCancel = () => {
    setShowTimePicker(false);
  };

  /**
   * Open the Change Email modal
   *
   * Presents a full-screen modal for email change form.
   * Using modal instead of navigation ensures proper back behavior.
   */
  const handleChangeEmail = () => {
    changeEmailModalRef.current?.present();
  };

  /**
   * Open the Change Password modal
   *
   * Presents a full-screen modal for password change form.
   * Using modal instead of navigation ensures proper back behavior.
   */
  const handleChangePassword = () => {
    changePasswordModalRef.current?.present();
  };

  /**
   * Open the Help & FAQ modal
   *
   * Presents a full-screen modal with FAQ content.
   * Using modal instead of navigation ensures proper back behavior.
   */
  const handleHelp = () => {
    helpModalRef.current?.present();
  };

  /**
   * Open email client for feedback
   */
  const handleSendFeedback = async () => {
    const email = 'feedback@pochoclo.app';
    const subject = encodeURIComponent('POCHOCLO App Feedback');
    const mailtoUrl = `mailto:${email}?subject=${subject}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          t('alerts.cannotOpenEmail'),
          t('alerts.emailFallback')
        );
      }
    } catch {
      Alert.alert(
        t('alerts.errorTitle'),
        t('alerts.errorOpenEmail')
      );
    }
  };

  /**
   * Open the About modal
   *
   * Presents a full-screen modal with app information.
   * Using modal instead of navigation ensures proper back behavior.
   */
  const handleAbout = () => {
    aboutModalRef.current?.present();
  };

  /**
   * Sign out the user
   */
  const handleSignOut = async () => {
    try {
      await dispatch(signOut()).unwrap();
      router.replace('/welcome');
    } catch {
      // Error handled in Redux
    }
  };

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  /**
   * Convert 24-hour time string to 12-hour display format
   *
   * Takes a time in "HH:MM" format and returns a human-readable string
   * like "9:00 AM" or "2:30 PM".
   *
   * WHY THIS CONVERSION?
   * - We store time in 24-hour format for simplicity and unambiguity
   * - But users prefer reading time in 12-hour format with AM/PM
   * - This bridges the gap between storage and display
   *
   * @param time24 - Time in "HH:MM" 24-hour format (e.g., "09:00", "14:30")
   * @returns Time in 12-hour format with AM/PM (e.g., "9:00 AM", "2:30 PM")
   *
   * EXAMPLES:
   * formatTimeForDisplay("09:00") => "9:00 AM"
   * formatTimeForDisplay("14:30") => "2:30 PM"
   * formatTimeForDisplay("00:00") => "12:00 AM" (midnight)
   * formatTimeForDisplay("12:00") => "12:00 PM" (noon)
   */
  const formatTimeForDisplay = (time24: string): string => {
    // Split the time string and convert to numbers
    const [hoursStr, minutesStr] = time24.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    // Determine AM or PM based on hour
    // Hours 0-11 are AM, hours 12-23 are PM
    const period = hours >= 12 ? 'PM' : 'AM';

    // Convert 24-hour to 12-hour format
    // - 0 becomes 12 (midnight)
    // - 13-23 become 1-11 (afternoon/evening)
    // - 1-11 stay the same (morning)
    // - 12 stays 12 (noon)
    const hours12 = hours % 12 || 12;

    // Format minutes with leading zero (padStart ensures "05" not "5")
    const minutesFormatted = minutes.toString().padStart(2, '0');

    return `${hours12}:${minutesFormatted} ${period}`;
  };

  /**
   * Get the subtitle text for the notifications setting item
   *
   * Shows the formatted time when enabled, or "Disabled" when off.
   * The time is tappable when enabled to allow changing it.
   *
   * @returns Display string for notification subtitle
   */
  const getNotificationSubtitle = (): string => {
    if (!notifications.enabled) {
      return t('status.disabled');
    }

    // Get the time, falling back to default if not set
    const time = notifications.time ?? DEFAULT_NOTIFICATION_PREFERENCES.time ?? '09:00';
    return formatTimeForDisplay(time);
  };

  /**
   * Get display label for daily learning time
   */
  const getTimeDisplayLabel = (minutes: number | null): string => {
    if (minutes === null) return t('status.notSet');

    const predefined = PREDEFINED_TIME_OPTIONS.find(opt => opt.minutes === minutes);
    if (predefined) {
      return predefined.label;
    }

    return t('time.minutesDay', { count: minutes });
  };

  /**
   * Build subtitle for Learning Preferences item
   * Shows first 2-3 categories + time
   */
  const getLearningPreferencesSubtitle = (): string => {
    if (!onboardingCompleted) return t('status.notConfigured');

    const categoryNames = categories
      .slice(0, 2)
      .map(cat => getCategoryDisplayName(cat));

    const categoryText = categories.length > 2
      ? `${categoryNames.join(', ')} +${categories.length - 2}`
      : categoryNames.join(', ');

    const timeText = getTimeDisplayLabel(dailyLearningMinutes);

    return `${categoryText} • ${timeText}`;
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-4 py-6">
          {/* ================================================================
              PROFILE HEADER
              Shows avatar, name, email, and member since date
              ================================================================ */}
          <ProfileHeader
            user={user}
            onAvatarPress={handleAvatarPress}
            isLoadingImage={isLoadingImage}
          />

          {/* ================================================================
              MY LEARNING SECTION
              Quick access to learning preferences
              ================================================================ */}
          {onboardingCompleted && (
            <SettingsSection title={t('sections.myLearning')}>
              <SettingsItem
                icon={<BookOpen size={20} color={colors.primary} />}
                label={t('settings.learningPreferences')}
                subtitle={getLearningPreferencesSubtitle()}
                type="navigation"
                onPress={handleEditPreferences}
                showBorder={false}
              />
            </SettingsSection>
          )}

          {/* ================================================================
              NOTIFICATIONS SECTION
              Daily reminder toggle with separate time selector

              DESIGN DECISIONS:
              1. Toggle row: Enables/disables notifications
              2. Time row: Only shown when enabled, opens time picker

              We use two separate rows because:
              - SettingsItem with type="toggle" makes the whole row toggle
              - Having a separate "Reminder Time" row is clearer UX
              - Users expect chevron = navigation, switch = toggle
              - This matches iOS Settings app patterns
              ================================================================ */}
          <SettingsSection title={t('sections.notifications')}>
            {/**
             * Daily Reminder Toggle
             *
             * Main toggle for enabling/disabling daily notifications.
             * Shows "Enabled" or "Disabled" subtitle for clarity.
             */}
            <SettingsItem
              icon={<Bell size={20} color={colors.primary} />}
              label={t('settings.dailyReminder')}
              subtitle={notifications.enabled ? t('status.enabled') : t('status.disabled')}
              type="toggle"
              value={notifications.enabled}
              onToggle={handleToggleReminder}
              showBorder={notifications.enabled} // Show border if time row follows
            />

            {/**
             * Reminder Time Selector
             *
             * Only shown when notifications are enabled.
             * Tapping opens the TimePicker modal.
             *
             * WHY CONDITIONAL RENDERING?
             * - Time is irrelevant when notifications are disabled
             * - Cleaner UI with fewer elements
             * - Progressive disclosure: show options only when relevant
             */}
            {notifications.enabled && (
              <SettingsItem
                icon={<Clock size={20} color={colors.primary} />}
                label={t('settings.reminderTime')}
                subtitle={getNotificationSubtitle()}
                type="navigation"
                onPress={handleTimePress}
                showBorder={false}
              />
            )}
          </SettingsSection>

          {/* ================================================================
              ACCOUNT SECTION
              Email, password, and verification status
              ================================================================ */}
          <SettingsSection title={t('sections.account')}>
            <SettingsItem
              icon={<Mail size={20} color={colors.primary} />}
              label={t('settings.changeEmail')}
              type="navigation"
              onPress={handleChangeEmail}
            />
            <SettingsItem
              icon={<Lock size={20} color={colors.primary} />}
              label={t('settings.changePassword')}
              type="navigation"
              onPress={handleChangePassword}
            />
            <SettingsItem
              icon={<CheckCircle size={20} color={colors.primary} />}
              label={t('settings.emailVerified')}
              type="display"
              rightElement={
                user?.emailVerified ? (
                  <View className="bg-primary/10 px-2 py-1 rounded">
                    <Text variant="small" className="text-primary font-medium">
                      {t('status.verified')}
                    </Text>
                  </View>
                ) : (
                  <View className="bg-destructive/20 px-2 py-1 rounded">
                    <Text variant="small" className="text-destructive-foreground font-medium">
                      {t('status.notVerified')}
                    </Text>
                  </View>
                )
              }
              showBorder={false}
            />
          </SettingsSection>

          {/* ================================================================
              SUPPORT SECTION
              Help, feedback, and about
              ================================================================ */}
          <SettingsSection title={t('sections.support')}>
            <SettingsItem
              icon={<HelpCircle size={20} color={colors.primary} />}
              label={t('settings.helpFaq')}
              type="navigation"
              onPress={handleHelp}
            />
            <SettingsItem
              icon={<MessageSquare size={20} color={colors.primary} />}
              label={t('settings.sendFeedback')}
              type="navigation"
              onPress={handleSendFeedback}
            />
            <SettingsItem
              icon={<Info size={20} color={colors.primary} />}
              label={t('settings.about')}
              subtitle={t('settings.version', { version: getAppVersion() })}
              type="navigation"
              onPress={handleAbout}
              showBorder={false}
            />
          </SettingsSection>

          {/* Spacer to push sign out to bottom if there's extra space */}
          <View className="flex-1 min-h-4" />

          {/* ================================================================
              SIGN OUT BUTTON
              Destructive action - isolated at bottom
              ================================================================ */}
          <Button
            variant="ghost"
            onPress={handleSignOut}
            isLoading={loading}
            disabled={loading}
            leftIcon={<LogOut size={20} color={colors.destructiveForeground} />}
            className="mt-4"
          >
            <Text className="text-destructive-foreground font-semibold">{t('signOut.button')}</Text>
          </Button>
        </View>
      </ScrollView>

      {/* ====================================================================
          IMAGE PICKER SHEET
          Bottom sheet for avatar photo selection
          ==================================================================== */}
      <ImagePickerSheet
        ref={imagePickerSheetRef}
        onSelectGallery={handleSelectGallery}
        onSelectCamera={handleSelectCamera}
        onClose={handleSheetClose}
      />

      {/* ====================================================================
          TIME PICKER MODAL
          Bottom sheet for selecting notification time

          This modal allows users to choose when they want to receive their
          daily learning reminder. It uses the native time picker wrapped
          in our BottomSheet component for a consistent UX.

          The picker is shown when:
          1. User has notifications enabled
          2. User taps on the time in the notification settings row

          WHY RENDER HERE (outside ScrollView)?
          - Bottom sheets need to be at the root level
          - They use portals/modals that overlay the entire screen
          - If inside ScrollView, they might not position correctly
          ==================================================================== */}
      <TimePicker
        visible={showTimePicker}
        time={notifications.time ?? DEFAULT_NOTIFICATION_PREFERENCES.time ?? '09:00'}
        onSave={handleTimeSave}
        onCancel={handleTimeCancel}
      />

      {/* ====================================================================
          PROFILE SUB-SCREEN MODALS
          Full-screen bottom sheet modals for profile sub-screens

          WHY MODALS INSTEAD OF NAVIGATION?
          - Tab navigators don't maintain navigation history properly
          - With navigation, pressing back could go to Home instead of Profile
          - Modals always dismiss to exactly where they were opened from
          - Better UX: action feels contained within Profile context

          These modals are rendered at the root level (outside ScrollView)
          because they use portals and need to overlay the entire screen.
          ==================================================================== */}

      {/* Edit Preferences Modal */}
      <EditPreferencesModal ref={editPreferencesModalRef} />

      {/* Change Email Modal */}
      <ChangeEmailModal ref={changeEmailModalRef} />

      {/* Change Password Modal */}
      <ChangePasswordModal ref={changePasswordModalRef} />

      {/* Help & FAQ Modal */}
      <HelpModal ref={helpModalRef} />

      {/* About Modal */}
      <AboutModal ref={aboutModalRef} />
    </SafeAreaView>
  );
}

/**
 * LEARNING NOTES:
 *
 * 1. PROFILE SCREEN STRUCTURE
 *    Mobile profile screens follow a consistent hierarchy:
 *    - Identity first (who am I?)
 *    - Personalization (my settings)
 *    - Account management
 *    - Support/help
 *    - Destructive actions last (sign out)
 *
 *    This matches user mental models and is seen in apps like
 *    iOS Settings, Spotify, Duolingo, etc.
 *
 * 2. GROUPED LIST PATTERN
 *    We use SettingsSection to group related items:
 *    - Clear section headers (uppercase, muted)
 *    - Card containers for visual grouping
 *    - Consistent item layout within sections
 *
 *    This pattern is scannable and familiar to users.
 *
 * 3. COMPONENT EXTRACTION
 *    We extracted ProfileHeader, SettingsSection, SettingsItem:
 *    - Single responsibility (each component does one thing)
 *    - Reusability (can use in other screens)
 *    - Testability (easier to test in isolation)
 *    - Maintainability (changes don't affect other logic)
 *
 * 4. WHAT WE REMOVED
 *    The old profile showed:
 *    - Firebase UID (technical, meaningless to users)
 *    - Duplicate email/name (already in header)
 *    - "Coming soon" placeholder (creates uncertainty)
 *
 *    Good UX removes unnecessary information.
 *
 * 5. NAVIGATION VS TOGGLE
 *    We use visual cues to indicate item behavior:
 *    - Chevron (›) = tappable, goes somewhere
 *    - Switch = toggles on/off
 *    - Badge = display only, no interaction
 *
 *    Users learn these patterns and navigate predictably.
 *
 * 6. ACCESSIBILITY
 *    - Touch targets are 44pt minimum (p-4 padding)
 *    - Proper accessibilityRole on interactive items
 *    - Screen reader labels include subtitles
 *    - Color isn't the only indicator (icons + text)
 *
 * 7. PLACEHOLDER SCREENS
 *    Some screens (change-email, change-password, help, about)
 *    will be created in Phase 3 and 4. For now, navigation
 *    is wired up to show the intent, even if the screens
 *    don't exist yet.
 *
 * 8. NOTIFICATION FLOW (Phase 2)
 *
 *    The notification feature demonstrates several important patterns:
 *
 *    a) PERMISSION HANDLING:
 *       - iOS: Requires explicit permission (one-time request)
 *       - Android 13+: Also requires explicit permission
 *       - We use "pre-permission priming" to explain why before asking
 *       - If denied, we direct users to system Settings
 *
 *    b) STATE MANAGEMENT:
 *       - Redux stores user preference (enabled, time)
 *       - Permission status is device-specific (not in Firestore)
 *       - We sync permission status on screen mount
 *
 *    c) DATA PERSISTENCE:
 *       - Notification preferences stored in Firestore
 *       - Time stored as "HH:MM" (timezone-independent)
 *       - Permission status NOT stored (device-specific)
 *
 *    d) SCHEDULING:
 *       - Uses Expo's local notification system
 *       - Daily trigger at specified time in local timezone
 *       - Notification rescheduled when time changes
 *       - Canceled when user disables
 *
 *    e) TIME FORMAT CONVERSION:
 *       - Storage: "HH:MM" 24-hour format (e.g., "14:30")
 *       - Display: 12-hour with AM/PM (e.g., "2:30 PM")
 *       - DateTimePicker: Date object
 *       - Helper functions handle conversions
 *
 * 9. MODAL PATTERNS
 *
 *    This screen uses two bottom sheet modals:
 *    - ImagePickerSheet: For avatar photo selection
 *    - TimePicker: For notification time selection
 *
 *    Both are rendered outside the ScrollView because:
 *    - They use absolute positioning / portals
 *    - Need to overlay the entire screen
 *    - ScrollView would constrain them incorrectly
 *
 *    Each modal has:
 *    - Controlled visibility (parent manages open/close state)
 *    - Callbacks for actions (save, cancel)
 *    - Swipe-to-dismiss gesture support
 */
