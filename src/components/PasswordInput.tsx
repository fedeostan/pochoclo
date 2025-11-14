/**
 * PasswordInput Component
 *
 * A specialized text input for password fields with a show/hide toggle.
 * Extends our TextInput component to inherit all its features while adding
 * password-specific functionality.
 *
 * WHY A SEPARATE PASSWORD COMPONENT?
 * Password inputs need special features:
 * 1. Secure text entry (dots instead of characters)
 * 2. Show/hide toggle (so users can verify what they typed)
 * 3. No autocorrect (passwords aren't words)
 * 4. No auto-capitalization (passwords are case-sensitive)
 * 5. Optional password strength indicator (future enhancement)
 *
 * MOBILE BEST PRACTICES:
 * - Always provide a way to show password (prevents typos)
 * - Use a clear eye icon (universal symbol)
 * - Secure by default (hidden)
 * - No autocorrect or suggestions (security + UX)
 * - Password keyboard on iOS (hides suggestions bar)
 *
 * This component wraps TextInput and adds password-specific behavior,
 * demonstrating component composition in React.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import TextInput, { TextInputProps } from './TextInput';
import {
  colors,
  spacing,
  layout,
  body,
  special,
  radius,
  shadowSm,
  iconSize,
  touchTarget,
} from '../theme';

/**
 * PasswordInput Component Props
 *
 * We extend TextInputProps but omit 'keyboardType' since passwords
 * always use the default keyboard (for security).
 *
 * TYPESCRIPT OMIT:
 * Omit<Type, Keys> creates a new type with specified keys removed.
 * This prevents users from passing keyboardType="email-address" to
 * a password field (which wouldn't make sense).
 */
export interface PasswordInputProps extends Omit<TextInputProps, 'keyboardType'> {
  /**
   * Show password strength indicator
   * When true, displays a visual indicator of password strength
   * (weak, medium, strong) below the input.
   *
   * This is optional - we'll implement the basic version now and
   * can enhance it later with strength calculation.
   */
  showStrengthIndicator?: boolean;
}

/**
 * PasswordInput Component
 *
 * A password input with show/hide functionality.
 * Automatically configures security and keyboard settings.
 */
