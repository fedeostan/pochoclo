/**
 * Home Screen - Authenticated User Dashboard
 *
 * This is the main screen users see after signing in.
 * It displays all available Firebase Auth user data and provides
 * a sign out button to test the authentication flow.
 *
 * PURPOSE:
 * This is a "verification" screen to:
 * 1. Confirm authentication is working correctly
 * 2. Display all user data pulled from Firebase Auth
 * 3. Test the sign out functionality
 * 4. Demonstrate how to read from Redux store
 *
 * FIREBASE USER DATA AVAILABLE:
 * The SerializableUser type (from authSlice.ts) contains:
 * - uid: Unique user identifier (always present)
 * - email: User's email address (string | null)
 * - displayName: User's display name (string | null)
 * - photoURL: Profile photo URL (string | null)
 * - emailVerified: Whether email is verified (boolean)
 *
 * NOTE ON CUSTOM DATA:
 * For additional user data (preferences, profile info, etc.),
 * you would use Firestore - that's a future phase!
 *
 * DESIGN SYSTEM:
 * Follows UI_RULES.md principles:
 * - Minimal: Clean layout with purposeful whitespace
 * - Light: Off-white background (#FAFAF9)
 * - Soft: Muted colors, no harsh tones
 * - Modern: Rounded corners, clean typography
 */

