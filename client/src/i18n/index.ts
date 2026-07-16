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
import enSearch from './locales/en/search.json';
import viSearch from './locales/vi/search.json';
import enHotel from './locales/en/hotel.json';
import viHotel from './locales/vi/hotel.json';
import enBooking from './locales/en/booking.json';
import viBooking from './locales/vi/booking.json';
import enAccount from './locales/en/account.json';
import viAccount from './locales/vi/account.json';
import enPages from './locales/en/pages.json';
import viPages from './locales/vi/pages.json';

export const SUPPORTED_LANGS = ['vi', 'en'] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    footer: enFooter,
    home: enHome,
    search: enSearch,
    hotel: enHotel,
    booking: enBooking,
    account: enAccount,
    pages: enPages,
  },
  vi: {
    common: viCommon,
    auth: viAuth,
    footer: viFooter,
    home: viHome,
    search: viSearch,
    hotel: viHotel,
    booking: viBooking,
    account: viAccount,
    pages: viPages,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    supportedLngs: SUPPORTED_LANGS,
    defaultNS: 'common',
    ns: ['common', 'auth', 'footer', 'home', 'search', 'hotel', 'booking', 'account', 'pages'],
    interpolation: { escapeValue: false }, // React đã tự escape
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'app-lang',
      caches: ['localStorage'],
    },
  });

/**
 * Đồng bộ `<html lang>` với ngôn ngữ đang dùng (WCAG 3.1.1) — nếu để `lang="en"` tĩnh
 * trong index.html thì trình đọc màn hình sẽ phát âm sai toàn bộ nội dung tiếng Việt.
 */
function syncHtmlLang(lng: string) {
  document.documentElement.lang = lng;
}
syncHtmlLang(i18n.resolvedLanguage ?? 'vi');
i18n.on('languageChanged', syncHtmlLang);

export default i18n;
