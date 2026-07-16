# Smart Stay AI - Mobile Development Progress

This file tracks the accomplished tasks, resolved user requests, and structural/functional work completed in the mobile (Expo) application.

> Mỗi lần prompt code phải cập nhật tiến độ vào file này (important!).

---

## Completed Tasks Checklist

### July 17, 2026

- [x] **Guest tab navigation updated to LenFolk-style floating navigation**: edge-to-edge bottom bar, accessible press/long-press behavior, and a raised central **Bookings** action. Existing guest routes and translated labels are unchanged.

- [x] **Guest app đổi sang gam màu + typography của client (web), auth có ảnh khách sạn, thêm i18n EN/VI**:
  - **Phạm vi**: chỉ **guest** (auth + tabs + hotel/room/booking + profile/\*). **Staff portal giữ nguyên theme teal** — bên client staff cũng là portal riêng có màu riêng, và grep xác nhận `navy`/`gold` **không** xuất hiện ở `(staff)` nên đổi guest không ảnh hưởng staff.
  - **Design token** (`tailwind.config.js`): port 1:1 từ `client/src/styles/index.css` (@theme). Tên nào gluestack đã chiếm (`primary`/`secondary`/`outline`/`background`/`error`) thì đặt tên khác để **không phá scale gluestack** mà `Text`/`Heading`/`Spinner` đang dùng: `canvas` #f5f2ee · `surface` #fcf9f8 (+ `low`/`lowest`/`container`) · `on-surface` #1c1b1b (+ `variant` #474741) · `brand` #5f5e5b · `bronze` #735a35 · `premium-gold` #d4af37 · `hairline` #c8c7bf · `muted` #777771 · `danger` #ba1a1a. **Bo góc** của client KHÔNG trùng thang Tailwind (rounded-2xl là **21.6px** chứ không phải 16px) ⇒ thêm thang riêng theo công dụng: `rounded-tile/field/card/panel/sheet` = 12/16.8/21.6/26.4/32px — vừa khớp client vừa không đổi ngầm giao diện staff.
  - **Font Be Vietnam Pro** (font client đang dùng): cài `@expo-google-fonts/be-vietnam-pro` + `expo-splash-screen`, load ở `_layout` (giữ splash tới khi font xong, tránh nháy font). ⚠️ **Bẫy đã tránh**: React Native trên **Android BỎ QUA `fontWeight` khi có `fontFamily` tuỳ biến** (mỗi độ đậm là một file font riêng). Nếu ép `fontFamily.body = BeVietnamPro_400Regular` thì **mọi `<Text bold>` — kể cả portal staff — sẽ mất nét đậm trên Android**. Vì vậy `heading`/`body` **để nguyên undefined**, font chỉ áp qua lớp tường minh `font-bevi` / `-medium` / `-semibold` / `-bold` / `-extrabold` ở màn guest.
  - **Auth có ảnh khách sạn** (yêu cầu chính): client có panel ảnh 50/50 nhưng panel đó `hidden` dưới breakpoint md ⇒ **web mobile chưa hề có ảnh**, phải tự thiết kế. Chọn **hero ảnh trên + sheet form bo góc 32px đè lên**: giữ đúng các thành phần của panel client (ảnh KS, phủ tối dần, logo chữ trắng, tagline) nhưng xếp dọc để còn chỗ cho bàn phím. Component chung `components/auth/AuthScreenLayout` + `components/guest/{LuxField,LuxButton}` (ô nhập h-12 `rounded-field` nền `surface-low`; CTA viên thuốc chữ HOA nền gần đen — đúng nút thật client dùng, không phải `size=default` cao 32px của shadcn vốn quá nhỏ để chạm). Ảnh lấy đúng ảnh Unsplash client dùng cho từng màn (`AUTH_IMAGES`).
  - **Sửa theo phản hồi**: (1) **chữ trắng chìm trên ảnh** → phủ gradient đậm ở **hai đầu** (0.75 → 0.35 → 0.9, `locations` rõ ràng) nơi thật sự có chữ, + `textShadow` làm lớp bảo hiểm cho ảnh sáng bất thường; (2) **tách onboarding thành 2 route thật**: `(auth)/index` (welcome + sứ mệnh) và `(auth)/features` (vì sao chọn + CTA) thay cho một file toggle `useState(page)`.
  - **i18n EN/VI** (`src/i18n/`): `i18next` + `react-i18next` + `expo-localization` + AsyncStorage. **Mặc định tiếng Anh** (khác client vốn mặc định `vi`), thứ tự: lựa chọn đã lưu → ngôn ngữ máy → `en`. Namespace `common` + `auth`, `i18next.d.ts` type-safe (gõ sai key là lỗi TS, không phải chuỗi thô hiện ra UI). Khởi tạo **trước khi render** ở `_layout` (ngôn ngữ nằm trong AsyncStorage bất đồng bộ, render sớm sẽ nháy EN → VI). Key **cân bằng en/vi: common 13/13, auth 83/83**.
  - **`LanguageSwitcher`** (segmented EN/VI, `tone` light/dark): gắn ở **4 màn auth** (qua `AuthScreenLayout`: login/register/forget-password/verify-otp) + **2 màn onboarding** + **Profile → Settings** (khách đã đăng nhập). Lựa chọn ghi nhớ qua AsyncStorage.
  - **Migrate 28 file guest** bằng script (màu + bo góc + font). ⚠️ **Lần chạy đầu hỏng, đã revert bằng git rồi làm lại**: file dùng **CRLF** nên regex kết thúc `;\n` không khớp → dòng `const NAVY = ...` sống sót rồi bị luật đổi tên biến ăn thành `const GUEST_COLORS.onSurface = ...`; và thay `"#fff"` **kèm dấu nháy** trong JSX ra `color=GUEST_COLORS.white` (thiếu ngoặc nhọn). Bản sửa xử lý cả hai + tách riêng `HotelMap` (chứa chuỗi HTML/CSS của maplibre) làm tay.
  - **Verify**: `npx tsc --noEmit` **0 lỗi** ở mọi file guest (chỉ còn ~39 lỗi pre-existing của scaffolding `components/ui/*`); `eslint` **sạch** (dọn luôn 2 lỗi `no-unescaped-entities` có sẵn); **`npx expo export --platform android` build thành công** (8.04 MB) — chứng minh route resolve, i18n init, font load, NativeWind biên dịch được token mới. Grep thẳng vào bundle: có `#fcf9f8`/`#f5f2ee`/`#1c1b1b`/`735a35`, `BeVietnamPro_400Regular`+`_700Bold`, `LanguageSwitcher`, `app-lang`, và **cả hai locale** (EN dạng utf8, VI dạng **utf16** — Hermes lưu chuỗi non-ASCII bằng UTF-16, grep utf8 thường sẽ báo thiếu nhầm).
  - ⚠️ **Phải `npx expo start -c`**: đã đổi `tailwind.config.js` (NativeWind biên dịch lúc build) + thêm native module (`expo-font`, `expo-splash-screen`, `expo-localization`) ⇒ Metro giữ bundle cũ sẽ **không thấy gì thay đổi**.

