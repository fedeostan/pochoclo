/**
 * EditPreferencesModal Component
 *
 * A full-screen modal for editing learning preferences.
 * Allows users to modify categories and daily learning time.
 *
 * STATE MANAGEMENT:
 * - Redux: Source of truth for current preferences
 * - Local state: Temporary edits before saving
 *
 * WHY LOCAL STATE FOR EDITS?
 * We copy Redux values to local state so the user can:
 * - Make changes without immediately affecting the app
 * - Cancel and discard changes
 * - See a "dirty" state (changes made but not saved)
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, TextInput, Alert, ScrollView } from 'react-native';
import type { FullScreenModalRef } from '@/components/ui/FullScreenModal';
import {
  Text,
  Button,
  CategoryChip,
  CategoryChipGroup,
  TimeOptionCard,
  TimeOptionCardGroup,
} from '@/components/ui';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { useAppDispatch, useAppSelector } from '@/store';
import { updatePreferencesAsync } from '@/store/slices/userPreferencesSlice';
import {
  PREDEFINED_CATEGORIES,
  CATEGORY_DISPLAY_NAMES,
  PredefinedCategory,
  isCustomCategory,
  createCustomCategory,
  getCategoryDisplayName,
  validateCustomCategory,
  PREDEFINED_TIME_OPTIONS,
  validateCustomTime,
  CUSTOM_TIME_MIN,
  CUSTOM_TIME_MAX,
} from '@/types/preferences';

interface EditPreferencesModalProps {
  onDismiss?: () => void;
}

export interface EditPreferencesModalRef {
  present: () => void;
  dismiss: () => void;
}

export const EditPreferencesModal = forwardRef<EditPreferencesModalRef, EditPreferencesModalProps>(
  function EditPreferencesModal({ onDismiss }, ref) {
    const modalRef = useRef<FullScreenModalRef>(null);

    useImperativeHandle(ref, () => ({
      present: () => {
        // Re-initialize state from Redux when presenting
        initializeFromRedux();
        modalRef.current?.present();
      },
      dismiss: () => modalRef.current?.dismiss(),
    }));

    const dispatch = useAppDispatch();
    const {
      categories: reduxCategories,
      dailyLearningMinutes: reduxMinutes,
      saving,
    } = useAppSelector((state) => state.userPreferences);
    const { user } = useAppSelector((state) => state.auth);

    // Category state
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
    const [customCategoryInput, setCustomCategoryInput] = useState('');
    const [customCategoryError, setCustomCategoryError] = useState('');

    // Time state
    const [selectedTime, setSelectedTime] = useState<number | null>(null);
    const [isOtherSelected, setIsOtherSelected] = useState(false);
    const [customMinutesInput, setCustomMinutesInput] = useState('');
    const [customTimeError, setCustomTimeError] = useState('');

    // Initialize local state from Redux
    const initializeFromRedux = () => {
      setSelectedCategories([...reduxCategories]);
      setShowCustomCategoryInput(false);
      setCustomCategoryInput('');
      setCustomCategoryError('');
      setCustomTimeError('');

      if (reduxMinutes !== null) {
        const isPredefined = PREDEFINED_TIME_OPTIONS.some(
          (opt) => opt.minutes === reduxMinutes
        );

        if (isPredefined) {
          setSelectedTime(reduxMinutes);
          setIsOtherSelected(false);
          setCustomMinutesInput('');
        } else {
          setSelectedTime(reduxMinutes);
          setIsOtherSelected(true);
          setCustomMinutesInput(String(reduxMinutes));
        }
      } else {
        setSelectedTime(null);
        setIsOtherSelected(false);
        setCustomMinutesInput('');
      }
    };

    // Initialize on mount
    useEffect(() => {
      initializeFromRedux();
    }, []);

    const handleDismiss = () => {
      onDismiss?.();
    };

    // Derived state
    const customCategories = selectedCategories.filter(isCustomCategory);
    const selectedPredefined = selectedCategories.filter((c) => !isCustomCategory(c));

    // Category handlers
    const handleToggleCategory = (category: PredefinedCategory) => {
      setSelectedCategories((prev) => {
        if (prev.includes(category)) {
          return prev.filter((c) => c !== category);
        } else {
          return [...prev, category];
        }
      });
    };

    const handleAddCustomCategory = () => {
      setCustomCategoryError('');
      const validation = validateCustomCategory(customCategoryInput);
      if (!validation.isValid) {
        setCustomCategoryError(validation.error ?? 'Invalid category');
        return;
      }

      const customCategoryId = createCustomCategory(customCategoryInput);
      if (selectedCategories.includes(customCategoryId)) {
        setCustomCategoryError('This category is already selected');
        return;
      }

      setSelectedCategories((prev) => [...prev, customCategoryId]);
      setCustomCategoryInput('');
      setShowCustomCategoryInput(false);
    };

    const handleRemoveCustomCategory = (category: string) => {
      setSelectedCategories((prev) => prev.filter((c) => c !== category));
    };

    // Time handlers
    const handleSelectPredefinedTime = (minutes: number) => {
      setIsOtherSelected(false);
      setCustomMinutesInput('');
      setCustomTimeError('');
      setSelectedTime(minutes);
    };

    const handleSelectOther = () => {
      setIsOtherSelected(true);
      setSelectedTime(null);
    };

    const handleCustomMinutesChange = (text: string) => {
      const numericOnly = text.replace(/[^0-9]/g, '');
      setCustomMinutesInput(numericOnly);
      setCustomTimeError('');

      if (!numericOnly) {
        setSelectedTime(null);
        return;
      }

      const minutes = parseInt(numericOnly, 10);
      const validation = validateCustomTime(minutes);
      if (validation.isValid) {
        setSelectedTime(minutes);
      } else {
        setSelectedTime(null);
      }
    };

    const handleCustomInputBlur = () => {
      if (!customMinutesInput) return;
      const minutes = parseInt(customMinutesInput, 10);
      const validation = validateCustomTime(minutes);
      if (!validation.isValid) {
        setCustomTimeError(validation.error ?? 'Invalid time');
      }
    };

    // Form validation
    const isFormValid = (() => {
      if (selectedCategories.length === 0) return false;
      if (!isOtherSelected) {
        return selectedTime !== null;
      } else {
        const minutes = parseInt(customMinutesInput, 10);
        return validateCustomTime(minutes).isValid;
      }
    })();

    const hasChanges = (() => {
      const categoriesChanged =
        selectedCategories.length !== reduxCategories.length ||
        !selectedCategories.every((c) => reduxCategories.includes(c));
      const timeChanged = selectedTime !== reduxMinutes;
      return categoriesChanged || timeChanged;
    })();

    // Save handler
    const handleSaveChanges = async () => {
      if (!isFormValid || selectedTime === null) return;

      if (isOtherSelected) {
        const minutes = parseInt(customMinutesInput, 10);
        const validation = validateCustomTime(minutes);
        if (!validation.isValid) {
          setCustomTimeError(validation.error ?? 'Invalid time');
          return;
        }
      }

      if (!user?.uid) {
        Alert.alert('Authentication Error', 'Please sign in again.');
        return;
      }

      try {
        await dispatch(
          updatePreferencesAsync({
            userId: user.uid,
            updates: {
              categories: selectedCategories,
              dailyLearningMinutes: selectedTime,
            },
          })
        ).unwrap();

        Alert.alert(
          'Preferences Saved',
          'Your learning preferences have been updated.',
          [{ text: 'OK', onPress: () => modalRef.current?.dismiss() }]
        );
      } catch {
        Alert.alert(
          'Save Failed',
          'Could not save your preferences. Please try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: handleSaveChanges },
          ]
        );
      }
    };

    return (
      <FullScreenModal
        ref={modalRef}
        title="Learning Preferences"
        onDismiss={handleDismiss}
        scrollable={false}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Categories Section */}
          <View className="mb-8">
            <Text variant="h2" className="mb-2">
              Learning Topics
            </Text>
            <Text variant="muted" className="mb-4">
              Select the topics you want to learn about.
            </Text>

            {/* Predefined */}
            <View className="mb-4">
              <Text variant="small" className="text-muted-foreground mb-3">
                Popular Topics
              </Text>
              <CategoryChipGroup>
                {PREDEFINED_CATEGORIES.map((category) => (
                  <CategoryChip
                    key={category}
                    label={CATEGORY_DISPLAY_NAMES[category]}
                    selected={selectedPredefined.includes(category)}
                    onPress={() => handleToggleCategory(category)}
                  />
                ))}
              </CategoryChipGroup>
            </View>

            {/* Custom Categories */}
            {customCategories.length > 0 && (
              <View className="mb-4">
                <Text variant="small" className="text-muted-foreground mb-3">
                  Your Topics
                </Text>
                <CategoryChipGroup>
                  {customCategories.map((category) => (
                    <CategoryChip
                      key={category}
                      label={getCategoryDisplayName(category)}
                      selected
                      showRemoveIcon
                      onPress={() => handleRemoveCustomCategory(category)}
                    />
                  ))}
                </CategoryChipGroup>
              </View>
            )}

            {/* Add Custom */}
            <View>
              {!showCustomCategoryInput ? (
                <CategoryChip
                  label="Add Custom Topic"
                  isAddButton
                  onPress={() => setShowCustomCategoryInput(true)}
                />
              ) : (
                <View className="bg-card rounded-xl p-4 border-2 border-border">
                  <Text variant="small" className="text-foreground mb-2 font-medium">
                    Add a custom topic
                  </Text>
                  <TextInput
                    className="bg-background rounded-lg px-4 py-3 text-foreground border border-border mb-2"
                    placeholder="e.g., Blockchain, Machine Learning"
                    placeholderTextColor="#78716C"
                    value={customCategoryInput}
                    onChangeText={setCustomCategoryInput}
                    onSubmitEditing={handleAddCustomCategory}
                    autoFocus
                    maxLength={50}
                    autoCapitalize="words"
                  />
                  {customCategoryError && (
                    <Text className="text-destructive text-sm mb-2">
                      {customCategoryError}
                    </Text>
                  )}
                  <View className="flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => {
                        setShowCustomCategoryInput(false);
                        setCustomCategoryInput('');
                        setCustomCategoryError('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onPress={handleAddCustomCategory}
                      disabled={customCategoryInput.trim().length < 2}
                      className="flex-1"
                    >
                      Add
                    </Button>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Time Section */}
          <View className="mb-6">
            <Text variant="h2" className="mb-2">
              Daily Learning Time
            </Text>
            <Text variant="muted" className="mb-4">
              How much time can you dedicate each day?
            </Text>

            <TimeOptionCardGroup>
              {PREDEFINED_TIME_OPTIONS.map((option) => (
                <TimeOptionCard
                  key={option.minutes}
                  label={option.label}
                  description={option.description}
                  selected={!isOtherSelected && selectedTime === option.minutes}
                  onPress={() => handleSelectPredefinedTime(option.minutes)}
                />
              ))}

              <TimeOptionCard
                label="Other"
                description="Set your own time"
                selected={isOtherSelected}
                onPress={handleSelectOther}
                isOtherOption
              >
                {isOtherSelected && (
                  <View>
                    <View className="flex-row items-center gap-2">
                      <TextInput
                        className="flex-1 bg-background rounded-lg px-4 py-3 text-foreground border border-border"
                        placeholder={`Enter minutes (${CUSTOM_TIME_MIN}-${CUSTOM_TIME_MAX})`}
                        placeholderTextColor="#78716C"
                        value={customMinutesInput}
                        onChangeText={handleCustomMinutesChange}
                        onBlur={handleCustomInputBlur}
                        keyboardType="number-pad"
                        maxLength={3}
                        autoFocus
                      />
                      <Text className="text-muted-foreground">min/day</Text>
                    </View>
                    {customTimeError && (
                      <Text className="text-destructive text-sm mt-2">
                        {customTimeError}
                      </Text>
                    )}
                  </View>
                )}
              </TimeOptionCard>
            </TimeOptionCardGroup>
          </View>

          {/* Validation hint */}
          {!isFormValid && (
            <View className="mb-4">
              {selectedCategories.length === 0 && (
                <Text className="text-muted-foreground text-sm">
                  Select at least 1 topic to save.
                </Text>
              )}
              {selectedCategories.length > 0 && selectedTime === null && (
                <Text className="text-muted-foreground text-sm">
                  Select a daily learning time to save.
                </Text>
              )}
            </View>
          )}
        </ScrollView>

        {/* Fixed bottom button */}
        <View className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-2 bg-background">
          <Button
            onPress={handleSaveChanges}
            disabled={!isFormValid || !hasChanges || saving}
            isLoading={saving}
          >
            {hasChanges ? 'Save Changes' : 'No Changes'}
          </Button>
        </View>
      </FullScreenModal>
    );
  }
);
