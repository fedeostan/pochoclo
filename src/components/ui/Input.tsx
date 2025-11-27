/**
 * Input Component
 *
 * A styled text input component with label, helper text, and error states.
 * Built for forms with full accessibility support.
 *
 * WHY WE NEED THIS:
 * - Consistent input styling across all forms
 * - Built-in label and error handling
 * - Accessible by default (labels linked to inputs)
 * - Clean, minimal design matching our aesthetic
 *
 * DESIGN PRINCIPLES:
 * - Minimal: Clean borders, no heavy styling
 * - Clear: Labels and errors are easy to read
 * - Accessible: Proper labeling and error announcement
 * - Soft: Gentle focus states, not harsh colors
 */

import React, { forwardRef, useState } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  Pressable,
} from "react-native";
import { cn } from "@/utils";
import { Text } from "./Text";
import { Eye, EyeOff } from "lucide-react-native";

/**
 * Input Props
 *
 * @extends TextInputProps - All standard React Native TextInput props
 * @property label - Text label shown above the input
 * @property helperText - Helper text shown below the input
 * @property error - Error message (also sets error styling)
 * @property leftIcon - Icon element to show on the left
 * @property rightIcon - Icon element to show on the right
 * @property containerClassName - Classes for the outer container
 * @property inputClassName - Classes for the input itself
 */
interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  inputClassName?: string;
}

/**
 * Input Component
 *
 * Uses forwardRef to allow parent components to access the TextInput ref.
 * This is useful for:
 * - Focusing inputs programmatically
 * - Form libraries that need ref access
 * - Chaining focus between inputs (press "next" to focus next input)
 *
 * @example
 * // Basic input with label
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   keyboardType="email-address"
 * />
 *
 * @example
 * // Input with error
 * <Input
 *   label="Password"
 *   secureTextEntry
 *   error="Password must be at least 8 characters"
 * />
 *
 * @example
 * // Input with helper text
 * <Input
 *   label="Username"
 *   helperText="This will be visible to other users"
 * />
 *
 * @example
 * // Input with icons
 * <Input
 *   label="Search"
 *   leftIcon={<SearchIcon />}
 *   placeholder="Search..."
 * />
 */
export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      containerClassName,
      inputClassName,
      secureTextEntry,
      ...props
    },
    ref
  ) => {
    // State for password visibility toggle
    // Only relevant when secureTextEntry is true
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // Determine if we should show the password toggle
    const showPasswordToggle = secureTextEntry !== undefined;

    // Track focus state for styling
    const [isFocused, setIsFocused] = useState(false);

    // Has error if error prop is provided and not empty
    const hasError = !!error;

    return (
      <View className={cn("w-full", containerClassName)}>
        {/* Label - shown above the input */}
        {label && (
          <Text className="mb-2 text-sm font-medium text-foreground">
            {label}
          </Text>
        )}

        {/* Input container - handles border, icons, and the input itself */}
        <View
          className={cn(
            // Base styles
            "flex-row items-center rounded-lg border-2 bg-card px-4",
            // Default border
            "border-border",
            // Focus state - primary color ring
            isFocused && "border-primary",
            // Error state - destructive color
            hasError && "border-destructive-foreground"
          )}
        >
          {/* Left icon */}
          {leftIcon && (
            <View className="mr-3">
              {leftIcon}
            </View>
          )}

          {/* The actual text input */}
          <TextInput
            ref={ref}
            className={cn(
              // Base input styles
              "flex-1 py-3 text-base text-foreground",
              // Placeholder color (set via placeholderTextColor prop below)
              inputClassName
            )}
            // Use our muted color for placeholder text
            placeholderTextColor="#78716C"
            // Handle password visibility
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            // Track focus for border styling
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            // Accessibility
            accessibilityLabel={label}
            accessibilityHint={helperText}
            {...props}
          />

          {/* Password visibility toggle */}
          {showPasswordToggle && (
            <Pressable
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              className="ml-3 p-1"
              accessibilityLabel={
                isPasswordVisible ? "Hide password" : "Show password"
              }
              accessibilityRole="button"
            >
              {isPasswordVisible ? (
                <EyeOff size={20} color="#78716C" />
              ) : (
                <Eye size={20} color="#78716C" />
              )}
            </Pressable>
          )}

          {/* Right icon (only if not a password field) */}
          {rightIcon && !showPasswordToggle && (
            <View className="ml-3">
              {rightIcon}
            </View>
          )}
        </View>

        {/* Error message - shown below input when there's an error */}
        {error && (
          <Text className="mt-2 text-sm text-destructive-foreground">
            {error}
          </Text>
        )}

        {/* Helper text - shown below input when no error */}
        {helperText && !error && (
          <Text className="mt-2 text-sm text-muted-foreground">
            {helperText}
          </Text>
        )}
      </View>
    );
  }
);

// Display name for React DevTools
Input.displayName = "Input";

/**
 * Export types for external use
 */
export type { InputProps };
