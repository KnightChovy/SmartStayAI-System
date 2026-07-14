import 'i18next';
import type enCommon from './locales/en/common.json';
import type enAuth from './locales/en/auth.json';
import type enFooter from './locales/en/footer.json';
import type enHome from './locales/en/home.json';

/**
 * Khai báo type cho i18next → `t('nav.home')` được autocomplete + báo lỗi khi
 * gõ sai key (khớp rule strict "không any" của dự án).
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof enCommon;
      auth: typeof enAuth;
      footer: typeof enFooter;
      home: typeof enHome;
    };
  }
}
