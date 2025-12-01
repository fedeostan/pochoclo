/**
 * ChangePasswordModal Component
 *
 * A full-screen modal for changing the user's password.
 * Requires current password verification for security.
 *
 * SECURITY FLOW:
 * 1. User enters current password (proves they own the account)
 * 2. User enters new password twice (prevents typos)
 * 3. We validate the new password (min 6 chars, matches confirmation)
 * 4. We reauthenticate with Firebase (verifies current password)
 * 5. We update the password in Firebase Auth
 * 6. User sees success message and modal dismisses
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, Input } from '@/components/ui';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import type { FullScreenModalRef } from '@/components/ui/FullScreenModal';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateUserPassword, clearError } from '@/store/slices/authSlice';

/** Password minimum length (Firebase requirement) */
const MIN_PASSWORD_LENGTH = 6;

interface ChangePasswordModalProps {
  onDismiss?: () => void;
}

export interface ChangePasswordModalRef {
  present: () => void;
  dismiss: () => void;
}

export const ChangePasswordModal = forwardRef<ChangePasswordModalRef, ChangePasswordModalProps>(
  function ChangePasswordModal({ onDismiss }, ref) {
    const modalRef = useRef<FullScreenModalRef>(null);

    useImperativeHandle(ref, () => ({
      present: () => modalRef.current?.present(),
      dismiss: () => modalRef.current?.dismiss(),
    }));

    const dispatch = useAppDispatch();
    const { loading, error: authError } = useAppSelector((state) => state.auth);

    // Form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [validationError, setValidationError] = useState('');

    // Clear form on dismiss
    const handleDismiss = () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setValidationError('');
      dispatch(clearError());
      onDismiss?.();
    };

    useEffect(() => {
      dispatch(clearError());
    }, [dispatch]);

    // Form validation
    const isFormValid =
      currentPassword.length > 0 &&
      newPassword.length >= MIN_PASSWORD_LENGTH &&
      confirmPassword.length >= MIN_PASSWORD_LENGTH &&
      newPassword === confirmPassword;

    const handleChangePassword = async () => {
      setValidationError('');
      dispatch(clearError());

      if (!currentPassword) {
        setValidationError('Please enter your current password');
        return;
      }

      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        setValidationError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
        return;
      }

      if (newPassword !== confirmPassword) {
        setValidationError('New passwords do not match');
        return;
      }

      if (newPassword === currentPassword) {
        setValidationError('New password must be different from current password');
        return;
      }

      try {
        await dispatch(
          updateUserPassword({ currentPassword, newPassword })
        ).unwrap();

        Alert.alert(
          'Password Changed',
          'Your password has been updated successfully.',
          [{ text: 'OK', onPress: () => modalRef.current?.dismiss() }]
        );
      } catch {
        // Error handled by Redux
      }
    };

    const displayError = validationError || authError;

    return (
      <FullScreenModal
        ref={modalRef}
        title="Change Password"
        onDismiss={handleDismiss}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          <View className="flex-1">
            {/* Instructions */}
            <View className="mb-6">
              <Text variant="body" className="text-muted-foreground">
                For security, please enter your current password before setting a new one.
              </Text>
            </View>

            {/* Form */}
            <View className="gap-4">
              <Input
                label="Current Password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              <View className="py-2">
                <View className="border-t border-border" />
              </View>

              <Input
                label="New Password"
                placeholder="Enter your new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                helperText={`Must be at least ${MIN_PASSWORD_LENGTH} characters`}
              />

              <Input
                label="Confirm New Password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                onSubmitEditing={handleChangePassword}
              />
            </View>

            {/* Error */}
            {displayError && (
              <View className="bg-destructive rounded-lg p-4 mt-4">
                <Text className="text-destructive-foreground text-sm">
                  {displayError}
                </Text>
              </View>
            )}

            <View className="flex-1" />

            {/* Submit */}
            <View className="pt-4">
              <Button
                onPress={handleChangePassword}
                isLoading={loading}
                disabled={loading || !isFormValid}
              >
                Update Password
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </FullScreenModal>
    );
  }
);
