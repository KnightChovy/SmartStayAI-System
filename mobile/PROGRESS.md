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

### June 26, 2026

- [x] **Tầng API hoàn chỉnh (services + hooks + types) nối backend `/v1`**:
  - **Hạ tầng**: `lib/api.ts` (axios instance, baseURL `EXPO_PUBLIC_API_BASE_URL` mặc định `http://localhost:5000/v1`, interceptor gắn `Authorization` + tự refresh token khi 401/403 với hàng đợi chống refresh trùng); `stores/authStore.ts` (Zustand giữ user + access/refresh token, chưa persist — TODO `expo-secure-store`); `constants/queryKeys.ts` (key factory); `utils/cleanParams.ts`; `types/api.type.ts` (`Paginated<T>`).
  - **Types** (`types/*.type.ts`): auth, amenities, hotels, bookings, payments, reviews, chatbot, users — model theo response thật của backend (Decimal → string).
  - **Services** (`services/*.service.ts`, có đủ get/post/put/patch/delete tuỳ domain): `auth` (send-otp, register, login, logout, refresh, forgot/reset password, verify email), `hotels` (search, detail, room-types), `amenities` (list), `bookings` (create, getMine, getById, cancel), `payments` (VNPay create), `reviews` (create, by-hotel, detail), `chatbot` (sendMessage + sendMessageStream qua `expo/fetch` SSE), `users` (getProfile, updateProfile, deleteAccount — self-access).
  - **Auth phủ đủ 9 route** user dùng: send-otp, register, login, logout, forgot/reset password, verify-email, send-verification-email (refresh-tokens nằm trong interceptor của `lib/api.ts`).
  - **Users self-access**: middleware `auth` cho phép user thường thao tác trên `/users/:userId` khi `:userId === user.id` → các hook tự lấy `userId` từ `authStore` (get/update/delete chính mình). Các route admin (status/role, list user) không thuộc phạm vi guest nên bỏ qua.
  - **Hooks** (mỗi endpoint = 1 file, có barrel `index.ts` mỗi domain): auth (8), hotels (3), amenities (1), bookings (4), payments (1), reviews (3), chatbot (2), users (3) — dùng `useQuery`/`useMutation`, mutation invalidate cache liên quan; login/register/updateProfile đồng bộ `authStore`, logout/deleteAccount clear session.
  - **`.env.example`**: sửa base URL `/api` → `/v1` cho khớp mount thật của server.
  - `npx tsc --noEmit`: các file mới sạch lỗi (lỗi còn lại là của scaffolding `components/ui` gluestack, không liên quan).

- [x] **TanStack Query provider (`src/providers/query.tsx`)**:
  - `createQueryClient()` với `defaultOptions` hợp lý cho mobile (`staleTime` 1', `gcTime` 5', `retry` 2, `refetchOnReconnect`).
  - `QueryProvider` giữ `QueryClient` ổn định qua `useState`, bọc `QueryClientProvider`.
  - Tích hợp `focusManager` + `AppState` để refetch khi app trở lại foreground (tương đương refetch-on-window-focus của web, bỏ qua trên web).
  - Wire vào `src/app/_layout.tsx` (bọc ngoài `GluestackUIProvider`). Xoá file `query.ts` rỗng.

---

_Last Updated: 2026-06-26_
