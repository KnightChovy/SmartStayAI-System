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

### June 27, 2026

- [x] **Tách component lẫn trong page + chuẩn hoá NativeWind toàn bộ UI**:
  - **Component dùng chung mới** (mỗi cái 1 thư mục + barrel `index.ts`):
    - `components/shared/StarRating/` — gộp `StarRow` vốn bị lặp ở `hotel/[id].tsx` và `(tabs)/search.tsx` (props `count`/`total`/`size`/`color`).
    - `components/shared/SectionHeader/` + `components/shared/MenuList/` — tách từ `(tabs)/profile.tsx` (`SectionHeader`, `MenuCard` → `MenuList` với `MenuListItem`).
    - `components/shared/PageDots/` — tách `PageDots` từ `(auth)/index.tsx`.
    - `components/chat/` — tách `TypingDots`, `MessageBubble`, `ChatEmptyState` từ `(tabs)/chatbot.tsx` (`MessageBubble` import type `ChatMessage` từ `@/hooks/chat`).
  - **Chuyển inline `style={{}}` → NativeWind `className`** (dùng token `navy`/`gold`, `shadow-hard-5`, giữ `style` chỉ cho giá trị động: màu từ data, border active, width %): `components/shared/HotelCard/HotelCard.tsx`, `app/hotel/[id].tsx`, `app/(auth)/index.tsx`, và 4 màn auth `login`/`register`/`forget-password`/`verify-otp` (chuyển song song; OTP boxes giữ nguyên ref/focus/timer, chỉ màu border động còn là `style`).
  - **Text/Heading**: thay RN `Text` bằng Gluestack `Text`/`Heading` ở các màn đã refactor.
  - `chatbot` + `profile` + `(auth)/index` chuyển nốt chuỗi UI sang tiếng Anh.
  - `npx tsc --noEmit`: không có lỗi mới ở `app/` hay component mới (39 lỗi còn lại đều thuộc scaffolding `components/ui/*` gluestack, có sẵn từ trước).

### June 28, 2026

- [x] **Luồng đặt phòng đầy đủ trên mobile (room detail → chọn ngày/khách → xác nhận → thanh toán) + sửa hồ sơ + điểm đến trang chủ**:
  - **Nghiệp vụ tham chiếu từ client (không sửa client/server)**: đọc kỹ `client` guest flow — `POST /bookings` (server tự tính giá, client chỉ gửi `{hotelId, roomTypeId, checkInDate, checkOutDate, numGuests, specialRequests?}`), booking tạo ở trạng thái `pending` (giữ phòng) rồi thanh toán `POST /payments/bookings/:id/vnpay` → `paymentUrl`; room-types chỉ trả `availableRooms`/`totalPrice`/`numNights` khi có `checkIn`+`checkOut` (nên mặc định hôm nay→mai); `PATCH /bookings/:id/cancel`; profile self-access `PATCH /users/:userId` (`name`/`email`/`password`). Toàn bộ hook/service mobile cho các API này đã có sẵn.
  - **Util mới** `utils/formatDate.ts`: `toDateKey`/`todayKey`/`addDays`/`formatDateShort`/`formatDateLong`/`nightsBetween` (group thủ công vì Hermes thiếu Intl).
  - **Component dùng chung mới** (mỗi cái 1 thư mục + barrel, NativeWind, học UI/UX từ các trang mobile sẵn có):
    - `shared/BookingStatusBadge/` — gộp `STATUS_STYLE` vốn nằm trong `(tabs)/bookings.tsx` thành pill trạng thái tái dùng (list + detail + success), export cả `BOOKING_STATUS_STYLE`.
    - `shared/PriceSummary/` — bảng dòng giá + tổng (VND), dùng ở room detail / checkout / booking detail.
    - `shared/QuantityStepper/` — bộ +/- số khách.
    - `shared/StayPickerSheet/` — bottom-sheet chọn **range ngày** (lịch nhiều tháng tự dựng, chặn ngày quá khứ) + số khách; trả `{checkIn, checkOut, guests}` dạng `YYYY-MM-DD`.
    - `shared/RoomTypeCard/` — thẻ loại phòng (tách từ `hotel/[id]`), badge "ONLY X LEFT"/"Sold out", bấm để mở chi tiết phòng.
  - **Màn hình mới (Expo Router)**:
    - `app/room/[id].tsx` — **chi tiết phòng**: carousel ảnh, thông số (m²/giường/view/sức chứa), card "Your stay" mở `StayPickerSheet`, badge số phòng trống, mô tả, tiện nghi, bảng giá; sticky "Book now" → checkout (truyền hotelId/roomTypeId/ngày/khách/giá).
    - `app/booking/checkout.tsx` — **xác nhận booking** 2 bước (Guest details có validate name/email/phone + special requests → Review) + tóm tắt kỳ ở + `PriceSummary`; "Confirm booking" gọi `useCreateBooking` rồi `replace` sang success; lỗi BE hiện inline.
    - `app/booking/success.tsx` — màn xác nhận: mã booking + QR giả + trạng thái (`BookingStatusBadge`) + tổng tiền; nếu `pending` có "Pay now with VNPay" (mở `paymentUrl` qua `expo-web-browser` rồi refetch); nút View booking / My bookings.
    - `app/booking/[id].tsx` — **chi tiết booking** (từ tab Bookings): đầy đủ thông tin kỳ ở + giá, `RefreshControl`, **Cancel** (Alert xác nhận → `useCancelBooking`) và **Pay now** (VNPay) theo trạng thái.
    - `app/profile/edit.tsx` — **sửa hồ sơ**: name/email/new password (validate), chỉ gửi field đổi (`useUpdateProfile` self-access), Alert khi lưu xong.
  - **Wire màn cũ**: `hotel/[id].tsx` thêm card chọn ngày/khách (`StayPickerSheet`, mặc định hôm nay→mai để có số phòng trống) + dùng `RoomTypeCard`, bấm phòng → room detail, "Book now" → phòng rẻ nhất; `(tabs)/bookings.tsx` mỗi thẻ bấm → booking detail + dùng `BookingStatusBadge`; `(tabs)/profile.tsx` nút Edit/Update → `profile/edit`, quick action Bookings → tab bookings.
  - **Trang chủ**: thêm `constants/destinations.ts` (6 điểm đến kèm ảnh Unsplash + `city` khớp `?city=`); `(tabs)/index.tsx` render điểm đến bằng ảnh thật (`expo-image`) thay khối màu, bấm vào lọc Search đúng thành phố.
  - `npx tsc --noEmit`: sạch ở mọi file mới/sửa (chỉ còn lỗi cũ trong scaffolding `components/ui/*`). `npm run lint`: không phát sinh lỗi/warning mới ở file mới (các lỗi `no-unescaped-entities` còn lại là pattern có sẵn ở file cũ).

