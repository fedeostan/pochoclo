/**
 * TextInput Component
 *
 * A reusable, styled text input component that follows our design system.
 * This component will be used throughout the authentication screens for
 * email inputs, name inputs, and any other text-based form fields.
 *
 * WHY CREATE A CUSTOM TEXT INPUT?
 * React Native's default TextInput is unstyled and lacks features like:
 * - Consistent design system integration
 * - Built-in label and error message display
 * - Accessibility features
 * - Helper text support
 * - Visual states (default, focused, error, disabled)
 *
 * By creating our own, we ensure:
 * 1. Consistency - All inputs look and behave the same
 * 2. Maintainability - Change once, updates everywhere
 * 3. Accessibility - Built-in screen reader support
 * 4. User Experience - Clear labels, errors, and helper text
 *
 * DESIGN SYSTEM INTEGRATION:
 * This component uses tokens from our theme for:
 * - Colors (text, borders, backgrounds)
 * - Spacing (padding, margins, gaps)
 * - Typography (label, input text, helper text)
 * - Border radius (rounded corners)
 * - Shadows (subtle elevation)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  Platform,
} from 'react-native';
import {
  colors,
  spacing,
  layout,
  body,
  special,
  radius,
  shadowSm,
} from '../theme';

/**
 * TextInput Component Props
 *
 * We extend React Native's TextInputProps to inherit all standard props
 * (like onChangeText, value, etc.) and add our custom props.
 *
 * TYPESCRIPT BENEFITS:
 * - Autocomplete in your IDE
 * - Compile-time error checking
 * - Self-documenting code (props show what's available)
 */
export interface TextInputProps extends RNTextInputProps {
  /**
   * Label displayed above the input
   * Required for accessibility - screen readers need labels
   */
  label: string;

  /**
   * Current value of the input
   * This makes the component "controlled" - React manages the state
   */
  value: string;

  /**
   * Callback when text changes
   * Updates the parent component's state
   */
  onChangeText: (text: string) => void;

  /**
   * Placeholder text shown when input is empty
   * Should provide a hint about expected input format
   */
  placeholder?: string;

  /**
   * Error message to display
   * When provided, the input shows an error state (red border, error text)
   */
  error?: string;

  /**
   * Helper text displayed below the input
   * Use for hints like "We'll never share your email"
   * Not shown when error is present (error takes priority)
   */
  helperText?: string;

  /**
   * Whether the input is disabled
   * Disabled inputs can't be edited and appear grayed out
   */
  disabled?: boolean;

  /**
   * Keyboard type
   * Determines which keyboard appears on mobile:
   * - 'default': Standard keyboard
   * - 'email-address': Email keyboard with @ and .
   * - 'numeric': Number pad
   * - 'phone-pad': Phone number keyboard
   */
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';

  /**
   * Auto-capitalization behavior
   * - 'none': No auto-capitalization (for email, username)
   * - 'sentences': Capitalize first letter of sentences (default)
   * - 'words': Capitalize every word
   * - 'characters': Capitalize every character
   */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';

  /**
   * Whether to auto-focus this input when screen loads
   * Useful for first input in a form
   */
  autoFocus?: boolean;

  /**
   * Whether the input is editable
   * Similar to disabled, but for read-only values
   */
  editable?: boolean;

  /**
   * Maximum number of characters allowed
   * Input will stop accepting characters at this limit
   */
  maxLength?: number;
}

/**
 * TextInput Component
 *
 * A fully-featured text input with label, error handling, and helper text.
 * Follows mobile best practices and our design system.
 */
