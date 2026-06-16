# Kế hoạch thiết kế giao diện CLIENT — Phần USER (Guest + Customer)

> **Phạm vi:** Chỉ làm **UI (frontend client)**. KHÔNG động vào backend.
> Database (`server/prisma/schema.prisma`) chỉ dùng để **hình dung dữ liệu user sẽ có** → quyết định màn hình hiển thị field gì.
> Nguồn yêu cầu: `UseCaseWdp` (use case diagram) — 3 actor thuộc phần user: **Guest**, **Authorized User**, **Customer**.

---

## 1. Khoanh vùng "phần user" theo Use Case

| Actor | Bản chất | Use case |
|---|---|---|
| **Guest** | Khách vãng lai, chưa đăng nhập | View Blog · Register · Login · Forgot Password · Browse Rooms · Search Rooms · View Room Details · Check Room Availability · Chat with AI Assistant · Get Personalized Recommendations |
| **Authorized User** | Lớp cha của mọi tài khoản đã đăng nhập (Customer kế thừa) | Manage Profile · Receive Notifications · Logout |
| **Customer** | Khách đã đăng nhập, đặt phòng | Make Room Booking · Make Payment · View Booking · View Booking History · View Upcoming Bookings · Manage Booking (→ Cancel / Modify Reservation) · Request Refund · Redeem Discount Voucher (→ Earn Loyalty Points) · Upload Review Photos · Receive Notifications |

> Staff / Marketer / Hotel Partner / Admin **KHÔNG thuộc** phạm vi này (đã hoặc sẽ làm ở cổng riêng `/partner`, `/admin`).

---

## 2. Hiện trạng client (đã có gì)

