/**
 * notificationService.ts - Expo Notifications Service Wrapper
 *
 * This file provides a clean API for managing local push notifications
 * using Expo's expo-notifications package. It handles permission requests,
 * scheduling daily reminders, and canceling notifications.
 *
 * WHY A SEPARATE SERVICE?
 * - Encapsulates all notification logic in one place
 * - Makes testing easier (can mock this service)
 * - Separates platform-specific code from UI components
 * - Follows the same pattern as other services in the app
 *
 * NOTIFICATION TYPES:
 * This app uses LOCAL notifications (scheduled on device), not PUSH notifications
 * (sent from a server). Local notifications are:
 * - Simpler to implement (no server needed)
 * - Work offline
 * - Perfect for daily reminders at consistent times
 * - Don't require a push notification token
 *
 * IMPORTANT PLATFORM DIFFERENCES:
 * - iOS: Requires explicit permission request (user sees a dialog)
 * - Android: Notifications work by default (no permission dialog on Android 12 and below)
 * - Android 13+: Requires POST_NOTIFICATIONS permission
 *
 * DATA FLOW:
 * 1. User enables notifications in settings
 * 2. We check/request permission
 * 3. If granted, schedule daily notification at specified time
 * 4. If denied, inform user and keep enabled=false
 *
 * EXPO NOTIFICATIONS CONCEPTS:
 * - Channel: Android-specific grouping for notifications (required for Android 8+)
 * - Trigger: When/how often the notification fires (daily, weekly, etc.)
 * - Content: The actual notification (title, body, data)
 * - Identifier: Unique ID to manage (cancel/update) specific notifications
 */

import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

/**
 * =============================================================================
 * CONSTANTS
 * =============================================================================
 */

/**
 * Unique identifier for our daily learning reminder notification
 *
 * WHY A CONSTANT?
 * - We use this ID to cancel/replace the notification
 * - Having a constant ensures we always reference the same notification
 * - Prevents accidentally creating duplicate notifications
 *
 * IMPORTANT: If you change this, existing scheduled notifications
 * won't be cancellable until the app is reinstalled.
 */
const DAILY_REMINDER_NOTIFICATION_ID = 'daily-learning-reminder';

/**
 * Android notification channel ID
 *
 * WHAT IS A NOTIFICATION CHANNEL?
 * Android 8.0+ requires notifications to be assigned to a "channel".
 * Each channel has its own settings (sound, vibration, importance).
 * Users can customize or disable channels in system settings.
 *
 * WHY DEFINE IT HERE?
 * - Ensures consistent channel usage across the app
 * - Makes it easy to create additional channels later
 */
const ANDROID_CHANNEL_ID = 'daily-reminders';

/**
 * =============================================================================
 * NOTIFICATION HANDLER CONFIGURATION
 * =============================================================================
 *
 * This configures how notifications behave when received while the app is open.
 * Without this, notifications might not show if the app is in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // Show alert even when app is in foreground
    // Useful for testing - in production you might want false
    shouldShowAlert: true,
    // Play sound when notification arrives
    shouldPlaySound: true,
    // Update app icon badge (iOS only)
    shouldSetBadge: false,
    // Priority for Android
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * =============================================================================
 * PERMISSION FUNCTIONS
 * =============================================================================
 */

/**
 * Permission status type
 *
 * Simplified permission states for easier handling in the app.
 * Maps to Expo's more complex permission structure.
 */
export type NotificationPermissionStatus = 'undetermined' | 'granted' | 'denied';

/**
 * Get current notification permission status
 *
 * @returns The current permission status
 *
 * WHY CHECK STATUS?
 * - Know if we can schedule notifications
 * - Update UI to show current state
 * - Decide whether to show permission request
 *
 * STATUS MEANINGS:
 * - 'undetermined': User hasn't been asked yet
 * - 'granted': User allowed notifications
 * - 'denied': User denied notifications (can only change in system settings)
 *
 * USAGE:
 * const status = await getNotificationPermissionStatus();
 * if (status === 'granted') {
 *   // Can schedule notifications
 * }
 */
export const getNotificationPermissionStatus = async (): Promise<NotificationPermissionStatus> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();

    // Map Expo's status to our simplified type
    // Expo uses 'undetermined', 'granted', 'denied'
    switch (status) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      default:
        return 'undetermined';
    }
  } catch (error) {
    console.error('[NotificationService] Error getting permission status:', error);
    // If we can't check, assume undetermined (safest default)
    return 'undetermined';
  }
};

