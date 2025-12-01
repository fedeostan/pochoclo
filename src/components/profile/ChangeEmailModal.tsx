/**
 * ChangeEmailModal Component
 *
 * A full-screen modal for changing the user's email address.
 * This is a security-sensitive operation that requires:
 * 1. User verification (current password)
 * 2. Email verification on the NEW email address
 *
 * IMPORTANT: EMAIL IS NOT CHANGED IMMEDIATELY!
 *
 * Unlike password changes, email changes use a two-step verification:
 * 1. User requests the change (this modal)
 * 2. Firebase sends a verification link to the NEW email
 * 3. User clicks the link to confirm they own the new email
 * 4. Only THEN does the email actually change
 *
 * WHY A MODAL?
 * =============
 * Using a full-screen bottom sheet modal instead of stack navigation:
 * - Always returns to Profile when dismissed (no navigation history issues)
 * - Natural swipe-down to dismiss
 * - Cleaner UX for settings-type forms
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, Input } from '@/components/ui';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import type { FullScreenModalRef } from '@/components/ui/FullScreenModal';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateUserEmail, clearError } from '@/store/slices/authSlice';
import { validateEmail } from '@/utils/validation';
import { Mail, Info } from 'lucide-react-native';

/**
 * ChangeEmailModal Props
 */
interface ChangeEmailModalProps {
  /** Called when modal is dismissed (success or cancel) */
  onDismiss?: () => void;
}

/**
 * Ref methods exposed by ChangeEmailModal
 */
export interface ChangeEmailModalRef {
  /** Show the modal */
  present: () => void;
  /** Hide the modal */
  dismiss: () => void;
}

/**
 * ChangeEmailModal Component
 *
 * A form-based modal for initiating an email address change.
 */
export const ChangeEmailModal = forwardRef<ChangeEmailModalRef, ChangeEmailModalProps>(
  function ChangeEmailModal({ onDismiss }, ref) {
    // Ref to the underlying FullScreenModal
    const modalRef = useRef<FullScreenModalRef>(null);

    /**
     * Expose present/dismiss methods to parent
     */
    useImperativeHandle(ref, () => ({
      present: () => modalRef.current?.present(),
      dismiss: () => modalRef.current?.dismiss(),
    }));

    /**
     * Redux Hooks
     */
    const dispatch = useAppDispatch();
    const { user, loading, error: authError } = useAppSelector((state) => state.auth);

    /**
     * Local Form State
     */
    const [newEmail, setNewEmail] = useState('');
    const [password, setPassword] = useState('');
    const [validationError, setValidationError] = useState('');

    /**
     * Clear Form on Dismiss
     *
     * Reset form state when modal is dismissed so it's fresh next time.
     */
    const handleDismiss = () => {
      setNewEmail('');
      setPassword('');
      setValidationError('');
      dispatch(clearError());
      onDismiss?.();
    };

    /**
     * Clear Auth Error on Mount
     */
    useEffect(() => {
      dispatch(clearError());
    }, [dispatch]);

    /**
     * Form Validation
     */
    const emailValidationError = validateEmail(newEmail);
    const isDifferentEmail = newEmail.toLowerCase() !== (user?.email?.toLowerCase() || '');
    const isFormValid =
      !emailValidationError &&
      isDifferentEmail &&
      password.length > 0;

    /**
     * Form Submission Handler
     */
    const handleChangeEmail = async () => {
      setValidationError('');
      dispatch(clearError());

      // Validate email format
      const emailError = validateEmail(newEmail);
      if (emailError) {
        setValidationError(emailError);
        return;
      }

      // Validate email is different
      if (!isDifferentEmail) {
        setValidationError('New email must be different from your current email');
        return;
      }

      // Validate password is entered
      if (!password) {
        setValidationError('Please enter your password to confirm this change');
        return;
      }

      try {
        await dispatch(
          updateUserEmail({
            currentPassword: password,
            newEmail: newEmail.toLowerCase().trim(),
          })
        ).unwrap();

        // Success! Show explanation and dismiss
        Alert.alert(
          'Verification Email Sent',
          `We've sent a verification link to ${newEmail}.\n\nPlease check your inbox and click the link to complete the email change.\n\nYour current email will continue to work until you verify the new one.`,
          [
            {
              text: 'Got It',
              onPress: () => modalRef.current?.dismiss(),
            },
          ]
        );
      } catch {
        // Error is already set in Redux state
      }
    };

    // Determine which error to show
    const displayError = validationError || authError;

    return (
      <FullScreenModal
        ref={modalRef}
        title="Change Email"
        onDismiss={handleDismiss}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          <View className="flex-1">
            {/**
             * Current Email Display
             */}
            <View className="mb-6 p-4 bg-card rounded-lg border border-border">
              <Text variant="muted" className="text-xs uppercase tracking-wide mb-1">
                Current Email
              </Text>
              <View className="flex-row items-center">
                <Mail size={18} color="#6B8E7B" />
                <Text className="text-foreground font-medium ml-2">
                  {user?.email || 'No email set'}
                </Text>
              </View>
            </View>

            {/**
             * Info Banner
             */}
            <View className="mb-6 p-4 bg-primary/10 rounded-lg flex-row">
              <Info size={20} color="#6B8E7B" />
              <View className="flex-1 ml-3">
                <Text variant="body" className="text-foreground">
                  After submitting, you'll receive a verification link at your new email address.{' '}
                  <Text className="font-semibold">Your email won't change until you click that link.</Text>
                </Text>
              </View>
            </View>

            {/**
             * Form Section
             */}
            <View className="gap-4">
              <Input
                label="New Email Address"
                placeholder="your.new.email@example.com"
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              <Input
                label="Confirm with Password"
                placeholder="Enter your current password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                helperText="Required to verify your identity"
                onSubmitEditing={handleChangeEmail}
              />
            </View>

            {/**
             * Error Message
             */}
            {displayError && (
              <View className="bg-destructive rounded-lg p-4 mt-4">
                <Text className="text-destructive-foreground text-sm">
                  {displayError}
                </Text>
              </View>
            )}

            {/* Spacer */}
            <View className="flex-1" />

            {/**
             * Submit Button
             */}
            <View className="pt-4">
              <Button
                onPress={handleChangeEmail}
                isLoading={loading}
                disabled={loading || !isFormValid}
              >
                Send Verification Email
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </FullScreenModal>
    );
  }
);

/**
 * LEARNING NOTES:
 *
 * 1. MODAL vs SCREEN PATTERN
 *    This component converts a navigation screen into a modal.
 *    Key differences:
 *    - No router.push/router.back - use present/dismiss
 *    - No SafeAreaView - FullScreenModal handles safe areas
 *    - No NavBar - FullScreenModal has its own header
 *    - Reset form on dismiss (modal might be reused)
 *
 * 2. useImperativeHandle
 *    This React hook lets us expose custom methods to the parent via ref.
 *    Instead of exposing the entire BottomSheetModal, we only expose:
 *    - present(): Show the modal
 *    - dismiss(): Hide the modal
 *
 *    This provides a cleaner API and hides implementation details.
 *
 * 3. FORM STATE LIFECYCLE
 *    - Initialize empty on first render
 *    - User fills form
 *    - On success: Alert → dismiss → form resets via handleDismiss
 *    - On cancel: dismiss → form resets via handleDismiss
 *    - On swipe down: same as cancel
 *
 * 4. KEYBOARD HANDLING
 *    We still use KeyboardAvoidingView inside the modal.
 *    The modal handles some keyboard behavior, but forms need
 *    the extra help to keep the submit button visible.
 */