export default function TextInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  disabled = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoFocus = false,
  editable = true,
  maxLength,
  ...rest // Spread remaining props to TextInput
}: TextInputProps) {
  /**
   * Focus State
   *
   * We track whether the input is focused to show a visual indicator.
   * This improves UX by making it clear which field is active.
   *
   * useState is a React Hook that lets us add state to functional components.
   * - isFocused: current value (true/false)
   * - setIsFocused: function to update the value
   */
  const [isFocused, setIsFocused] = useState(false);

  /**
   * Input State Styling
   *
   * The input's appearance changes based on its state:
   * - Error state: Red border and background tint
   * - Focused state: Primary color border (highlights active input)
   * - Disabled state: Gray background, reduced opacity
   * - Default state: Light border
   *
   * This visual feedback helps users understand the form's state.
   */
  const hasError = !!error; // !! converts to boolean
  const isDisabled = disabled || !editable;

  return (
    <View style={styles.container}>
      {/*
        Label

        Labels are essential for:
        1. Accessibility - Screen readers announce them
        2. Clarity - Users know what to enter
        3. Touch target - Tapping label focuses input (could be enhanced)

        We use our design system's 'special.label' typography style.
      */}
      <Text style={styles.label}>{label}</Text>

      {/*
        Input Container

        Wraps the TextInput to provide:
        - Border styling based on state
        - Background color
        - Padding
        - Shadow for depth

        We use a container instead of styling TextInput directly because
        some styles don't work reliably on TextInput across platforms.
      */}
      <View
        style={[
          styles.inputContainer,
          // Conditional styling based on state
          // This is a common React Native pattern
          isFocused && !hasError && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
          isDisabled && styles.inputContainerDisabled,
        ]}
      >
        {/*
          TextInput (React Native's built-in component)

          The actual text input field. We configure it with:
          - Value and onChangeText for controlled input
          - Keyboard type for mobile keyboards
          - Auto-capitalization settings
          - Placeholder text
          - Accessibility label (for screen readers)
          - Platform-specific optimizations
        */}
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary} // Light gray for placeholder
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoFocus={autoFocus}
          editable={!isDisabled}
          maxLength={maxLength}
          // Focus event handlers
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          // Accessibility
          accessibilityLabel={label}
          accessibilityHint={helperText || placeholder}
          // Styling
          style={[
            styles.input,
            isDisabled && styles.inputDisabled,
          ]}
          // Platform-specific props
          underlineColorAndroid="transparent" // Remove Android's default underline
          // Spread any additional props passed to this component
          {...rest}
        />
      </View>

      {/*
        Helper Text or Error Message

        Display helper text when no error, or error message when present.
        Error messages take priority over helper text.

        The space is always reserved (even if empty) to prevent layout shift
        when errors appear. This improves UX by keeping the form stable.
      */}
      <View style={styles.messageContainer}>
        {hasError ? (
          // Error Message
          <Text style={styles.errorText}>{error}</Text>
        ) : helperText ? (
          // Helper Text
          <Text style={styles.helperText}>{helperText}</Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Styles using Design System
 *
 * Every style here uses tokens from our theme instead of hardcoded values.
 * This ensures consistency and makes the app themeable in the future.
 *
 * STYLE PATTERNS:
 * - Container: Vertical layout with gaps
 * - Input container: Border, background, padding
 * - Conditional styles: Applied based on state (focused, error, disabled)
 * - Typography: From design system (body.regular, special.label, etc.)
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
  inputContainer: {
    backgroundColor: colors.surface, // White background
    borderRadius: radius.sm, // 8px rounded corners
    borderWidth: 1,
    borderColor: colors.border, // Light gray border
    paddingHorizontal: layout.inputPadding, // 16px horizontal padding
    paddingVertical: Platform.select({
      // Platform-specific padding for alignment
      ios: spacing.md, // 16px on iOS
      android: spacing.sm, // 12px on Android (text centers differently)
    }) ?? spacing.md,
    ...shadowSm, // Subtle shadow for depth
  },
  inputContainerFocused: {
    borderColor: colors.primary, // Purple border when focused
    borderWidth: 2, // Slightly thicker border for emphasis
  },
  inputContainerError: {
    borderColor: colors.error, // Red border when error
    backgroundColor: colors.errorLight + '10', // Very light red tint (10% opacity)
    borderWidth: 2,
  },
  inputContainerDisabled: {
    backgroundColor: colors.disabledBackground, // Gray background
    borderColor: colors.disabled,
    opacity: 0.6, // Reduced opacity for "inactive" appearance
  },
  input: {
    ...body.regular, // 16px, normal weight
    color: colors.textPrimary,
    padding: 0, // Remove default padding (container handles it)
    // Ensure text aligns properly
    includeFontPadding: false, // Android: remove extra font padding
    textAlignVertical: 'center', // Android: center text vertically
  },
  inputDisabled: {
    color: colors.textSecondary, // Lighter text for disabled state
  },
  messageContainer: {
    minHeight: spacing.lg, // Reserve space for messages (24px)
    marginTop: layout.labelGap, // Space above message (8px)
  },
  errorText: {
    ...special.helper, // 12px helper text style
    color: colors.error, // Red color for errors
  },
  helperText: {
    ...special.helper, // 12px helper text style
    color: colors.textSecondary, // Gray for helper text
  },
});

/**
 * LEARNING NOTES:
 *
 * 1. CONTROLLED COMPONENTS
 *    This input is "controlled" - its value is managed by React state.
 *    The parent component stores the value and passes it down as a prop.
 *    This allows validation, formatting, and full control over the input.
 *
 *    Example usage:
 *    ```tsx
 *    const [email, setEmail] = useState('');
 *    <TextInput label="Email" value={email} onChangeText={setEmail} />
 *    ```
 *
 * 2. VISUAL FEEDBACK
 *    Good form UX requires clear visual states:
 *    - Default: Neutral appearance
 *    - Focused: Highlighted (primary color border)
 *    - Error: Red border and message
 *    - Disabled: Grayed out
 *
 *    Users should never wonder which field is active or if something's wrong.
 *
 * 3. ACCESSIBILITY
 *    We include:
 *    - accessibilityLabel: What the field is for
 *    - accessibilityHint: Additional context
 *    - Proper contrast ratios for text
 *    - Touch-friendly sizing (44px+ height)
 *
 *    These make the app usable for everyone, including those using
 *    screen readers or other assistive technologies.
 *
 * 4. PLATFORM DIFFERENCES
 *    React Native abstracts many platform differences, but some remain:
 *    - Padding: iOS and Android render text differently
 *    - underlineColorAndroid: Android adds a default underline
 *    - includeFontPadding: Android adds extra font padding
 *
 *    We handle these with Platform.select() for platform-specific values.
 *
 * 5. DESIGN SYSTEM BENEFITS
 *    By using theme tokens:
 *    - Change colors.primary once → all inputs update
 *    - Spacing is consistent across all forms
 *    - Typography matches the rest of the app
 *    - Easy to create a dark mode (swap color palette)
 *
 * 6. PROPS SPREADING
 *    The `...rest` in props spreads any additional TextInput props.
 *    This means you can use standard props like:
 *    - returnKeyType="next"
 *    - onSubmitEditing={() => nextInput.current?.focus()}
 *    - secureTextEntry (though we have PasswordInput for this)
 *
 * MOBILE BEST PRACTICES:
 * ✓ Large touch targets (input height ~48px)
 * ✓ Clear visual states (focused, error, disabled)
 * ✓ Appropriate keyboard types (email, numeric, etc.)
 * ✓ Auto-capitalization control (none for email)
 * ✓ Placeholder text for hints
 * ✓ Error messages close to the input
 * ✓ Consistent with platform conventions
 *
 * USAGE EXAMPLES:
 *
 * Email input:
 * ```tsx
 * <TextInput
 *   label="Email"
 *   value={email}
 *   onChangeText={setEmail}
 *   placeholder="you@example.com"
 *   keyboardType="email-address"
 *   autoCapitalize="none"
 *   error={emailError}
 * />
 * ```
 *
 * Name input:
 * ```tsx
 * <TextInput
 *   label="Full Name"
 *   value={name}
 *   onChangeText={setName}
 *   placeholder="John Doe"
 *   autoCapitalize="words"
 *   helperText="This will be displayed on your profile"
 * />
 * ```
 */