- [x] **i18n phủ TOÀN BỘ app khách — nút EN/VI giờ đổi được mọi màn**:
  - Tách namespace theo đúng cách client làm: **`common` · `auth` · `home` · `search` · `hotel` · `booking` · `account` · `chat`** (thêm 6 cái mới). Tổng **319 key mỗi ngôn ngữ, en/vi cân bằng tuyệt đối** (common 26 · auth 83 · home 14 · search 17 · hotel 29 · booking 48 · account 93 · chat 9).
  - **Đã chuyển sang `t()`**: tab bar (5 nhãn) · Home · Search (kể cả nhãn bộ lọc + sort) · Bookings · Chatbot · Notifications · Hotel detail · Room detail · Checkout · Success · Booking detail · Profile · **8 màn `profile/*`** · và component dùng chung (`BookingStatusBadge`, `StayPickerSheet`, `PriceSummary`, `ChatEmptyState`, `RoomTypeCard`).
  - **Bẫy "hằng ở module scope" — sửa 4 chỗ**: `BOOKING_STATUS_STYLE`, `notifications.bookingToNotification`, `ChatEmptyState.SUGGESTIONS`, `about.LINKS` đều đang gắn CHỮ vào hằng ngoài component ⇒ chuỗi bị **đóng băng ngôn ngữ lúc import**, bấm đổi ngôn ngữ sẽ không cập nhật. Nay hằng chỉ giữ **key + phần thị giác (icon/màu)**, chữ dịch trong render (`notifications` nhận `t` qua tham số thay vì tự import i18n).
  - **`i18next.d.ts` type-safe bắt lỗi thật lúc build, không phải chuỗi thô lòi ra UI**: (1) `useTranslation('chat')` rồi gọi `t('chat:replying')` → sai, ns phải nằm trong tuple; (2) key động `` t(`home:propertyTypes.${x}`) `` chỉ hợp lệ khi `x` là **union literal** ⇒ thêm `as const` cho `PROPERTY_TYPES`, đổi `HotelFilter.id` từ `string` sang union `FilterId`; (3) đổi `useTranslation('common')` → `['account','common']` thì defaultNS đổi theo, `t('language')` phải thành `t('common:language')`.
  - Bài học lặp lại từ đợt migrate màu: file **CRLF** làm mọi regex kết thúc `\n` trượt hết ⇒ với `profile.tsx` phải thay **theo nội dung dòng đã trim** thay vì so chuỗi có thụt lề.
  - **Verify**: `tsc` **0 lỗi**, `eslint` **sạch** toàn bộ file guest (2 lỗi `no-unescaped-entities` còn lại nằm ở `(staff)`, pre-existing, ngoài phạm vi). **`npx expo export` build thành công**; grep thẳng bundle Hermes: **8/8 chuỗi EN + 8/8 chuỗi VI** trải khắp các màn (Home/Bookings/Room/Checkout/Favourites/Rewards/Chat/Picker) — VI lưu dạng **UTF-16** nên phải dò đúng encoding mới thấy.
  - **Còn lại**: text trong `(staff)` vẫn tiếng Anh cứng (đúng phạm vi "chỉ guest"); message lỗi từ backend chưa map i18n (giống client — cần mã lỗi riêng); ngày/giờ vẫn format thủ công theo `formatDate*`, chưa theo locale.

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