/**
 * Request notification permission with user-friendly explanation
 *
 * @returns Whether permission was granted
 *
 * WHY SHOW PRE-PERMISSION ALERT?
 * - iOS only allows ONE permission request per app lifetime
 * - If user denies, they must go to Settings to re-enable
 * - Explaining WHY we need permission increases grant rate
 * - This is called "pre-permission priming"
 *
 * BEST PRACTICES FOR PERMISSION REQUESTS:
 * 1. Explain the benefit BEFORE asking (what user gets)
 * 2. Ask at a relevant moment (when user wants to enable notifications)
 * 3. Don't ask immediately on app launch
 * 4. Handle denial gracefully
 *
 * FLOW:
 * 1. Show Alert explaining why we need permission
 * 2. User taps "Enable" or "Not Now"
 * 3. If "Enable", request actual system permission
 * 4. Return whether permission was granted
 *
 * USAGE:
 * const granted = await requestNotificationPermission();
 * if (granted) {
 *   await scheduleDailyNotification('09:00');
 * } else {
 *   // Show message that notifications won't work
 * }
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    // First, check current status - maybe already granted or denied
    const currentStatus = await getNotificationPermissionStatus();

    // If already granted, no need to ask again
    if (currentStatus === 'granted') {
      console.log('[NotificationService] Permission already granted');
      return true;
    }

    // If already denied, user must go to system settings
    // We can't request again (iOS limitation)
    if (currentStatus === 'denied') {
      console.log('[NotificationService] Permission previously denied');
      // Show alert directing user to settings
      Alert.alert(
        'Notifications Disabled',
        'To receive daily learning reminders, please enable notifications in your device Settings.',
        [
          { text: 'OK', style: 'default' },
        ]
      );
      return false;
    }

    // Status is 'undetermined' - we can request permission
    // Show pre-permission explanation
    return new Promise((resolve) => {
      Alert.alert(
        'Stay on Track with Daily Reminders',
        'POCHOCLO would like to send you a daily notification to remind you to learn something new. You can customize the time in Settings.',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => {
              console.log('[NotificationService] User declined pre-permission');
              resolve(false);
            },
          },
          {
            text: 'Enable Notifications',
            style: 'default',
            onPress: async () => {
              // Now request actual system permission
              const { status } = await Notifications.requestPermissionsAsync();
              const granted = status === 'granted';
              console.log('[NotificationService] Permission request result:', status);
              resolve(granted);
            },
          },
        ]
      );
    });
  } catch (error) {
    console.error('[NotificationService] Error requesting permission:', error);
    return false;
  }
};

/**
 * Check if the app can schedule notifications
 *
 * @returns Whether notifications can be scheduled
 *
 * WHY THIS FUNCTION?
 * - Combines permission check with platform considerations
 * - Single function to determine if scheduling will work
 * - Useful before attempting to schedule
 *
 * USAGE:
 * const canSchedule = await canScheduleNotifications();
 * if (!canSchedule) {
 *   // Show UI explaining why notifications won't work
 * }
 */
export const canScheduleNotifications = async (): Promise<boolean> => {
  const status = await getNotificationPermissionStatus();
  return status === 'granted';
};

/**
 * =============================================================================
 * SCHEDULING FUNCTIONS
 * =============================================================================
 */

/**
 * Parse time string to hours and minutes
 *
 * @param timeString - Time in "HH:MM" format (e.g., "09:00", "14:30")
 * @returns Object with hours and minutes as numbers
 *
 * WHY A SEPARATE FUNCTION?
 * - Reusable parsing logic
 * - Handles validation
 * - Makes the scheduling function cleaner
 *
 * EXAMPLE:
 * parseTimeString("09:30") → { hours: 9, minutes: 30 }
 * parseTimeString("14:00") → { hours: 14, minutes: 0 }
 */
const parseTimeString = (timeString: string): { hours: number; minutes: number } => {
  // Split on ':' to get hours and minutes
  const parts = timeString.split(':');

  // Parse as integers (parseInt with base 10)
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  // Validate the parsed values
  // Hours: 0-23, Minutes: 0-59
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    console.warn('[NotificationService] Invalid time string:', timeString, '- using default 09:00');
    return { hours: 9, minutes: 0 };
  }

  return { hours, minutes };
};

