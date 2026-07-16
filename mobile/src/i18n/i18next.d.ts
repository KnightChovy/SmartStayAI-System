import 'i18next';
import type common from './locales/en/common.json';
import type auth from './locales/en/auth.json';
import type home from './locales/en/home.json';
import type search from './locales/en/search.json';
import type hotel from './locales/en/hotel.json';
import type booking from './locales/en/booking.json';
import type account from './locales/en/account.json';
import type chat from './locales/en/chat.json';

/** Type-safe `t()` — gõ sai key là lỗi TypeScript, không phải chuỗi hiện thô ra UI. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      auth: typeof auth;
      home: typeof home;
      search: typeof search;
      hotel: typeof hotel;
      booking: typeof booking;
      account: typeof account;
      chat: typeof chat;
    };
  }
}