### June 30, 2026

- [x] **Phân quyền 2 role (customer / staff) + navigation staff**:
  - **Hạ tầng role** (`constants/roles.ts` — trước rỗng): `isStaff(role)`, `homeRouteForRole(role)` và 2 hằng `STAFF_HOME = '/(staff)/bookings'`, `CUSTOMER_HOME = '/(tabs)'` — một nguồn chân lý quyết định "role nào về màn nào". `UserRole` đã sẵn `'staff'`/`'customer'` nên không đổi type.
  - **Điều hướng theo role**: `(auth)/login` `onSuccess` → `router.replace(homeRouteForRole(user.role))` thay vì hardcode `/(tabs)`; `(auth)/_layout` đã đăng nhập → redirect đúng nhà theo role; `(tabs)/_layout` (customer) chặn staff lạc vào → đẩy sang `STAFF_HOME`; `(staff)/_layout` chặn non-staff → đẩy về `CUSTOMER_HOME`. Guard đặt ở tầng layout (UX), không phải bảo mật — quyền thật vẫn do backend kiểm.
  - **Group `app/(staff)/` — 5 tab + nút Check-in nổi giữa**: `_layout.tsx` tự dựng `CustomTabBar` (tái dụng pattern từ `(tabs)`), thứ tự **Bookings · Inbox · 📷 Scan (nổi cao, navy, giữa) · Refunds · Account**; item `scan` render nút tròn elevated (`marginTop:-24`, viền trắng, shadow) cho thao tác check-in/out.
  - **Màn staff (stub, sẽ fill nghiệp vụ sau)**: tab `bookings`/`inbox`/`scan`/`refunds`/`profile` (profile có nút Đăng xuất thật) + 4 màn chi tiết `bookings/[id]`, `check-in/[id]`, `conversation/[id]`, `refunds/[id]`.
  - **Map nhiệm vụ Hotel Staff → tab**: Bookings (confirm + xem + check-out) · Inbox (theo dõi AI + tiếp quản chat + khiếu nại) · Scan (check-in gán phòng / check-out) · Refunds (verify policy + duyệt) · Account.
  - `npx tsc --noEmit`: 0 lỗi ở file mới (39 lỗi còn lại đều thuộc scaffolding `components/ui/*`). typedRoutes chấp nhận href group mới.
  - ⚠️ Còn lại: các màn chi tiết đang nằm **trong** Tabs navigator nên hiện vẫn thấy thanh tab; nếu muốn detail trượt đè như stack (ẩn tab bar) thì tách sang nested `(staff)/(tabs)/` + Stack — chưa làm.

### July 1, 2026