import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CircleUser, Mail, Shield, Key, CheckCircle, XCircle } from 'lucide-react-native';
import {
  Text,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store';
import { signOut } from '@/store/slices/authSlice';
import { colors } from '@/theme';

/**
 * HomeScreen Component
 *
 * Displays user profile information from Firebase Auth
 * and provides sign out functionality.
 *
 * STATE MANAGEMENT:
 * - Reads user data from Redux store (state.auth.user)
 * - Dispatches signOut action for logout
 *
 * NAVIGATION:
 * - After sign out, the root layout detects user = null
 * - Automatically redirects to /welcome
 *
 * @returns The home screen component
 */
export default function HomeScreen() {
  /**
   * Redux Hooks
   *
   * useAppDispatch: Returns typed dispatch function for actions
   * useAppSelector: Reads from Redux store with TypeScript support
   *
   * We read:
   * - user: The current authenticated user (SerializableUser)
   * - loading: Whether an auth operation is in progress
   */
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);

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
   *
   * WHY DISPATCH INSTEAD OF DIRECT CALL?
   * Using Redux for sign out ensures:
   * - Consistent state management
   * - Loading states are handled automatically
   * - Error handling is centralized
   * - Other parts of the app can react to auth changes
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
   * Get User Initials for Avatar Fallback
   *
   * If no photoURL is available, we show initials instead.
   * Takes the first letter of displayName or email.
   *
   * @returns Single letter initial or "?" as fallback
   */
  const getInitials = (): string => {
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/**
       * Main Content Area
       *
       * ScrollView allows content to scroll if it exceeds screen height.
       * This is good practice for accessibility and smaller devices.
       *
       * contentContainerStyle with flexGrow: 1 ensures:
       * - Content fills the screen when small
       * - Content scrolls when it exceeds screen height
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
           * Welcome message with user's name (or fallback).
           * Uses our Text component with h1 variant.
           */}
          <View className="mb-8">
            <Text variant="h1" className="mb-2">
              Welcome{user?.displayName ? `, ${user.displayName}` : ''}!
            </Text>
            <Text variant="lead">
              Here's your account information from Firebase
            </Text>
          </View>

          {/**
           * Profile Avatar Card
           *
           * Shows user avatar (initials for now, photo if available).
           * Centered at top for visual prominence.
           */}
          <Card className="mb-6">
            <CardContent className="items-center py-8">
              {/**
               * Avatar Circle
               *
               * If user has a photoURL, we'd show an Image here.
               * For now, showing initials in a styled circle.
               *
               * FUTURE ENHANCEMENT:
               * Add Image component when photoURL is available:
               * {user?.photoURL ? (
               *   <Image source={{ uri: user.photoURL }} style={...} />
               * ) : (
               *   <View>...</View>
               * )}
               */}
              <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-4">
                <Text className="text-4xl font-bold text-primary-foreground">
                  {getInitials()}
                </Text>
              </View>
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
           *
           * This demonstrates:
           * - Reading from Redux store
           * - Handling null values gracefully
           * - UI component composition
           */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>
                Data from Firebase Authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              {/**
               * User ID Row
               *
               * The uid is always present and unique.
               * This is Firebase's identifier for the user.
               */}
              <DataRow
                icon={<Key size={20} color={colors.mutedForeground} />}
                label="User ID"
                value={user?.uid || 'N/A'}
                isMonospace
              />

              {/**
               * Email Row
               *
               * User's email address used for authentication.
               * Could be null for social auth (not our case).
               */}
              <DataRow
                icon={<Mail size={20} color={colors.mutedForeground} />}
                label="Email"
                value={user?.email || 'Not provided'}
              />

              {/**
               * Display Name Row
               *
               * Set during sign up via updateProfile().
               * Can be updated later by the user.
               */}
              <DataRow
                icon={<CircleUser size={20} color={colors.mutedForeground} />}
                label="Display Name"
                value={user?.displayName || 'Not set'}
              />

              {/**
               * Email Verified Status
               *
               * Boolean indicating if email was verified.
               * Firebase can send verification emails.
               *
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

              {/**
               * Photo URL Row
               *
               * URL to user's profile photo.
               * Usually null for email/password auth.
               * Would be set for Google/Facebook sign in.
               */}
              <DataRow
                icon={<CircleUser size={20} color={colors.mutedForeground} />}
                label="Photo URL"
                value={user?.photoURL || 'Not set'}
                isMonospace={!!user?.photoURL}
              />
            </CardContent>
          </Card>

          {/**
           * Info Card
           *
           * Educational note about what data is available.
           * Helps the user understand Firebase Auth limitations.
           */}
          <Card variant="outline" className="mb-8">
            <CardContent>
              <Text variant="small" className="text-muted-foreground">
                This data comes from Firebase Authentication. For additional
                user data (preferences, profile info, etc.), you would use
                Firestore - that's covered in a future phase!
              </Text>
            </CardContent>
          </Card>

          {/**
           * Spacer
           *
           * flex-1 pushes the sign out button to the bottom
           * when there's extra space. This is a common pattern
           * for "fixed bottom" buttons in scrollable content.
           */}
          <View className="flex-1" />

          {/**
           * Sign Out Button
           *
           * Uses destructive variant for visual warning.
           * Shows loading state during sign out process.
           *
           * WHY DESTRUCTIVE VARIANT?
           * Sign out is a "destructive" action in UX terms:
           * - It ends the current session
           * - User loses access to authenticated features
           * - Requires re-authentication to return
           *
           * The red/muted styling signals this to users.
           */}
          <Button
            variant="destructive"
            onPress={handleSignOut}
            isLoading={loading}
            disabled={loading}
            className="mt-4"
          >
            Sign Out
          </Button>
        </View>
      </ScrollView>
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
       *
       * Fixed width ensures alignment across rows.
       * mt-0.5 aligns icon with text baseline.
       */}
      <View className="w-8 mt-0.5">
        {icon}
      </View>

      {/**
       * Label and Value Container
       *
       * flex-1 takes remaining space.
       * gap-1 provides small spacing between label and value.
       */}
      <View className="flex-1 gap-1">
        <Text variant="small" className="text-muted-foreground">
          {label}
        </Text>
        {/**
         * Value Display
         *
         * Can be a string or JSX element (for verified status).
         * isMonospace applies monospace font for IDs and URLs.
         */}
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
 * 1. READING FROM REDUX
 *    const { user, loading } = useAppSelector((state) => state.auth);
 *
 *    This hook:
 *    - Subscribes to Redux store changes
 *    - Re-renders component when selected state changes
 *    - Is typed thanks to our useAppSelector hook
 *
 * 2. FIREBASE USER vs SERIALIZABLE USER
 *    We don't use the raw Firebase User object because:
 *    - It contains methods (not serializable)
 *    - It has circular references (crashes Redux)
 *
 *    SerializableUser has only plain data:
 *    - uid, email, displayName, photoURL, emailVerified
 *
 * 3. DISPATCHING ACTIONS
 *    dispatch(signOut());
 *
 *    This:
 *    - Triggers the signOut async thunk
 *    - Sets loading = true immediately
 *    - Calls Firebase signOut
 *    - Sets user = null on success
 *    - Navigation detects change and redirects
 *
 * 4. CONDITIONAL RENDERING
 *    {user?.displayName || 'User'}
 *
 *    This safely handles null values:
 *    - If displayName exists, show it
 *    - If null/undefined, show fallback
 *
 * 5. COMPONENT COMPOSITION
 *    We created DataRow as a private component for:
 *    - Consistent layout across rows
 *    - Reduced code repetition
 *    - Easy to modify all rows at once
 *
 * 6. DESIGN PATTERNS USED
 *    - Card for grouping related content
 *    - Icons for visual recognition
 *    - Muted colors for labels, foreground for values
 *    - ScrollView for accessibility
 *    - SafeAreaView for device notches
 *
 * 7. SIGN OUT FLOW
 *    1. User taps Sign Out button
 *    2. handleSignOut dispatches signOut()
 *    3. Redux sets loading = true
 *    4. Firebase clears auth tokens
 *    5. onAuthStateChanged fires with null
 *    6. Redux sets user = null
 *    7. index.tsx detects no user
 *    8. Redirects to /welcome
 *
 * 8. FUTURE ENHANCEMENTS
 *    - Add profile photo upload (Storage)
 *    - Add edit profile functionality
 *    - Add email verification sending
 *    - Add additional user data from Firestore
 *    - Add pull-to-refresh to reload user data
 *
 * TESTING:
 * 1. Sign in with a test account
 * 2. Verify all data displays correctly
 * 3. Check that displayName shows (set during sign up)
 * 4. Tap Sign Out
 * 5. Verify redirect to Welcome screen
 * 6. Try signing back in - should return here
 */
