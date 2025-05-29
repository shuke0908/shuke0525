import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const KOREAN_CODE = 'ko';
const ENGLISH_CODE = 'en';

// 언어 코드 매핑 함수 (undefined 반환 없이 보장)
const getLanguageCode = (lng: string): string => {
  if (lng.startsWith('ko')) return KOREAN_CODE;
  if (lng.startsWith('en')) return ENGLISH_CODE;
  return ENGLISH_CODE; // 기본값으로 영어 반환
};

// 브라우저 환경에서만 초기화
if (typeof window !== 'undefined') {
  i18n
    // Load translation using http -> see /public/locales
    .use(Backend)
    // Detect user language
    .use(LanguageDetector)
    // Pass the i18n instance to react-i18next
    .use(initReactI18next)
    // Init i18next
    .init({
      fallbackLng: ENGLISH_CODE, // 문자열로 직접 지정
      debug: process.env.NODE_ENV === 'development',
      lng: getLanguageCode(typeof window !== 'undefined' ? window.navigator.language : ENGLISH_CODE),
      
      // Have a common namespace used around the full app
      ns: ['common', 'auth', 'admin', 'trading', 'wallet'],
      defaultNS: 'common',

      interpolation: {
        escapeValue: false, // React already safes from XSS
      },

      // Default language detection settings
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },

      // 지원하는 언어 명시적 설정
      supportedLngs: ['en', 'ko', 'zh', 'zh-TW', 'fr', 'de', 'es', 'it', 'ru', 'ja'],
      nonExplicitSupportedLngs: false,

      // Backend configuration for loading translation files
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        requestOptions: {
          cache: 'no-cache',
        },
        crossDomain: true,
      },

      // React configuration
      react: {
        useSuspense: false,
      },

      // 서버 사이드 렌더링 지원
      load: 'languageOnly', // ko-KR 대신 ko만 로드
      preload: ['ko', 'en'], // 미리 로드할 언어들

      saveMissing: process.env.NODE_ENV === 'development',
      missingKeyHandler: (lng, ns, key, fallbackValue) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Missing translation key: ${key} for language: ${lng}`);
        }
      },
    });
} else {
  // 서버 사이드에서는 기본 설정만
  i18n
    .use(initReactI18next)
    .init({
      fallbackLng: ENGLISH_CODE,
      lng: getLanguageCode(typeof window !== 'undefined' ? window.navigator.language : ENGLISH_CODE),
      debug: process.env.NODE_ENV === 'development',
      ns: ['common', 'auth', 'admin', 'trading', 'wallet'],
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      // 서버에서는 빈 리소스로 시작
      resources: {},
    });
}

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
