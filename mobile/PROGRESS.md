# Smart Stay AI - Mobile Development Progress

This file tracks the accomplished tasks, resolved user requests, and structural/functional work completed in the mobile (Expo) application.

> Mỗi lần prompt code phải cập nhật tiến độ vào file này (important!).

---

## Completed Tasks Checklist

### June 24, 2026

- [x] **Project scaffolding (Expo SDK 56 + Expo Router + NativeWind 4)**:
  - Khởi tạo app Expo Router với entry `expo-router/entry` (`app.json`), root layout `src/app/_layout.tsx` (`<Stack />`) và màn hình mẫu `src/app/index.tsx`.
  - Cài & cấu hình **NativeWind 4**: `global.css` (`@tailwind base/components/utilities`), `tailwind.config.js` (preset `nativewind/preset`), `babel.config.js` (`jsxImportSource: "nativewind"` + `nativewind/babel`), `metro.config.js` (`withNativeWind(config, { input: './global.css' })`).
  - Bật `experiments.typedRoutes` + `reactCompiler` trong `app.json`.

- [x] **Fix lỗi type khi import `global.css`**:
  - **Nguyên nhân**: `import "../../global.css"` báo `ts(2307)` vì TypeScript không có khai báo type cho file `.css` (reference `nativewind/types` chỉ thêm prop `className`, không khai báo module `*.css`).
  - **Fix**: thêm `declare module "*.css";` vào `nativewind-env.d.ts`. (Chỉ là lỗi type-check; Metro + `withNativeWind` vẫn xử lý CSS ở tầng bundler.)
  - ⚠️ Còn lại: `tailwind.config.js` đang để `content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}"]` — sai với cấu trúc `src/`. Cần đổi sang `content: ["./src/**/*.{js,jsx,ts,tsx}"]` để class trong `src/app/` được sinh ra (chưa áp dụng — chờ xác nhận).

- [x] **Viết `AGENTS.md` cho mobile**:
  - Bám theo `client/AGENTS.md`, chuyển sang stack Expo Router + React Native + NativeWind. Định nghĩa cấu trúc đích (`src/app` file-based routing với `(auth)`/`(tabs)` groups), quy ước đặt tên (route file `export default`, env `EXPO_PUBLIC_*`), một-endpoint-một-hook + barrel, TanStack Query / Zustand / Zod, build qua EAS, và template cho screen/component/service/hook/store.
  - Thêm `.env.example` (`EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_APP_NAME`, `EXPO_PUBLIC_MAP_KEY`).

---

_Last Updated: 2026-06-24_