**Đã có (cần rà / nối lại, phần lớn đang UI tĩnh hoặc hardcode):**
- `pages/guest/`: `HomePage`, `DestinationsPage`, `DealsPage`, `AccommodationTypesPage`, `RoomDetailPage` (hardcode "executive-penthouse"), `BookingInformationPage`
- `pages/auth/`: `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `VerifyEmailPage`, `VerifyIdentityPage`
- `components/layout/`: `Layout`, `Navbar` (đã có dropdown user + "My Account" trỏ tạm về `/`), `Footer`, `DigitalConcierge` (khung chat AI)
- Hạ tầng: `lib/api.ts` (axios + refresh token), `stores/authStore.ts`, `constants/roles.ts`, `routes/guestRoutes.tsx`, `ProtectedRoute.tsx`

**Chưa có (cần xây mới) — toàn bộ khu tài khoản Customer:**
- Trang kết quả tìm kiếm thật (Search Results)
- Chi tiết khách sạn / phòng động (theo id, không hardcode)
- Luồng đặt phòng → thanh toán → xác nhận hoàn chỉnh
- Khu "Tài khoản của tôi": Profile, Đặt phòng của tôi (lịch sử + sắp tới), chi tiết booking, e-voucher/QR, hoàn tiền, đánh giá, điểm thưởng (loyalty), thông báo

---

## 3. Nguồn dữ liệu cho từng nhóm UI

> Vì chỉ làm UI, mỗi màn hình sẽ ở 1 trong 2 trạng thái dữ liệu:
> - **[API]** Endpoint backend **đã tồn tại** → service gọi thật.
> - **[MOCK]** Backend **chưa có** endpoint → dựng `service` trả **dữ liệu mock** đúng shape theo DB, để sau này chỉ việc đổi sang gọi API thật. Type được model hóa từ `schema.prisma`.

| Nhóm | Trạng thái | Ghi chú |
|---|---|---|
| Auth (login/register/otp/forgot/reset/verify) | **[API]** | `/auth/*` đã có đủ |
| Tìm khách sạn + room type (public) | **[API]** | `GET /hotels`, `GET /hotels/:id/room-types` |
| Tạo booking / booking của tôi / chi tiết / hủy | **[API]** | `POST /bookings`, `GET /bookings/me`, `GET /bookings/:id`, `PATCH /bookings/:id/cancel` |
| Hồ sơ cá nhân (xem/sửa chi tiết) | **[MOCK]** | DB `User` + `UserProfile`; `/users` hiện chỉ cho admin |
| Thanh toán (Make Payment) | **[MOCK]** | DB `Payment`; chưa có endpoint client |
| Hoàn tiền (Request Refund) | **[MOCK]** | DB `Refund` |
| E-voucher / QR | **[MOCK]** | DB `BookingVoucher` (`voucherCode`, `qrData`) |
| Đánh giá + ảnh (Upload Review Photos) | **[MOCK]** | DB `Review`, `ReviewImage` |
| Điểm thưởng (Loyalty) | **[MOCK]** | DB `LoyaltyAccount`, `LoyaltyTransaction` |
| Thông báo (Notifications) | **[MOCK]** | DB `Notification` |
| Voucher giảm giá (Promotion/redeem) | **[MOCK]** | DB `Promotion`, `BookingPromotion` |
| Chat AI / gợi ý phòng | **[MOCK]** | DB `Conversation`, `Message`; nối UI vào `DigitalConcierge` sẵn có |

---

## 4. Bản đồ Route (cổng user)

```
/                         Layout (Navbar + Footer + DigitalConcierge)  — public
├─ /                      HomePage                         [có sẵn, rà lại]
├─ /search                SearchResultsPage   ★ mới        [API hotels]
├─ /hotels/:hotelId       HotelDetailPage     ★ mới (động) [API]   ← thay RoomDetailPage hardcode
├─ /destinations          DestinationsPage                 [có sẵn]
├─ /deals                 DealsPage                        [có sẵn]
├─ /accommodation-types   AccommodationTypesPage           [có sẵn]
├─ /blog, /blog/:slug     BlogListPage / BlogDetailPage    ★ mới [MOCK]  (View Blog)
│
├─ /booking               BookingCheckoutPage  ★ (gộp từ BookingInformation) [API tạo booking]
│   step 1 Thông tin khách → step 2 Thanh toán → step 3 Xác nhận
├─ /booking/:id/success   BookingSuccessPage   ★ mới  (voucher + QR)  [API + MOCK voucher]
│
└─ /account  (ProtectedRoute: đã đăng nhập)        ★ KHU MỚI — AccountLayout (sidebar trái)
   ├─ /account             → redirect /account/profile
   ├─ /account/profile     ProfilePage            ★ [MOCK]  Manage Profile
   ├─ /account/bookings    MyBookingsPage         ★ [API]   History + Upcoming (tabs)
   ├─ /account/bookings/:id BookingDetailPage     ★ [API + MOCK]  View Booking, Cancel, Refund, Voucher
   ├─ /account/reviews     MyReviewsPage          ★ [MOCK]  Upload Review Photos
   ├─ /account/loyalty     LoyaltyPage            ★ [MOCK]  điểm + hạng + lịch sử
   ├─ /account/vouchers    MyVouchersPage         ★ [MOCK]  Redeem Discount Voucher
   ├─ /account/notifications NotificationsPage    ★ [MOCK]  Receive Notifications
   └─ /account/settings    AccountSettingsPage    ★ [MOCK]  đổi mật khẩu, ngôn ngữ/tiền tệ, thiết bị
```

★ = cần làm mới. Auth routes (`/login`, `/register`, ...) giữ nguyên, chỉ rà UI.

---

## 5. Chi tiết từng màn hình (mục đích · UI · field dữ liệu theo DB)

### A. GUEST (public)

**A1. HomePage** `/` — *rà lại, không xây mới*
- Giữ Hero search, Destinations, Deals, Loyalty banner, AI concierge.
- Sửa: nút Search → điều hướng `/search?city=&checkIn=&checkOut=&guests=`.

**A2. SearchResultsPage** `/search` ★ **[API]**
- **Mục đích:** Browse/Search Rooms.
- **UI:** thanh filter (thành phố, ngày nhận/trả, số khách, khoảng giá, hạng sao, tiện nghi) · danh sách `HotelCard` · phân trang · map (tùy chọn, đã có maplibre).
- **Field (DB `Hotel` + `RoomType`):** name, city, address, starRating, ảnh cover (`HotelImage` isPrimary), giá thấp nhất (`roomTypes.basePrice` / `totalPrice` từ API), availableRooms.
- **Trạng thái:** loading skeleton · empty ("không có phòng trống") · error.

**A3. HotelDetailPage** `/hotels/:hotelId` ★ **[API]** (thay `RoomDetailPage` hardcode)
- **Mục đích:** View Room Details + Check Room Availability.
- **UI:** gallery ảnh (lightbox) · thông tin khách sạn (mô tả, địa chỉ, bản đồ, giờ check-in/out, tiện nghi `HotelAmenity`) · danh sách `RoomTypeCard` (tên, ảnh, maxOccupancy, bedType, viewType, areaSqm, giá/đêm, tiện nghi phòng) · ô chọn ngày + số khách để **Check Availability** → hiện `availableRooms` + `totalPrice` → nút "Đặt ngay".
- **Field (DB):** `Hotel`, `HotelImage`, `Amenity/HotelAmenity`, `RoomType`, `RoomTypeImage`, `RoomTypeAmenity`, `RoomAvailability`.

**A4. BlogListPage / BlogDetailPage** `/blog` ★ **[MOCK]**
- **Mục đích:** View Blog. DB chưa có bảng blog → mock danh sách bài + chi tiết. Layout tạp chí du lịch.

**A5. Chat AI (DigitalConcierge)** — *nối UI* **[MOCK]**
- **Mục đích:** Chat with AI Assistant + Get Personalized Recommendations.
- **UI:** bong bóng chat nổi, cửa sổ hội thoại (tin nhắn user/AI), quick-reply, card gợi ý phòng (`booking_card`). Stream giả lập bằng mock.
- **Field (DB):** `Conversation`, `Message` (senderType, messageType, content).

### B. LUỒNG ĐẶT PHÒNG

**B1. BookingCheckoutPage** `/booking` ★ **[API tạo booking]**
- **Mục đích:** Make Room Booking + Make Payment (Customer).
- **UI:** stepper 3 bước:
  1. **Thông tin khách** — họ tên, email, SĐT, số khách, yêu cầu đặc biệt (`specialRequests`); ô nhập mã giảm giá (Redeem Voucher).
  2. **Thanh toán** — chọn `PaymentMethod` (vnpay / sepay / stripe / cash), preview thẻ; **[MOCK]** màn hình gateway giả lập.
  3. **Xác nhận** — tóm tắt.
- **Sidebar:** tóm tắt đơn (khách sạn, loại phòng, ngày, số đêm `numNights`, `basePricePerNight`, `subtotal`, `discountAmount`, `totalAmount`).
- **Yêu cầu đăng nhập** → nếu chưa, đẩy qua `/login` rồi quay lại.
- **Field (DB):** `Booking` (đủ field), `Payment`, `Promotion`.

**B2. BookingSuccessPage** `/booking/:id/success` ★ **[API + MOCK voucher]**
- **Mục đích:** xác nhận đặt phòng thành công + e-voucher.
- **UI:** mã booking (`bookingCode`), QR voucher (`BookingVoucher.qrData`), nút tải hóa đơn (`Invoice.pdfUrl` — mock), CTA "Xem đặt phòng của tôi".

### C. KHU TÀI KHOẢN CUSTOMER (`/account`, cần đăng nhập)

**C0. AccountLayout** ★ — sidebar trái (Profile · Đặt phòng · Đánh giá · Điểm thưởng · Voucher · Thông báo · Cài đặt) + vùng nội dung. Header hiện avatar, tên, hạng loyalty.

**C1. ProfilePage** `/account/profile` ★ **[MOCK]**
- **Mục đích:** Manage Profile.
- **UI:** avatar (upload — dùng `POST /uploads` đã có), form: fullName, phone, email (readonly + badge "đã xác thực" theo `emailVerifiedAt`), dateOfBirth, nationality, idCardNumber, passportNumber, preferredLanguage (vi/en), preferredCurrency (VND/USD), marketingOptIn (toggle).
- **Field (DB):** `User` + `UserProfile`.

**C2. MyBookingsPage** `/account/bookings` ★ **[API]**
- **Mục đích:** View Booking History + View Upcoming Bookings.
- **UI:** 2 tab "Sắp tới" / "Lịch sử" (lọc theo ngày + `status`); mỗi item = `BookingCard` (ảnh, tên KS, ngày, số đêm, `BookingStatusBadge`, tổng tiền) → click vào chi tiết.
- **Field (DB):** `Booking` + `hotel` + `roomType` (API `/bookings/me` đã include sẵn).

**C3. BookingDetailPage** `/account/bookings/:id` ★ **[API + MOCK]**
- **Mục đích:** View Booking · Manage Booking (Cancel/Modify) · Request Refund · xem Voucher.
- **UI:** timeline trạng thái · thông tin phòng/khách sạn · bảng giá · nút **Hủy** (`PATCH .../cancel` — [API], có dialog lý do) · nút **Sửa** (Modify — [MOCK]) · nút **Yêu cầu hoàn tiền** ([MOCK], form lý do + số tiền) · QR voucher · nút viết đánh giá (nếu `checked_out`).
- **Field (DB):** `Booking`, `BookingVoucher`, `Payment`, `Refund`, `Review`.

**C4. MyReviewsPage** `/account/reviews` ★ **[MOCK]**
- **Mục đích:** Upload Review Photos.
- **UI:** danh sách review đã viết + nút viết mới cho booking đã `checked_out`. Form: chấm sao tổng + 4 tiêu chí (cleanliness, service, location, value), tiêu đề, nội dung, **upload ảnh** (dùng `FileUploadDropzone` + `POST /uploads`). Hiện `managerResponse` nếu có.
- **Field (DB):** `Review`, `ReviewImage`.

**C5. LoyaltyPage** `/account/loyalty` ★ **[MOCK]**
- **Mục đích:** Earn Loyalty Points.
- **UI:** thẻ hạng (bronze/silver/gold/platinum) + tổng điểm + thanh tiến độ lên hạng · lịch sử giao dịch (earn/redeem/expire) · điểm sắp hết hạn.
- **Field (DB):** `LoyaltyAccount`, `LoyaltyTransaction`.

**C6. MyVouchersPage** `/account/vouchers` ★ **[MOCK]**
- **Mục đích:** Redeem Discount Voucher.
- **UI:** danh sách khuyến mãi khả dụng (code, mô tả, % / số tiền giảm, HSD, điều kiện minNights) · nút "Áp dụng" lưu để dùng ở checkout.
- **Field (DB):** `Promotion`.

**C7. NotificationsPage** `/account/notifications` ★ **[MOCK]**
- **Mục đích:** Receive Notifications.
- **UI:** danh sách thông báo theo `NotificationType` (booking_confirmed, payment_success, check_in_reminder, review_request, promotion...) · lọc đã đọc/chưa đọc · đánh dấu đã đọc · badge số chưa đọc trên chuông ở Navbar.
- **Field (DB):** `Notification`.

**C8. AccountSettingsPage** `/account/settings` ★ **[MOCK + API đổi MK]**
- **UI:** đổi mật khẩu · ngôn ngữ & tiền tệ · quản lý thiết bị đăng nhập (`UserSession`) · tùy chọn nhận thông báo (`PushToken` / channel) · xóa tài khoản (soft).

---

## 6. Component dùng chung cần tạo (`components/shared/`)

- `HotelCard`, `RoomTypeCard` — card kết quả tìm kiếm
- `BookingCard` + `BookingStatusBadge` (map 6 `BookingStatus` → màu)
- `StarRating` (hiển thị + nhập)
- `DateRangePicker` (chọn ngày nhận/trả, dùng `date-fns`)
- `GuestSelector` (số khách)
- `PriceSummary` (bảng tính tiền dùng chung checkout + detail)
- `QRVoucher` (render `qrData`)
- `EmptyState`, `LoadingSkeleton`, `Pagination` (đã có `common/pagination`)
- `AmenityList`, `SentimentBadge`
- Tái dùng: `FileUploadDropzone` (đã có ở hotel-verify), `ui/*` (shadcn), `DigitalConcierge`

---

## 7. Cấu trúc file dự kiến tạo mới

```
src/
├─ pages/
│  ├─ guest/        SearchResultsPage, HotelDetailPage, BlogListPage, BlogDetailPage,
│  │                BookingCheckoutPage, BookingSuccessPage
│  └─ account/      AccountLayout, ProfilePage, MyBookingsPage, BookingDetailPage,
│                   MyReviewsPage, LoyaltyPage, MyVouchersPage, NotificationsPage,
│                   AccountSettingsPage
├─ components/
│  ├─ shared/       (mục 6)
│  ├─ search/       SearchFilters, HotelCard...
│  ├─ hotel-detail/ Gallery, RoomTypeCard, AvailabilityChecker...
│  ├─ booking/      BookingStepper, GuestInfoForm, PaymentStep, ConfirmStep, PriceSummary
│  └─ account/      AccountSidebar, ReviewForm, LoyaltyCard, NotificationItem...
├─ services/        hotel.service.ts [API], booking.service.ts [API],
│                   profile.service.ts [MOCK], review.service.ts [MOCK],
│                   loyalty.service.ts [MOCK], notification.service.ts [MOCK],
│                   promotion.service.ts [MOCK], payment.service.ts [MOCK]
├─ hooks/           bookings/, hotels/, reviews/, loyalty/, notifications/  (TanStack Query)
├─ stores/          bookingStore.ts (giỏ đặt phòng), uiStore.ts (chat/sidebar)
├─ types/           hotel.types.ts, booking.types.ts (mở rộng), review.types.ts,
│                   loyalty.types.ts, notification.types.ts, payment.types.ts
├─ validations/     booking.validation.ts, review.validation.ts, profile.validation.ts
├─ constants/       routes.ts (path constants), queryKeys.ts
└─ routes/          accountRoutes.tsx (mới) + cập nhật guestRoutes.tsx, index.ts
```

> Mọi service [MOCK] đặt cùng interface với [API] → khi backend xong chỉ đổi thân hàm, không sửa UI.

---

## 8. Quy ước thiết kế (theo AGENTS.md sẵn có)

- **Stack:** React 19 + Vite + TS, Tailwind v4, shadcn/Radix, react-router v7 (object routes), TanStack Query (server state), Zustand (client/global state), react-hook-form + Zod, `lib/api.ts` axios.
- **Đặt tên:** folder `kebab-case`, component `PascalCase.tsx`, page có hậu tố `Page`.
- **i18n/tiền tệ:** chuẩn bị format VND/USD, vi/en (theo `UserProfile.preferredLanguage/Currency`).
- **A11y + responsive:** mobile-first, skeleton loading, empty/error state cho mọi list.
- **Style:** kế thừa design system `.btn-common` + role modifier đã có trong `index.css`.

---

## 9. Phân đợt triển khai (đề xuất)

| Đợt | Nội dung | Phụ thuộc |
|---|---|---|
| **1. Nền tảng** | `routes.ts`, `queryKeys.ts`, shared components (Card/Badge/DatePicker/PriceSummary), `accountRoutes`, `AccountLayout`, cập nhật Navbar (chuông thông báo, link /account) | — |
| **2. Tìm & xem (Guest)** | SearchResultsPage, HotelDetailPage (động) + AvailabilityChecker | API hotels |
| **3. Đặt & thanh toán** | BookingCheckoutPage (3 bước), BookingSuccessPage + QR | API bookings + MOCK payment |
| **4. Khu tài khoản** | MyBookings, BookingDetail (cancel/refund), Profile, Settings | API bookings + MOCK |
| **5. Tương tác & thưởng** | MyReviews (+upload ảnh), Loyalty, Vouchers, Notifications | MOCK |
| **6. Nội dung & AI** | Blog, hoàn thiện DigitalConcierge (gợi ý phòng) | MOCK |

---

## 10. Câu hỏi cần bạn chốt trước khi code

1. **Đợt nào làm trước?** (đề xuất theo thứ tự 1→6, hoặc bạn chọn ưu tiên khác)
2. **Ngôn ngữ UI:** tiếng Việt, tiếng Anh, hay song ngữ (toggle)?
3. **Trang đã có (Home/Deals/Destinations/AccommodationTypes):** giữ nguyên giao diện hiện tại hay redesign đồng bộ với các trang mới?
4. **Blog & Chat AI:** có nằm trong đợt này không, hay để sau (vì 100% mock)?
5. **Mức độ mock:** mock dữ liệu tĩnh trong file, hay mock có lưu localStorage để thao tác (thêm/sửa/xóa) thấy được thay đổi?

> Sau khi bạn duyệt mục 9 + 10, tôi mới bắt đầu code.