/**
 * Schedule a daily learning reminder notification
 *
 * @param time - Time in "HH:MM" format when notification should fire
 * @returns Promise that resolves when scheduled (or rejects on error)
 *
 * HOW DAILY SCHEDULING WORKS:
 * Expo Notifications uses a "DailyTriggerInput" that repeats every day.
 * The trigger specifies hour and minute in LOCAL time.
 *
 * WHAT HAPPENS:
 * 1. Cancel any existing daily reminder (prevent duplicates)
 * 2. Parse the time string to hours/minutes
 * 3. Set up the Android notification channel (required for Android 8+)
 * 4. Schedule the notification with daily repeat trigger
 *
 * NOTIFICATION CONTENT:
 * We use encouraging, non-pushy messaging to:
 * - Motivate without being annoying
 * - Remind of the learning benefit
 * - Be brief (users only glance at notifications)
 *
 * IMPORTANT NOTES:
 * - Notification fires at specified time in USER'S LOCAL TIMEZONE
 * - If user changes timezone, notification adjusts automatically
 * - Notification repeats every day until canceled
 * - App must be installed for notification to fire (obvious but worth noting)
 *
 * USAGE:
 * await scheduleDailyNotification('09:00'); // Remind at 9 AM
 * await scheduleDailyNotification('20:30'); // Remind at 8:30 PM
 */
export const scheduleDailyNotification = async (time: string): Promise<void> => {
  try {
    console.log('[NotificationService] Scheduling daily notification for:', time);

    // Step 1: Cancel existing daily reminder to prevent duplicates
    // If we don't do this, each call would add another notification!
    await cancelDailyNotification();

    // Step 2: Parse the time string
    const { hours, minutes } = parseTimeString(time);

    // Step 3: Set up Android notification channel
    // This is required for Android 8.0+ (API level 26+)
    // On iOS, this call is ignored (no-op)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Daily Reminders',
        description: 'Daily learning reminder notifications',
        importance: Notifications.AndroidImportance.HIGH,
        // HIGH importance means:
        // - Makes sound
        // - Shows as heads-up notification
        // - Shows in status bar
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250], // Vibrate pattern
        enableVibrate: true,
      });
    }

    // Step 4: Schedule the notification with daily trigger
    await Notifications.scheduleNotificationAsync({
      // Unique identifier - we use this to cancel/update later
      identifier: DAILY_REMINDER_NOTIFICATION_ID,

      // The notification content (what user sees)
      content: {
        title: 'Time to Learn!',
        body: 'Your daily dose of knowledge is waiting. What will you discover today?',
        // Data payload (not shown to user, but available in app)
        data: {
          type: 'daily-reminder',
          scheduledTime: time,
        },
        // Sound to play (uses system default)
        sound: 'default',
        // Android-specific: which channel to use
        ...(Platform.OS === 'android' && { channelId: ANDROID_CHANNEL_ID }),
      },

      // The trigger (when/how often to fire)
      trigger: {
        // Type: daily at specific time
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        // Hour in 24-hour format (0-23)
        hour: hours,
        // Minute (0-59)
        minute: minutes,
      },
    });

    console.log('[NotificationService] Daily notification scheduled successfully');
    console.log(`[NotificationService] Will fire daily at ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);

  } catch (error) {
    console.error('[NotificationService] Error scheduling notification:', error);
    throw new Error(
      `Failed to schedule notification: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Cancel the daily learning reminder notification
 *
 * @returns Promise that resolves when canceled
 *
 * WHEN TO CALL:
 * - User disables notifications in settings
 * - Before scheduling a new notification (to prevent duplicates)
 * - On user logout (clean up user-specific notifications)
 *
 * WHY CANCEL BY IDENTIFIER?
 * - Only cancels our specific notification
 * - Doesn't affect other notifications the app might have
 * - If notification doesn't exist, this is a no-op (safe to call)
 *
 * USAGE:
 * await cancelDailyNotification();
 */
export const cancelDailyNotification = async (): Promise<void> => {
  try {
    console.log('[NotificationService] Canceling daily notification');

    // Cancel by our specific identifier
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_NOTIFICATION_ID);

    console.log('[NotificationService] Daily notification canceled');

  } catch (error) {
    // Log but don't throw - canceling a non-existent notification is fine
    console.warn('[NotificationService] Error canceling notification (may not exist):', error);
  }
};

/**
 * Cancel all scheduled notifications
 *
 * @returns Promise that resolves when all canceled
 *
 * WHEN TO CALL:
 * - User logs out (clear all user-specific notifications)
 * - Resetting the app
 * - Debugging notification issues
 *
 * CAUTION:
 * This cancels ALL scheduled notifications, not just the daily reminder.
 * Use cancelDailyNotification() if you only want to cancel that specific one.
 *
 * USAGE:
 * await cancelAllNotifications(); // Nuclear option
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    console.log('[NotificationService] Canceling all scheduled notifications');

    await Notifications.cancelAllScheduledNotificationsAsync();

    console.log('[NotificationService] All notifications canceled');

  } catch (error) {
    console.warn('[NotificationService] Error canceling all notifications:', error);
  }
};

/**
 * =============================================================================
 * UTILITY FUNCTIONS
 * =============================================================================
 */

