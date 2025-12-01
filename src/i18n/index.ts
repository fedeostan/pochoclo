/**
 * i18n Configuration - Internationalization Setup
 *
 * This file configures the internationalization (i18n) system for POCHOCLO.
 * It uses:
 * - expo-localization: To detect the device's language
 * - i18next: The core translation library
 * - react-i18next: React bindings for i18next
 *
 * PURPOSE:
 * ========
 * 1. Detect the user's device language automatically
 * 2. Support English (default) and Spanish
 * 3. Load translation files organized by feature
 * 4. Provide the useTranslation hook throughout the app
 *
 * LANGUAGE DETECTION LOGIC:
 * =========================
 * - If device language is Spanish (es, es-ES, es-MX, etc.) → Use Spanish
 * - Otherwise → Use English (default fallback)
 *
 * TRANSLATION FILE STRUCTURE:
 * ===========================
 * Translations are organized by feature (namespaces):
 * - common: Shared strings (buttons, errors, validation)
 * - auth: Authentication screens (welcome, sign-in, sign-up)
 * - onboarding: Onboarding flow (categories, time selection)
 * - home: Home screen
 * - profile: Profile and settings screens
 * - content: Content cards, full view, etc.
 *
 * USAGE IN COMPONENTS:
 * ====================
 * ```tsx
 * import { useTranslation } from 'react-i18next';
 *
 * function MyComponent() {
 *   const { t } = useTranslation('auth'); // Load 'auth' namespace
 *   return <Text>{t('welcome.title')}</Text>;
 * }
 * ```
 *
 * LEARNING NOTES:
 * ===============
 * 1. WHY NAMESPACES?
 *    - Organize translations by feature
 *    - Smaller files are easier to maintain
 *    - Lazy loading potential (load only what's needed)
 *
 * 2. WHY FALLBACK LANGUAGE?
 *    - If a translation is missing in Spanish, show English instead
 *    - Better than showing translation keys to users
 *
 * 3. WHY DETECT DEVICE LANGUAGE?
 *    - Better UX: App feels native without manual configuration
 *    - Less friction for new users
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// =============================================================================
// IMPORT TRANSLATION FILES
// =============================================================================

// English translations (default)
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enOnboarding from './locales/en/onboarding.json';
import enHome from './locales/en/home.json';
import enProfile from './locales/en/profile.json';
import enContent from './locales/en/content.json';

// Spanish translations
import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esOnboarding from './locales/es/onboarding.json';
import esHome from './locales/es/home.json';
import esProfile from './locales/es/profile.json';
import esContent from './locales/es/content.json';

// =============================================================================
// LANGUAGE DETECTION
// =============================================================================

/**
 * Get the user's device language
 *
 * expo-localization returns an array of locales, ordered by user preference.
 * We take the first one (most preferred) and extract just the language code.
 *
 * EXAMPLES:
 * - Device set to Spanish (Spain): getLocales()[0].languageCode = 'es'
 * - Device set to Spanish (Mexico): getLocales()[0].languageCode = 'es'
 * - Device set to English (US): getLocales()[0].languageCode = 'en'
 * - Device set to French: getLocales()[0].languageCode = 'fr' → falls back to 'en'
 */
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';

/**
 * Supported languages in the app
 *
 * Add more languages here as you create translation files.
 */
const SUPPORTED_LANGUAGES = ['en', 'es'];

/**
 * Determine the initial language
 *
 * LOGIC:
 * - If device language is in our supported list → use it
 * - Otherwise → use English as default
 *
 * WHY THIS APPROACH?
 * - Spanish speakers get Spanish automatically
 * - All other users get English
 * - No manual language selection needed (simpler UX)
 */
const initialLanguage = SUPPORTED_LANGUAGES.includes(deviceLanguage)
  ? deviceLanguage
  : 'en';

console.log(`[i18n] Device language: ${deviceLanguage}, Using: ${initialLanguage}`);

// =============================================================================
// i18n CONFIGURATION
// =============================================================================

/**
 * Bundle all translations into resources object
 *
 * Structure: { languageCode: { namespace: translations } }
 *
 * i18next will look up translations as: resources[language][namespace][key]
 */
const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    onboarding: enOnboarding,
    home: enHome,
    profile: enProfile,
    content: enContent,
  },
  es: {
    common: esCommon,
    auth: esAuth,
    onboarding: esOnboarding,
    home: esHome,
    profile: esProfile,
    content: esContent,
  },
};

/**
 * Initialize i18next
 *
 * This sets up the translation system with our configuration.
 * Must be called before the app renders.
 */
i18n
  .use(initReactI18next) // Connect i18next to React
  .init({
    /**
     * Resources: All translations bundled together
     */
    resources,

    /**
     * Language Settings
     *
     * lng: The language to use (from device detection)
     * fallbackLng: If translation is missing, use English
     */
    lng: initialLanguage,
    fallbackLng: 'en',

    /**
     * Namespace Settings
     *
     * defaultNS: Default namespace when not specified in t()
     * ns: List of all available namespaces
     *
     * USAGE:
     * t('button.save') → looks in 'common' namespace (default)
     * t('welcome.title', { ns: 'auth' }) → looks in 'auth' namespace
     * Or use useTranslation('auth') to set namespace for the hook
     */
    defaultNS: 'common',
    ns: ['common', 'auth', 'onboarding', 'home', 'profile', 'content'],

    /**
     * Interpolation Settings
     *
     * escapeValue: false → Don't escape HTML (React already does this)
     *
     * This allows us to use variables in translations:
     * "Hello, {{name}}" → t('greeting', { name: 'Federico' })
     */
    interpolation: {
      escapeValue: false,
    },

    /**
     * React Settings
     *
     * useSuspense: false → Don't use React Suspense for loading
     * This avoids issues with React Native and makes the setup simpler.
     */
    react: {
      useSuspense: false,
    },

    /**
     * Compatibility Mode
     *
     * compatibilityJSON: 'v4' → Use v4 format for plural rules
     * This is the current standard for i18next.
     */
    compatibilityJSON: 'v4',
  });

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Export the configured i18n instance
 *
 * This is used in app/_layout.tsx to provide the I18nextProvider.
 * Components use useTranslation() hook, not this export directly.
 */
export default i18n;

/**
 * Export constants for use in other parts of the app
 */
export { SUPPORTED_LANGUAGES, initialLanguage };

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. WHY BUNDLE TRANSLATIONS (not load from server)?
 *    - App works offline
 *    - No network delay on language switch
 *    - Simpler implementation
 *    - ~20KB total for both languages (minimal impact)
 *
 * 2. ADDING A NEW LANGUAGE
 *    a) Create translation files in src/i18n/locales/[lang]/
 *    b) Import them in this file
 *    c) Add to resources object
 *    d) Add language code to SUPPORTED_LANGUAGES
 *
 * 3. INTERPOLATION SYNTAX
 *    - {{variable}} → Simple replacement
 *    - {{count}} → Special for pluralization
 *
 *    Example in JSON:
 *    "articles": "{{count}} article"
 *    "articles_plural": "{{count}} articles"
 *
 *    Usage:
 *    t('articles', { count: 1 }) → "1 article"
 *    t('articles', { count: 5 }) → "5 articles"
 *
 * 4. NAMESPACE BEST PRACTICES
 *    - Keep namespaces small and focused
 *    - Use descriptive keys (button.save, error.network)
 *    - Group related strings together
 *    - Common patterns: screens, components, errors
 *
 * 5. TESTING TRANSLATIONS
 *    - Change device language in Settings
 *    - Restart app to see changes
 *    - Check for missing translations (fallback to English)
 */
