import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enHome from './locales/en/home.json';
import enSearch from './locales/en/search.json';
import enHotel from './locales/en/hotel.json';
import enBooking from './locales/en/booking.json';
import enAccount from './locales/en/account.json';
import enChat from './locales/en/chat.json';
import viCommon from './locales/vi/common.json';
import viAuth from './locales/vi/auth.json';
import viHome from './locales/vi/home.json';
import viSearch from './locales/vi/search.json';
import viHotel from './locales/vi/hotel.json';
import viBooking from './locales/vi/booking.json';
import viAccount from './locales/vi/account.json';
import viChat from './locales/vi/chat.json';

export const LANGUAGE_STORAGE_KEY = 'app-lang';

export const SUPPORTED_LANGUAGES = ['en', 'vi'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    home: enHome,
    search: enSearch,
    hotel: enHotel,
    booking: enBooking,
    account: enAccount,
    chat: enChat,
  },
  vi: {
    common: viCommon,
    auth: viAuth,
    home: viHome,
    search: viSearch,
    hotel: viHotel,
    booking: viBooking,
    account: viAccount,
    chat: viChat,
  },
} as const;

function isSupported(lang: string | undefined | null): lang is AppLanguage {
  return !!lang && (SUPPORTED_LANGUAGES as readonly string[]).includes(lang);
}

/**
 * Ngôn ngữ khởi tạo: lựa chọn đã lưu > ngôn ngữ máy (nếu app có hỗ trợ) > `en`.
 * Khác client (mặc định `vi`): app lấy **tiếng Anh** làm mặc định theo yêu cầu.
 */
async function resolveInitialLanguage(): Promise<AppLanguage> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupported(saved)) return saved;
  } catch {
    // Không đọc được storage thì rơi về ngôn ngữ máy — không phải lỗi chặn app.
  }
  const device = Localization.getLocales()[0]?.languageCode;
  return isSupported(device) ? device : 'en';
}

/** Gọi một lần ở root layout, TRƯỚC khi render cây màn hình. */
export async function initI18n(): Promise<void> {
  if (i18n.isInitialized) return;
  const lng = await resolveInitialLanguage();
  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'home', 'search', 'hotel', 'booking', 'account', 'chat'],
    // React đã tự chống XSS; i18next escape nữa sẽ làm hỏng dấu nháy tiếng Việt.
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

/** Đổi ngôn ngữ + ghi nhớ lựa chọn cho lần mở app sau. */
export async function changeLanguage(lang: AppLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Không lưu được thì chỉ mất ghi nhớ, phiên hiện tại vẫn đúng ngôn ngữ.
  }
}

export default i18n;
