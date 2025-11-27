/**
 * Profile Screen - User Account Tab
 *
 * This screen displays the user's profile information and account settings.
 * It's the central hub for user-related actions like viewing account details,
 * managing settings, and signing out.
 *
 * PURPOSE:
 * The Profile screen is where users:
 * - View their account information
 * - Access account settings
 * - Sign out of the app
 * - (Future) Edit their profile
 * - (Future) Manage preferences
 *
 * FIREBASE USER DATA DISPLAYED:
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
import { CircleUser, Mail, Shield, Key, CheckCircle, XCircle, Settings, LogOut } from 'lucide-react-native';
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
 * ProfileScreen Component
 *
 * Displays user profile information from Firebase Auth
 * and provides account management functionality.
 *
 * STATE MANAGEMENT:
 * - Reads user data from Redux store (state.auth.user)
 * - Dispatches signOut action for logout
 *
 * NAVIGATION:
 * - After sign out, explicitly navigates to /welcome
 * - Could navigate to settings, edit profile, etc. (future)
 *
 * @returns The profile screen component
 */
export default function ProfileScreen() {
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
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/**
       * ScrollView Container
       *
       * Profile screens can have lots of settings and options.
       * ScrollView ensures all content is accessible.
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
           * Shows "Profile" title and subtitle.
           * Consistent with other tab screens.
           */}
          <View className="mb-8">
            <Text variant="h1" className="mb-2">
              Profile
            </Text>
            <Text variant="lead" className="text-muted-foreground">
              Manage your account
            </Text>
          </View>

          {/**
           * Profile Avatar Card
           *
           * Shows user avatar (initials for now, photo if available).
           * Centered for visual prominence.
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
           */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>
                Information from Firebase Authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              {/**
               * User ID Row
               * The uid is always present and unique.
               */}
              <DataRow
                icon={<Key size={20} color={colors.mutedForeground} />}
                label="User ID"
                value={user?.uid || 'N/A'}
                isMonospace
              />

              {/**
               * Email Row
               * User's email address used for authentication.
               */}
              <DataRow
                icon={<Mail size={20} color={colors.mutedForeground} />}
                label="Email"
                value={user?.email || 'Not provided'}
              />

              {/**
               * Display Name Row
               * Set during sign up via updateProfile().
               */}
              <DataRow
                icon={<CircleUser size={20} color={colors.mutedForeground} />}
                label="Display Name"
                value={user?.displayName || 'Not set'}
              />

              {/**
               * Email Verified Status
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
            </CardContent>
          </Card>

          {/**
           * Settings Section (Placeholder)
           *
           * Quick access to future settings options.
           * Currently shows what settings could be available.
           */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex-row items-center py-2">
                <View className="w-10 h-10 rounded-lg bg-primary-100 items-center justify-center mr-3">
                  <Settings size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-medium">App Settings</Text>
                  <Text variant="small" className="text-muted-foreground">
                    Preferences coming soon
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/**
           * Spacer
           *
           * flex-1 pushes the sign out button to the bottom
           * when there's extra space.
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
           */}
          <Button
            variant="destructive"
            onPress={handleSignOut}
            isLoading={loading}
            disabled={loading}
            className="mt-4"
          >
            <View className="flex-row items-center gap-2">
              <LogOut size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold">Sign Out</Text>
            </View>
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
       * Fixed width ensures alignment across rows.
       */}
      <View className="w-8 mt-0.5">
        {icon}
      </View>

      {/**
       * Label and Value Container
       * flex-1 takes remaining space.
       */}
      <View className="flex-1 gap-1">
        <Text variant="small" className="text-muted-foreground">
          {label}
        </Text>
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
 * 1. PROFILE TAB PATTERNS
 *    Profile tabs typically include:
 *    - User avatar and basic info at top
 *    - Account details section
 *    - Settings/preferences links
 *    - Sign out button at bottom
 *
 *    This structure is familiar to users from most apps.
 *
 * 2. SIGN OUT IN PROFILE
 *    Sign out is commonly placed in the Profile tab because:
 *    - It's account-related action
 *    - Users expect to find it here
 *    - It's not a frequent action (shouldn't be prominent elsewhere)
 *
 * 3. REDUX FOR AUTH STATE
 *    We use Redux instead of local state because:
 *    - Auth state is needed across the app
 *    - Other components react to auth changes
 *    - DevTools help debug auth flow
 *    - Centralized state management
 *
 * 4. NAVIGATION AFTER SIGN OUT
 *    We use router.replace('/welcome') because:
 *    - replace() removes current screen from stack
 *    - User can't go "back" to authenticated screens
 *    - Clean navigation history
 *
 * 5. SAFE AREA WITH TABS
 *    We use edges={['top']} because:
 *    - Tab bar handles bottom safe area
 *    - We only need top safe area for notch
 *    - Prevents double padding at bottom
 *
 * 6. DESTRUCTIVE BUTTON
 *    The destructive variant signals danger:
 *    - Red/muted styling draws attention
 *    - User knows this is a significant action
 *    - Consistent with UX conventions
 *
 * FUTURE ENHANCEMENTS:
 * - Add profile photo upload (Firebase Storage)
 * - Add edit profile functionality
 * - Add email verification sending
 * - Add additional user data from Firestore
 * - Add settings navigation
 * - Add notification preferences
 * - Add theme/appearance settings
 */