- [x] **Tầng API vận hành staff (types + service + hooks) nối 14 endpoint `/hotels/:hotelId/*`**:
  - **Đối chiếu Swagger** (`server/src/docs/swagger.yml` + `components.yml`): xác nhận 14 API staff — booking (list, lookup theo voucher, detail, check-in, check-out, no-show, record-cash-payment), housekeeping (list, complete), rooms (list, update-status), conversations (list, detail, reply, resolve). Response trả **JSON thô** (không bọc `{success,data}` — kiểm bằng controller `res.send`).
  - **Types** (`types/staff.type.ts`): `StaffBooking` (+ customer/roomType/bookingRooms/voucher), `HousekeepingTask`, `StaffRoom` (+ `RoomStatus`/`RoomStatusUpdatable`), `Conversation`/`ConversationSummary`/`Message` và các enum + params/payload. Tái dùng `BookingStatus` từ `bookings.type`. Decimal → string.
  - **Service** (`services/staff.service.ts`): 1 object `staffService` gom 14 method, tham số hoá `hotelId`, dùng `cleanParams` cho query. `listHousekeeping` trả **mảng trần** (không phân trang), phần còn lại `Paginated<T>` hoặc object đơn.
  - **Query keys**: thêm factory `queryKeys.staff.*`, mọi key gắn `hotelId` để tách cache theo khách sạn.
  - **Hooks** (mỗi endpoint = 1 file + barrel mỗi thư mục, theo đúng AGENTS): `hooks/staff/bookings/` (7), `housekeeping/` (2), `rooms/` (2), `conversations/` (4) + barrel gốc `hooks/staff/index.ts`. Query có `enabled: !!hotelId`; mutation invalidate `queryKeys.staff.all()` (reply/resolve invalidate thêm key `conversation`); `lookupBooking` dùng `useMutation` (kích hoạt theo hành động quét QR). Ghi đè file rỗng `use-get-bookings.ts` cũ.
  - `npx tsc --noEmit`: 0 lỗi ở toàn bộ file mới (41 lỗi còn lại đều là pre-existing: gluestack `components/ui/*` + thiếu type `react-native-webview`/`maplibre-gl`).
  - ⚠️ **Blocker `hotelId`**: chưa có API để staff lấy KS được phân công — `GET /hotels/mine` chỉ trả KS theo `partner.ownerId` (chủ KS), KHÔNG đọc `hotelStaffAssignment`. Login cũng không trả `hotelId`. Cần backend bổ sung (mở rộng `/hotels/mine` đọc assignment, hoặc thêm `/users/me/assignments`) rồi lưu `hotelId` vào store — trước khi wire các hook này vào màn `(staff)/`.

- [x] **UI staff portal (theme teal riêng) — fill toàn bộ màn `(staff)/` + wire API**:
  - **Config màu riêng**: thêm palette **`staff` (teal)** vào `tailwind.config.js` (`staff-50…900` + `DEFAULT` + `accent` cam) — tách hẳn theme khách hàng (navy/gold). `constants/staffTheme.ts` giữ hex thô (`STAFF_COLORS` cho tab bar/icon/spinner) + map trạng thái → class NativeWind (`ROOM_STATUS_STYLE`, `HOUSEKEEPING_STATUS_STYLE`, `CONVERSATION_STATUS_STYLE`). Đổi `(staff)/_layout` tab bar sang teal (active pill `#CCFBF1`, brand `#0F766E`).
  - **Cầu nối `hotelId` (tạm)**: `stores/staffStore.ts` (Zustand persist `hotelId`) + hook `useStaffHotelId()` (store → env `EXPO_PUBLIC_STAFF_HOTEL_ID`, thêm vào `.env.example`). Mọi màn dùng hook này; `hotelId` null → hiện trạng thái "Chưa gán khách sạn" thay vì gọi API rỗng. Khi backend có API assignment chỉ cần bơm vào store.
  - **Component staff dùng chung** (`components/staff/*`, gluestack + NativeWind, mỗi cái 1 thư mục + barrel): `StaffScreenHeader` (header teal + back + right slot), `StaffButton` (variant primary/outline/danger/subtle + loading + icon), `StaffEmptyState` (rỗng/lỗi/loading-fail), `StatusPill` (nhận `StatusStyle`), `StaffBookingCard`, `ConversationCard` + barrel gốc. Thêm helper còn thiếu `lib/cn.ts` (clsx + tailwind-merge) mà AGENTS tham chiếu nhưng repo chưa có.
  - **Màn hình** (thay stub): `bookings` (filter chip trạng thái + list + pull-to-refresh), `bookings/[id]` (chi tiết khách/kỳ ở/voucher/tổng tiền + hành động theo trạng thái: check-in→điều hướng, thu tiền mặt, no-show, check-out + ô phụ thu), `check-in/[id]` (xác thực voucher + chọn phòng trống cùng loại hoặc để BE tự gán), `scan` (nhập/tra mã voucher → mở booking, chừa khung camera QR), `inbox` (filter hội thoại, mặc định `escalated`), `conversation/[id]` (thread bong bóng guest/staff/ai/system + composer trả lời + nút resolve, `KeyboardAvoidingView`), `refunds` (giữ chỗ — chưa có API), `profile` (thẻ nhân viên + info + đăng xuất, tông teal).
  - Mọi mutation có `onError` (Alert); màn có loading (`Spinner`) + empty/error state. `npx tsc --noEmit`: **0 lỗi** ở toàn bộ file staff mới (chỉ còn 39 lỗi pre-existing của scaffolding `components/ui/*`).