- [x] **Theo yêu cầu: bỏ "Book now" ở chi tiết hotel + thêm search theo ngày ở trang chủ (như client)**:
  - `hotel/[id].tsx`: **xoá thanh sticky "Book now"** ở đáy (cùng `cheapest`/`displayPrice`/`formatVnd` không còn dùng) — luồng đặt phòng đi qua: bấm thẻ phòng → chi tiết phòng → Book now. `hotel/[id]` giờ cũng nhận `checkIn`/`checkOut`/`guests` từ Search để hiển thị đúng phòng trống theo ngày đã chọn.
  - `(tabs)/index.tsx`: thay 2 ô ngày/khách tĩnh ("Mon, Aug 21", "2 guests, 1 room") bằng ô **chọn ngày + số khách thật** mở `StayPickerSheet` (mặc định hôm nay→mai); nút Search truyền `city` + `checkIn` + `checkOut` + `guests` sang Search — khớp hành vi Hero bên client.
  - `(tabs)/search.tsx`: đọc `checkIn`/`checkOut`/`guests` từ params và truyền vào `useGetHotels` (để BE tính tồn kho + giá kỳ ở); khi mở 1 khách sạn cũng chuyển kèm ngày để chi tiết dùng chung.

- [x] **Bản đồ vị trí khách sạn (maplibre-gl) ở `hotel/[id].tsx`**:
  - **Bối cảnh**: `maplibre-gl` là thư viện WebGL chạy trên DOM → **không** render thẳng trên native (thiếu `window`/canvas). Giải pháp chuẩn Expo: nhúng qua WebView trên native, dùng trực tiếp trên web.
  - Cài thêm `react-native-webview` (qua `npx expo install`) để host map trên thiết bị.
  - **Component mới** `shared/HotelMap/` (platform-split):
    - `HotelMap.tsx` (native): `WebView` nạp HTML có maplibre-gl (CDN, pin đúng version 5.24.0) + **raster tile VietMap** (`EXPO_PUBLIC_MAP_TILE_URL`), center + marker tại `latitude`/`longitude` của khách sạn, có nút zoom.
    - `HotelMap.web.tsx` (web/react-native-web): khởi tạo `maplibregl.Map` trực tiếp trên `<div>` (CSS maplibre chèn qua CDN để tránh Metro xử lý CSS).
    - Cả hai có fallback (toạ độ trống/thiếu tile key → panel xanh icon map) và hàng địa chỉ bấm để **mở app bản đồ thiết bị / Google Maps** (Directions) qua `Linking`.
  - `hotel/[id].tsx`: thay placeholder map tĩnh trong mục **Location** bằng `<HotelMap latitude longitude name address />`.
  - **Fix "map không hiện"**: seed (`server/prisma/seed.ts`) **không có** `latitude/longitude` → API trả null → map rơi vào fallback. Vì không sửa server, thêm **geocoding từ địa chỉ** (VietMap, giống client): `types/geo.type.ts`, `services/geo.service.ts` (`geocode` gọi `autocomplete/v4` → nếu thiếu toạ độ thì `place/v3` theo `ref_id`, key `EXPO_PUBLIC_API_SEARCH_KEY`, native không vướng CORS), `hooks/geo/use-geocode.ts` (cache `Infinity`), thêm `queryKeys.geo`. `hotel/[id].tsx` ưu tiên lat/lng từ DB, thiếu thì geocode địa chỉ rồi truyền vào `HotelMap`.
  - `npx tsc --noEmit` sạch (ngoài `components/ui/*`); `npm run lint` không lỗi mới ở file map/geo.

---

_Last Updated: 2026-06-28_
