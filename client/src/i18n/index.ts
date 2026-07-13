import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import viCommon from './locales/vi/common.json';
import enAuth from './locales/en/auth.json';
import viAuth from './locales/vi/auth.json';
import enFooter from './locales/en/footer.json';
import viFooter from './locales/vi/footer.json';
import enHome from './locales/en/home.json';
import viHome from './locales/vi/home.json';

export const SUPPORTED_LANGS = ['vi', 'en'] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];

export const resources = {
  en: { common: enCommon, auth: enAuth, footer: enFooter, home: enHome },
  vi: { common: viCommon, auth: viAuth, footer: viFooter, home: viHome },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    supportedLngs: SUPPORTED_LANGS,
    defaultNS: 'common',
    ns: ['common', 'auth', 'footer', 'home'],
    interpolation: { escapeValue: false }, // React đã tự escape
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'app-lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
