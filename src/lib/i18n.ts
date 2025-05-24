import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  // Load translation using http -> see /public/locales
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    // Have a common namespace used around the full app
    ns: ['common', 'auth', 'admin', 'trading', 'wallet'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false, // React already safes from XSS
    },

    // Default language detection settings
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    // Backend configuration for loading translation files
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        cache: 'no-store', // Disable caching for development
      },
    },

    // React configuration
    react: {
      useSuspense: true,
    },
  });

export default i18n;

// List of supported languages with flag mappings
export const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flagCode: 'us' },
  {
    code: 'zh',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    flagCode: 'cn',
  },
  {
    code: 'zh-TW',
    name: 'Chinese (Traditional)',
    nativeName: '繁體中文',
    flagCode: 'tw',
  },
  { code: 'fr', name: 'French', nativeName: 'Français', flagCode: 'fr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flagCode: 'de' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flagCode: 'es' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flagCode: 'it' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flagCode: 'ru' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flagCode: 'jp' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flagCode: 'kr' },
];