- [x] **Tự động lấy `hotelId` sau khi staff đăng nhập (chỉ sửa mobile — KHÔNG đụng BE)**:
  - **Không sửa backend** (đã revert mọi thay đổi thử nghiệm ở `server/`). Mobile gọi endpoint `GET /hotels/me/assignments` để lấy KS staff được phân công: `staffService.listMyHotels` + hook `useMyStaffHotels(enabled)` + `queryKeys.staff.myHotels` + type `StaffAssignedHotel`.
  - **Tự chốt hotelId**: `(staff)/_layout` gọi hook (enabled khi đã hydrate + là staff), `useEffect` set `staffStore.hotelId = hotels[0].id` khi chưa có / id cũ không còn hợp lệ. Các màn đọc qua `useStaffHotelId()` (store → env fallback). Endpoint 404 (chưa có) sẽ fail im lặng, app rơi về env `EXPO_PUBLIC_STAFF_HOTEL_ID` — không crash.
  - ⚠️ **Cần BE bổ sung `GET /hotels/me/assignments`** (auth): đọc `hotel_staff_assignments` theo `user.id` trong token (`unassignedAt = null`, bỏ KS soft-deleted), trả `HotelSummary[]` giống `/hotels/mine`. Khi endpoint sẵn sàng, luồng chạy tự động, không phải sửa mobile.
  - Camera QR ở tab Scan vẫn là khung giữ chỗ (cần `expo-camera`).

- [x] **Thêm mã QR check-in thật cho booking (đồng bộ với web)**:
  - Web dùng `QRVoucher` (client) render `<img>` trỏ dịch vụ ảnh QR công khai `api.qrserver.com`, mã hoá `booking.bookingCode` — không cần thư viện QR. Áp dụng y hệt cho mobile để không phải thêm dependency native mới.
  - Component mới `components/shared/QRVoucher/` (`expo-image` + barrel), nhận `data`/`label`/`size`.
  - `booking/success.tsx`: thay khối "Faux QR" (icon giữ chỗ) bằng `<QRVoucher data={booking.bookingCode} />` thật.
  - `booking/[id].tsx`: thêm QR check-in ngay trong card mã booking, ẩn khi `status === 'cancelled'` (giống `BookingDetailPage` bên web).
  - `npx tsc --noEmit`: sạch ở các file mới/sửa.

- [x] **Thêm "Modify reservation" cho booking `pending`/`confirmed` (đồng bộ mock UI của web)**:
  - Web (`BookingDetailPage`) chưa có API sửa booking thật — nút "Modify" chỉ mở form chọn ngày/khách rồi hiện thông báo "Modification request sent" (mock, không gọi backend). Làm y hệt cho mobile để giữ đúng hành vi hiện có, không tự thêm API chưa tồn tại.
  - `booking/[id].tsx`: thêm nút "Modify reservation" (hiện khi `status` là `pending`/`confirmed`, cùng điều kiện với Cancel) mở lại `StayPickerSheet` sẵn có (đã dùng ở trang phòng) với ngày/khách hiện tại làm giá trị khởi tạo; sau khi Apply chỉ lưu state cục bộ và hiện card xác nhận mock (ngày mới + số khách + "The property will confirm availability shortly."), không gọi API.
  - `npx tsc --noEmit`: sạch ở file đã sửa.

