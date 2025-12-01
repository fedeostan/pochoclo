/**
 * AboutModal Component
 *
 * A full-screen modal displaying app information:
 * - App identity (name, tagline, version)
 * - Legal links (Privacy Policy, Terms of Service)
 * - Developer attribution
 */

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Alert, ScrollView } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { FileText, Shield, Globe, Heart } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import type { FullScreenModalRef } from '@/components/ui/FullScreenModal';
import { SettingsSection, SettingsItem } from '@/components/profile';
import { colors } from '@/theme';
import Constants from 'expo-constants';

function getAppVersion(): string {
  return Constants.expoConfig?.version || '1.0.0';
}

function getBuildNumber(): string | null {
  const nativeBuild = Constants.expoConfig?.ios?.buildNumber
    || Constants.expoConfig?.android?.versionCode?.toString();
  if (nativeBuild) return nativeBuild;

  const runtimeVersion = Constants.expoConfig?.runtimeVersion;
  if (typeof runtimeVersion === 'string') return runtimeVersion;

  return null;
}

const LEGAL_URLS = {
  privacyPolicy: 'https://pochoclo.app/privacy',
  termsOfService: 'https://pochoclo.app/terms',
  website: 'https://pochoclo.app',
};

interface AboutModalProps {
  onDismiss?: () => void;
}

export interface AboutModalRef {
  present: () => void;
  dismiss: () => void;
}

export const AboutModal = forwardRef<AboutModalRef, AboutModalProps>(
  function AboutModal({ onDismiss }, ref) {
    const modalRef = useRef<FullScreenModalRef>(null);

    useImperativeHandle(ref, () => ({
      present: () => modalRef.current?.present(),
      dismiss: () => modalRef.current?.dismiss(),
    }));

    const appVersion = getAppVersion();
    const buildNumber = getBuildNumber();

    const handleDismiss = () => {
      onDismiss?.();
    };

    const openUrl = async (url: string, label: string) => {
      try {
        await WebBrowser.openBrowserAsync(url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        });
      } catch (error) {
        console.error(`[About] Error opening ${label}:`, error);
        Alert.alert('Cannot Open Page', `Please visit ${url} in your browser.`);
      }
    };

    const handlePrivacyPolicy = () => openUrl(LEGAL_URLS.privacyPolicy, 'Privacy Policy');
    const handleTermsOfService = () => openUrl(LEGAL_URLS.termsOfService, 'Terms of Service');
    const handleWebsite = () => openUrl(LEGAL_URLS.website, 'Website');

    return (
      <FullScreenModal
        ref={modalRef}
        title="About"
        onDismiss={handleDismiss}
        scrollable={false}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* App Identity */}
          <View className="items-center mb-8">
            <View
              className="w-20 h-20 rounded-2xl bg-primary items-center justify-center mb-4"
              accessibilityLabel="POCHOCLO app icon"
            >
              <Text className="text-white text-3xl font-bold">P</Text>
            </View>

            <Text variant="h1" className="text-center mb-1">
              POCHOCLO
            </Text>

            <Text variant="muted" className="text-center mb-4">
              Learn in small bites
            </Text>

            <View className="items-center">
              <Text variant="body" className="text-center">
                Version {appVersion}
              </Text>
              {buildNumber && (
                <Text variant="small" className="text-muted-foreground text-center mt-1">
                  Build {buildNumber}
                </Text>
              )}
            </View>
          </View>

          {/* Legal */}
          <SettingsSection title="Legal">
            <SettingsItem
              icon={<Shield size={20} color={colors.primary} />}
              label="Privacy Policy"
              type="navigation"
              onPress={handlePrivacyPolicy}
            />
            <SettingsItem
              icon={<FileText size={20} color={colors.primary} />}
              label="Terms of Service"
              type="navigation"
              onPress={handleTermsOfService}
              showBorder={false}
            />
          </SettingsSection>

          {/* Connect */}
          <SettingsSection title="Connect">
            <SettingsItem
              icon={<Globe size={20} color={colors.primary} />}
              label="Visit Website"
              type="navigation"
              onPress={handleWebsite}
              showBorder={false}
            />
          </SettingsSection>

          {/* Spacer */}
          <View className="flex-1 min-h-4" />

          {/* Footer */}
          <View className="items-center py-6">
            <View className="flex-row items-center mb-2">
              <Text variant="small" className="text-muted-foreground">
                Made with{' '}
              </Text>
              <Heart size={14} color={colors.primary} fill={colors.primary} />
              <Text variant="small" className="text-muted-foreground">
                {' '}for learners
              </Text>
            </View>
            <Text variant="small" className="text-muted-foreground text-center">
              {new Date().getFullYear()} POCHOCLO
            </Text>
          </View>
        </ScrollView>
      </FullScreenModal>
    );
  }
);