/**
 * Get all currently scheduled notifications
 *
 * @returns Array of scheduled notification requests
 *
 * WHY THIS FUNCTION?
 * - Debugging: See what's actually scheduled
 * - Verification: Confirm our scheduling worked
 * - UI: Could show scheduled time in settings
 *
 * USAGE:
 * const scheduled = await getScheduledNotifications();
 * console.log('Scheduled:', scheduled.length);
 */
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('[NotificationService] Currently scheduled:', notifications.length);
    return notifications;
  } catch (error) {
    console.error('[NotificationService] Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Check if daily notification is currently scheduled
 *
 * @returns Whether the daily reminder is scheduled
 *
 * WHY THIS FUNCTION?
 * - Quick check without getting all notifications
 * - Useful for syncing UI state with actual scheduled state
 * - Verify that scheduling/canceling worked
 *
 * USAGE:
 * const isScheduled = await isDailyNotificationScheduled();
 * // Update UI toggle to match
 */
export const isDailyNotificationScheduled = async (): Promise<boolean> => {
  try {
    const scheduled = await getScheduledNotifications();

    // Look for our specific notification by identifier
    const dailyReminder = scheduled.find(
      (notification) => notification.identifier === DAILY_REMINDER_NOTIFICATION_ID
    );

    return dailyReminder !== undefined;

  } catch (error) {
    console.error('[NotificationService] Error checking if notification is scheduled:', error);
    return false;
  }
};

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. LOCAL VS PUSH NOTIFICATIONS
 *
 *    Local Notifications:
 *    - Scheduled on the device
 *    - Don't need internet
 *    - Great for reminders, alarms
 *    - No server infrastructure needed
 *    - Limited to device (can't reach user from backend)
 *
 *    Push Notifications:
 *    - Sent from a server
 *    - Require internet connection
 *    - Need push token and server setup
 *    - Can reach user anytime (marketing, alerts, etc.)
 *    - More complex to implement
 *
 *    We use LOCAL because daily reminders are perfect for them!
 *
 * 2. ANDROID NOTIFICATION CHANNELS
 *
 *    Android 8.0+ requires notifications to be in a "channel".
 *    Benefits for users:
 *    - Can customize each channel (sound, vibration)
 *    - Can disable specific channels without disabling all notifications
 *    - More control over their notification experience
 *
 *    Best practice: Create channels for different notification types.
 *    We have one channel for daily reminders.
 *
 * 3. PRE-PERMISSION PRIMING
 *
 *    iOS only allows ONE permission request. If denied, the app can never
 *    ask again - user must go to Settings.
 *
 *    Solution: Show a custom alert BEFORE the system dialog explaining
 *    why you need permission. This increases acceptance rate because:
 *    - User understands the benefit
 *    - User feels in control
 *    - Can decline without triggering the system dialog
 *
 * 4. SCHEDULING WITH TRIGGERS
 *
 *    Expo Notifications supports various trigger types:
 *    - TimeIntervalTriggerInput: Fire after X seconds
 *    - DateTriggerInput: Fire at specific date/time
 *    - DailyTriggerInput: Fire every day at specific time (what we use)
 *    - WeeklyTriggerInput: Fire every week at specific day/time
 *    - CalendarTriggerInput: Complex calendar-based scheduling
 *
 *    We use DAILY trigger for the learning reminder.
 *
 * 5. NOTIFICATION IDENTIFIERS
 *
 *    Each scheduled notification has a unique identifier.
 *    Using a constant identifier allows us to:
 *    - Cancel a specific notification
 *    - Replace it without creating duplicates
 *    - Track which notifications are scheduled
 *
 *    If we used random IDs, we'd have no way to manage specific notifications!
 *
 * 6. ERROR HANDLING STRATEGY
 *
 *    For notifications, we generally:
 *    - Log errors for debugging
 *    - Don't crash the app if notifications fail
 *    - Return sensible defaults (false, empty array)
 *    - Only throw for critical operations (like scheduling)
 *
 *    Notifications are "nice to have" - app should work without them.
 *
 * 7. TIMEZONE HANDLING
 *
 *    The DailyTrigger uses LOCAL time automatically.
 *    If user travels to different timezone:
 *    - Notification fires at the local time in new timezone
 *    - e.g., "09:00" fires at 9 AM wherever they are
 *
 *    This is usually what users expect for daily reminders.
 */