- [x] **Nối đủ trang cho các nút ở màn Profile (tất cả 9 nút trước đây không có `onPress`)**:
  - **Rà soát trước khi làm**: cả backend (`server/src`) lẫn web (`client/src`) đều **chưa có API thật** cho loyalty/points, promotions/offers, và không có bất kỳ trang/mô hình nào cho "saved payment methods" hay "transaction history" riêng — `LoyaltyAccount`/`LoyaltyTransaction`/`Promotion` chỉ tồn tại ở Prisma schema, chưa có service/controller/route; web tự nhận là mock (`[MOCK] … Backend chưa có endpoint`). Vì vậy chỉ những trang có nghiệp vụ thật mới gọi API thật; phần còn lại làm mock rõ ràng như web, không giả lập dữ liệu backend không tồn tại.
  - **Trang mới, tất cả đặt trong `app/profile/`** (theo đúng chỗ `profile/edit.tsx` đã có):
    - `rewards.tsx` — tier + điểm thưởng (mock, đồng bộ số liệu tĩnh với `LoyaltyPage` bên web), có ghi chú rõ trong code là mock.
    - `offers.tsx` — danh sách voucher/mã ưu đãi (mock, đồng bộ với `MyVouchersPage`), không dùng `expo-clipboard` (chưa cài) — chỉ hiển thị mã để nhập tay lúc checkout.
    - `payment-methods.tsx` — empty-state giải thích rõ SmartStay chưa lưu thẻ, thanh toán qua VNPay mỗi lần (không bịa dữ liệu thẻ giả vì không có model nào cho việc này).
    - `transactions.tsx` — **dữ liệu thật**: dựng lịch sử giao dịch trực tiếp từ `useGetMyBookings()` (mỗi booking là một giao dịch: mã, khách sạn, ngày, tổng tiền, trạng thái), bấm vào mở lại `booking/[id]`.
    - `security.tsx` — **dữ liệu thật**: đổi mật khẩu qua `useUpdateProfile({ password })` và xoá tài khoản qua `useDeleteAccount()` (2 hook self-access đã có sẵn), dùng `TextInput` thuần theo đúng convention của `profile/edit.tsx` (không dùng `components/ui/input` vì không tương thích props).
    - `help-support.tsx` — FAQ tĩnh + liên hệ (mail/điện thoại qua `Linking`).
    - `about.tsx` — thông tin app (tên, version từ `expo-constants`, link điều khoản/chính sách).
  - **Wire `(tabs)/profile.tsx`**: chuyển `BENEFIT_ITEMS`/`FINANCE_ITEMS`/`SETTING_ITEMS` từ hằng số tĩnh (không `onPress`) thành mảng dựng trong component (cần `router`), mỗi item trỏ đúng route tương ứng; nút quick-action "SmartStay Plus" → `/profile/rewards`; "Notifications" trỏ thẳng route `/notifications` đã có sẵn từ trước (chỉ chưa được liên kết) — màn này vốn đã lấy dữ liệu thật từ booking, không phải mock.
  - `npx tsc --noEmit`: sạch ở toàn bộ file mới/sửa (chỉ còn các lỗi pre-existing của scaffolding `components/ui/*` gluestack).

### July 13, 2026

- [x] **Đối chiếu Swagger deploy (onrender) — sửa path lấy KS staff cho đúng endpoint BE đã ship**:
  - Đọc Swagger live `https://smartstayai-system.onrender.com/v1/docs` + route BE đã đồng bộ trong repo. BE **đã bổ sung** endpoint lấy KS staff được phân công, nhưng đặt là **`GET /hotels/staff/mine`** (không phải `/hotels/me/assignments` mà mobile đoán trước đó).
  - **Fix mismatch**: `staffService.listMyHotels` đổi path `/hotels/me/assignments` → **`/hotels/staff/mine`**. Nhờ đó luồng tự lấy `hotelId` sau login (`useMyStaffHotels` → `staffStore`) chạy thật thay vì 404 rồi rơi về env.
  - **Đối chiếu đủ 15 API vận hành staff** (bookings list/lookup/detail/check-in/check-out/no-show/record-cash-payment, housekeeping list/complete, rooms list + update-status, conversations list/detail/reply/resolve) — mobile đã wire đủ, method khớp Swagger (check-in/out là POST, housekeeping complete là POST). **Không còn API staff nào thiếu** ở tầng vận hành. Nhóm quản lý tài khoản nhân viên (`GET/POST /hotels/:id/staff`, `GET/DELETE /hotels/:id/staff/:userId`) là của chủ KS/manager (web), ngoài phạm vi app staff mobile.
  - `npx tsc --noEmit`: sạch (chỉ còn lỗi pre-existing của `components/ui/*`).