export default function PasswordInput({
  showStrengthIndicator = false,
  ...rest // All other TextInput props
}: PasswordInputProps) {
  /**
   * Password Visibility State
   *
   * Tracks whether the password is currently visible or hidden.
   * - false (default): Password is hidden (secure)
   * - true: Password is visible (plain text)
   *
   * Users can toggle this by tapping the eye icon.
   */
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  /**
   * Toggle Password Visibility
   *
   * Switches between showing and hiding the password.
   * This is a common pattern in password inputs to prevent typos
   * while maintaining security by defaulting to hidden.
   */
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  /**
   * COMPONENT COMPOSITION:
   *
   * Instead of rebuilding TextInput's functionality, we reuse it!
   * This is called "composition" - building complex components from
   * simpler ones.
   *
   * Benefits:
   * - Don't repeat code
   * - TextInput updates automatically benefit PasswordInput
   * - Easier to maintain
   * - Clear separation of concerns
   *
   * We're essentially wrapping TextInput with a custom container
   * that adds the show/hide button.
   */

  return (
    <View style={styles.container}>
      {/* Label - render it ourselves instead of letting TextInput do it */}
      <Text style={styles.label}>{rest.label}</Text>

      {/*
        Password Input Container

        This wraps the actual input and the toggle button.
        We need to build this ourselves (not use TextInput directly)
        because we need to add the eye icon button inside the input border.
      */}
      <View
        style={[
          styles.inputWrapper,
          rest.error && styles.inputWrapperError,
          rest.disabled && styles.inputWrapperDisabled,
        ]}
      >
        {/*
          The Actual Password Input

          React Native's TextInput with password-specific configuration:
          - secureTextEntry: Shows dots instead of characters
          - autoCapitalize: 'none' (passwords are case-sensitive)
          - autoCorrect: false (don't suggest corrections)
          - textContentType: 'password' (iOS autofill integration)
        */}
        <RNTextInput
          value={rest.value}
          onChangeText={rest.onChangeText}
          placeholder={rest.placeholder}
          placeholderTextColor={colors.textTertiary}
          // Password-specific security settings
          secureTextEntry={!isPasswordVisible} // Hide unless toggled
          autoCapitalize="none" // Passwords are case-sensitive
          autoCorrect={false} // Don't auto-correct passwords
          // iOS autofill integration
          textContentType={Platform.OS === 'ios' ? 'password' : undefined}
          // Accessibility
          accessibilityLabel={rest.label}
          // Styling
          style={[
            styles.input,
            rest.disabled && styles.inputDisabled,
          ]}
          // Other props
          editable={!rest.disabled}
          maxLength={rest.maxLength}
          underlineColorAndroid="transparent"
        />

        {/*
          Show/Hide Password Toggle Button

          A touchable icon that toggles password visibility.
          We use TouchableOpacity for:
          - Visual feedback (fades slightly when pressed)
          - Easy tap handling
          - Accessibility support

          ACCESSIBILITY NOTE:
          The button has:
          - accessibilityLabel: Describes what it does
          - accessibilityRole: Tells screen readers it's a button
          - Large touch target (48px minimum)
        */}
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          style={styles.toggleButton}
          // Accessibility
          accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
          accessibilityRole="button"
          // Ensure it's accessible even when input is disabled
          disabled={rest.disabled}
        >
          {/*
            Eye Icon (Text-based for now)

            In a production app, you'd use an icon library like:
            - @expo/vector-icons (Ionicons, MaterialIcons, etc.)
            - react-native-vector-icons
            - Custom SVG icons

            For this learning project, we're using emoji/text to avoid
            extra dependencies. This clearly shows the toggle state:
            - 👁️ (open eye) = password is visible
            - 👁️‍🗨️ (eye with slash) = password is hidden

            FUTURE ENHANCEMENT:
            Replace with proper icons from Ionicons:
            - <Ionicons name="eye" /> for visible
            - <Ionicons name="eye-off" /> for hidden
          */}
          <Text style={styles.toggleIcon}>
            {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
          </Text>
        </TouchableOpacity>
      </View>

      {/*
        Error or Helper Text

        Display error message or helper text below the input.
        Error takes priority over helper text.
      */}
      <View style={styles.messageContainer}>
        {rest.error ? (
          <Text style={styles.errorText}>{rest.error}</Text>
        ) : rest.helperText ? (
          <Text style={styles.helperText}>{rest.helperText}</Text>
        ) : null}
      </View>

      {/*
        Password Strength Indicator (Optional)

        This is a placeholder for future enhancement.
        When showStrengthIndicator is true, we could display:
        - Weak (red): < 8 characters, no special chars
        - Medium (orange): 8+ characters, some variety
        - Strong (green): 12+ characters, uppercase, lowercase, numbers, symbols

        For now, we'll skip this to keep Phase 2 focused on core components.
        We can add it later if needed.
      */}
      {showStrengthIndicator && (
        <View style={styles.strengthIndicator}>
          {/* TODO: Implement password strength calculation */}
          <Text style={styles.strengthText}>
            Password strength indicator (future enhancement)
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Styles using Design System
 *
 * Similar to TextInput styles but customized for the password field
 * with the toggle button integrated into the input container.
 */
const styles = StyleSheet.create({
  container: {
    marginBottom: layout.formFieldGap, // Space between form fields (24px)
  },
  label: {
    ...special.label, // 14px, medium weight
    color: colors.textPrimary,
    marginBottom: layout.labelGap, // Space between label and input (8px)
  },
  inputWrapper: {
    flexDirection: 'row', // Horizontal layout (input + button)
    alignItems: 'center', // Vertically center button with input
    backgroundColor: colors.surface, // White background
    borderRadius: radius.sm, // 8px rounded corners
    borderWidth: 1,
    borderColor: colors.border, // Light gray border
    paddingHorizontal: layout.inputPadding, // 16px horizontal padding
    paddingVertical: Platform.select({
      ios: spacing.md, // 16px on iOS
      android: spacing.sm, // 12px on Android
    }) ?? spacing.md,
    ...shadowSm, // Subtle shadow
  },
  inputWrapperError: {
    borderColor: colors.error, // Red border when error
    backgroundColor: colors.errorLight + '10', // Very light red tint
    borderWidth: 2,
  },
  inputWrapperDisabled: {
    backgroundColor: colors.disabledBackground, // Gray background
    borderColor: colors.disabled,
    opacity: 0.6,
  },
  input: {
    flex: 1, // Take up available space (toggle button takes fixed space)
    ...body.regular, // 16px, normal weight
    color: colors.textPrimary,
    padding: 0, // Remove default padding
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputDisabled: {
    color: colors.textSecondary,
  },
  toggleButton: {
    padding: spacing.xs, // 8px padding for larger touch target
    marginLeft: spacing.sm, // Space between input text and button
    // Ensure minimum touch target size (44px on iOS, 48px on Android)
    minWidth: touchTarget.minimum,
    minHeight: touchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: iconSize.md, // 24px icon size
    // Note: In production, replace with proper icon component
  },
  messageContainer: {
    minHeight: spacing.lg, // Reserve space for messages (24px)
    marginTop: layout.labelGap, // Space above message (8px)
  },
  errorText: {
    ...special.helper, // 12px helper text style
    color: colors.error,
  },
  helperText: {
    ...special.helper,
    color: colors.textSecondary,
  },
  strengthIndicator: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xs,
  },
  strengthText: {
    ...special.helper,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

/**
 * LEARNING NOTES:
 *
 * 1. COMPONENT COMPOSITION
 *    We could have copied all of TextInput's code, but instead we reuse it.
 *    However, in this case, we needed more control over the layout
 *    (to put the button inside the input border), so we built a custom
 *    version that mirrors TextInput's structure.
 *
 *    In React, when choosing between composition and custom build:
 *    - Composition: When you can wrap the component as-is
 *    - Custom: When you need to modify the internal structure
 *
 * 2. SECURE TEXT ENTRY
 *    secureTextEntry is a TextInput prop that hides characters.
 *    On iOS: Shows dots (•••)
 *    On Android: Shows dots or asterisks (••• or ***)
 *
 *    This is essential for password fields to prevent shoulder surfing
 *    (someone looking over your shoulder to see your password).
 *
 * 3. SHOW/HIDE TOGGLE
 *    Research shows that show/hide toggles:
 *    - Reduce password entry errors
 *    - Improve user confidence
 *    - Are expected by users (industry standard)
 *    - Should default to hidden (security)
 *
 *    The toggle should be:
 *    - Easy to find (right side of input)
 *    - Clear what it does (eye icon is universal)
 *    - Large enough to tap easily (44px+ touch target)
 *
 * 4. PASSWORD BEST PRACTICES
 *    - autoCapitalize="none": Passwords are case-sensitive
 *    - autoCorrect={false}: Don't suggest corrections
 *    - textContentType="password": Enables iOS password autofill
 *    - No keyboard type override: Use default for security
 *
 * 5. ACCESSIBILITY
 *    The toggle button includes:
 *    - accessibilityLabel: "Show password" or "Hide password"
 *    - accessibilityRole: "button"
 *    - Large touch target: 44px minimum
 *
 *    Screen readers will announce: "Show password button" and users
 *    can activate it with VoiceOver (iOS) or TalkBack (Android).
 *
 * 6. FLEXBOX LAYOUT
 *    flexDirection: 'row' makes items lay out horizontally
 *    flex: 1 on the input makes it take up remaining space
 *    The button takes its natural size (based on content + padding)
 *
 *    This is a common pattern for "input with button" layouts.
 *
 * 7. PLATFORM DIFFERENCES
 *    iOS and Android handle text input differently:
 *    - iOS has a suggestions bar above the keyboard
 *    - Android has different font rendering
 *    - textContentType only works on iOS
 *
 *    We use Platform.select() to handle these differences gracefully.
 *
 * USAGE EXAMPLE:
 *
 * ```tsx
 * const [password, setPassword] = useState('');
 * const [passwordError, setPasswordError] = useState('');
 *
 * <PasswordInput
 *   label="Password"
 *   value={password}
 *   onChangeText={setPassword}
 *   placeholder="Enter your password"
 *   error={passwordError}
 *   helperText="Must be at least 8 characters"
 * />
 * ```
 *
 * FUTURE ENHANCEMENTS:
 * 1. Add icon library (Ionicons) for proper eye icons
 * 2. Implement password strength indicator:
 *    - Calculate based on length, character variety
 *    - Show visual bar (red, orange, green)
 *    - Provide feedback ("Add numbers for stronger password")
 * 3. Add "confirm password" matching logic
 * 4. Integrate with password managers (iOS/Android autofill)
 */
