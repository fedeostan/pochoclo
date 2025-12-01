/**
 * Profile Components - Barrel Export
 *
 * This index file exports all profile-related components from a single location.
 * It follows the "barrel export" pattern for cleaner imports.
 *
 * USAGE:
 * Instead of:
 *   import { ProfileHeader } from '@/components/profile/ProfileHeader';
 *   import { SettingsSection } from '@/components/profile/SettingsSection';
 *   import { SettingsItem } from '@/components/profile/SettingsItem';
 *
 * You can write:
 *   import { ProfileHeader, SettingsSection, SettingsItem } from '@/components/profile';
 *
 * COMPONENTS:
 * - ProfileHeader: User identity section (avatar, name, email, member since)
 * - SettingsSection: Grouped section container with title
 * - SettingsItem: Individual setting row (navigation, toggle, or display)
 *
 * MODALS (Full-screen bottom sheets for profile sub-screens):
 * - ChangeEmailModal: Change email address form
 * - ChangePasswordModal: Change password form
 * - EditPreferencesModal: Edit learning preferences (categories, time)
 * - HelpModal: Help & FAQ content
 * - AboutModal: App information and legal links
 */

// Core profile components
export { ProfileHeader } from './ProfileHeader';
export { SettingsSection } from './SettingsSection';
export { SettingsItem } from './SettingsItem';

// Profile sub-screen modals
export { ChangeEmailModal } from './ChangeEmailModal';
export type { ChangeEmailModalRef } from './ChangeEmailModal';

export { ChangePasswordModal } from './ChangePasswordModal';
export type { ChangePasswordModalRef } from './ChangePasswordModal';

export { EditPreferencesModal } from './EditPreferencesModal';
export type { EditPreferencesModalRef } from './EditPreferencesModal';

export { HelpModal } from './HelpModal';
export type { HelpModalRef } from './HelpModal';

export { AboutModal } from './AboutModal';
export type { AboutModalRef } from './AboutModal';