- [x] **Fix crash gluestack Input + Camera QR thật cho tab Check-in**:
  - **Crash "animation style to function component View"**: gluestack `Input`/`Textarea` (`components/ui/input|textarea`) không tương thích css-interop trong setup này (InputGroup truyền animated style vào View thuần). Thay hết bằng `TextInput` thuần + NativeWind (đúng convention `profile/edit.tsx`) ở 4 màn staff: `scan`, `check-in/[id]`, `bookings/[id]`, `conversation/[id]`.
  - **Camera QR**: cài `expo-camera` (`npx expo install`), thêm plugin + `cameraPermission` vào `app.json`. `scan.tsx` dùng `CameraView` + `useCameraPermissions` + `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}`: xin quyền camera, quét QR trong khung ngắm, khoá `handlingRef` chống bắn trùng. Parse QR backend `SMARTSTAY|<voucherCode>|<bookingCode>` → lấy `voucherCode` (fallback mã trần) rồi gọi `lookupBooking` → mở booking. Vẫn giữ ô nhập tay.
  - ⚠️ Cần **restart Metro** (`npx expo start -c`) sau khi thêm native module. Camera trên **emulator** là camera ảo, khó quét QR thật → nên test quét trên **máy thật** (Expo Go) hoặc dùng ô nhập mã tay khi chạy emulator.
  - `npx tsc --noEmit`: sạch ở các màn staff.

- [x] **Refactor UI staff theo chuẩn senior mobile hiện đại + chuyển toàn bộ text sang tiếng Anh**:
  - **Design system mới**: cài `expo-linear-gradient`. `constants/staffTheme.ts` bổ sung `STAFF_GRADIENT` (teal 3 stop) + `CARD_SHADOW` (elevation mềm) + label trạng thái tiếng Anh + `dot` color cho mỗi status.
  - **Component dùng chung mới/nâng cấp** (`components/staff/*`): `Card` (surface trắng bo `rounded-3xl` + shadow mềm, chuẩn hoá mọi khối), `FilterChips` (chip lọc đặt trên gradient header), `StatusPill` (thêm chấm màu), `StaffButton` (thêm size sm/md + shadow theo màu cho nút filled + `style` prop), `StaffEmptyState` (icon trong vòng tròn tint), `StaffScreenHeader` (**đổi sang LinearGradient teal**, bo góc dưới 28px, hỗ trợ `children` để nhúng chip/stat + `large` cho hero title), `StaffBookingCard`/`ConversationCard` (avatar chữ cái, divider, icon tint, layout gọn).
  - **Màn hình**: `bookings`/`inbox` (hero gradient + FilterChips lồng trong header), `bookings/[id]` (hero khách + các Card nhóm thông tin có section title + Card tổng tiền nền teal + action bar), `check-in/[id]` (Card khách + voucher + chọn phòng chip), `conversation/[id]` (bong bóng bo góc bất đối xứng, badge "AI assistant", composer bo tròn nút gửi), `scan` (nền **gradient teal immersive** + khung QR bo 32px), `profile` (avatar bo góc + Card info, hiển thị **tên khách sạn** thật qua `useMyStaffHotels`), `refunds` (empty state).
  - **Tab bar** (`(staff)/_layout`): bo góc trên + shadow nổi, nút Check-in giữa đổi thành **hình vuông bo góc gradient teal**.
  - **Toàn bộ chữ hiển thị đã sang tiếng Anh** (labels, filter, empty/error, alert, placeholder). Grep xác nhận không còn chuỗi tiếng Việt trong UI staff (chỉ còn comment code).
  - `npx tsc --noEmit`: **0 lỗi** ngoài scaffolding `components/ui/*` pre-existing. ⚠️ Vừa thêm native module (`expo-linear-gradient`) → cần **restart Metro** (`npx expo start -c`).

- [x] **Bỏ tab Refunds → thêm Dashboard cho staff (chuẩn senior mobile)**:
  - **Xoá Refunds**: xoá `(staff)/refunds.tsx` + folder `(staff)/refunds/`, bỏ khỏi tab bar.
  - **Tab bar mới** (`(staff)/_layout`): thứ tự **Home · Bookings · Check-in (center) · Inbox · Account** (Check-in vẫn ở giữa). `STAFF_HOME` đổi sang `/(staff)/dashboard` — sau login staff vào thẳng dashboard.
  - **Component KPI mới** (`components/staff/*`): `StatCard` (icon trong ô tint + số lớn + nhãn + tone teal/blue/amber/emerald/rose, optional onPress) và `QuickAction` (tile hành động nhanh + badge số).
  - **Màn `dashboard.tsx`**: hero gradient (greeting theo giờ + tên nhân viên + tên KS thật + ngày + 2 hero stat _Arrivals today_ / _In-house_); hàng **Quick actions** (Check-in / Bookings / Inbox có badge escalated); lưới **Overview** 2×2 (Departures today, Rooms available `free/total`, Rooms to clean, Needs takeover) tính từ `useGetBookings`(confirmed+checked_in), `useHotelRooms`, `useHousekeepingTasks`(pending), `useConversations`(escalated); danh sách **Today's arrivals** (lọc `checkInDate == hôm nay`) dùng `StaffBookingCard`, có pull-to-refresh + empty state. Tiếng Anh toàn bộ.
  - `npx tsc --noEmit`: 0 lỗi ngoài `components/ui/*`.

---

_Last Updated: 2026-07-13_

### July 8, 2026

- [x] **QR check-in thật bằng camera (`expo-camera`) ở tab Scan (thay khung placeholder) + sửa data QR sai**:
  - **Bug đã fix (đồng bộ với web + backend)**: `QRVoucher` (`booking/success.tsx`, `booking/[id].tsx`) đang mã hoá `booking.bookingCode` — staff quét ra sẽ **không tra được** vì endpoint `GET .../bookings/lookup?voucherCode=` chỉ nhận `voucherCode`. Thêm `BookingVoucherSummary`/`voucher?` vào `types/bookings.type.ts` (khớp backend `bookingInclude` giờ đã include voucher — xem `server` + `client` PROGRESS), đổi cả 2 màn sang `booking.voucher?.qrData ?? booking.bookingCode`.
  - **Camera thật**: cài `expo-camera` (`npx expo install expo-camera`, ra bản `~17.0.10` khớp SDK 54 thực tế của project — lưu ý AGENTS.md ghi "SDK 56" nhưng `package.json` đang là `~54.0.35`, đã cài đúng theo bản thật). Thêm quyền camera vào `app.json` (`plugins: ["expo-camera", { cameraPermission: "..." }]`) — `npx expo-doctor` 18/18 sạch sau khi thêm.
  - `(staff)/scan.tsx`: thay khung giữ chỗ bằng `<CameraView>` thật (`useCameraPermissions` xin quyền khi chưa cấp, tap để request; `barcodeScannerSettings={{barcodeTypes:['qr']}}`). `onBarcodeScanned` parse chuỗi quét theo định dạng `SMARTSTAY|<voucherCode>|<bookingCode>` (khớp `BookingVoucher.qrData` BE) lấy `voucherCode`, fallback dùng nguyên chuỗi nếu không đúng định dạng; có khoá `scanLocked` chống bắn trùng khi đang tra cứu, mở khoá lại sau khi tra xong (thành công điều hướng sang booking detail, thất bại hiện Alert rồi mở khoá để quét lại). Ô nhập tay giữ nguyên, dùng chung logic tra cứu.
  - `npx tsc --noEmit`: 0 lỗi mới ở mọi file đụng tới (chỉ còn lỗi pre-existing của scaffolding `components/ui/*` gluestack).

- [x] **`formatDate` số (dd-MM-yyyy) + fix `StaffBookingCard` bỏ qua formatter**:
  - Mobile trước đây **chưa có** hàm format ngày dạng số (chỉ có `formatDateShort`/`formatDateLong` dạng chữ "21 Aug 2026") — không phải trùng lặp nên thêm mới `formatDate()` (dd-MM-yyyy) vào `utils/formatDate.ts`, khớp tên + định dạng với `formatDate` bên client (client đổi từ dd/MM/yyyy sang dd-MM-yyyy cùng đợt).
  - `StaffBookingCard.tsx` trước đó tự `booking.checkInDate.slice(0, 10)` (ra thẳng `yyyy-mm-dd` thô từ ISO, bỏ qua mọi formatter) — đổi sang gọi `formatDate()`.

- [x] **Staff Bookings — thêm bộ lọc "Trả phòng hôm nay" (room lấy theo checkout)**:
  - `(staff)/bookings.tsx` trước chỉ lọc theo `BookingStatus` thô (Tất cả/Đã xác nhận/Đang ở/Đã trả phòng/No-show), không có cách nào xem nhanh "phòng nào cần trả hôm nay" — khác biệt so với web `FrontDeskPage` vốn đã có bucket "Departing today". Backend không filter được theo `checkOutDate` (chỉ filter `checkInDate`), nên thêm filter client-side: chip mới **"Trả phòng hôm nay"** gọi API với `status=checked_in` rồi tự lọc tiếp `toDateKey(checkOutDate) === todayKey()`.
  - `npx tsc --noEmit`: sạch ở file đã sửa.

---

_Last Updated: 2026-07-08_
