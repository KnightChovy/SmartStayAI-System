# StayHub - Mobile Development Progress

This file tracks the accomplished tasks, resolved user requests, and structural/functional work completed in the mobile (Expo) application.

> Mỗi lần prompt code phải cập nhật tiến độ vào file này (important!).

---

## Completed Tasks Checklist

### July 29, 2026

- [x] **Staff conversation — bàn phím iOS vẫn che ô nhập (lượt vá trước chưa dứt điểm)**:
  - **Nguyên nhân thật**: `(staff)/conversation/[id]` nằm **trong Tabs navigator**, nên khung màn hình = window − tab bar. iOS bắn `keyboardWillShow` → `KeyboardAvoidingView` tính `padding = frameBottom − keyboardScreenY` = **kbHeight − tabBarHeight**; ngay sau đó tab bar bị ẩn (`tabBarHideOnKeyboard` + custom bar tự `return null`), màn hình dài thêm đúng chiều cao tab bar nhưng padding đã chốt theo khung cũ ⇒ composer bị che **đúng một tab bar (~80px)**. Vá bằng `softwareKeyboardLayoutMode: "pan"` ở lượt trước không đụng tới nhánh iOS nên vô hiệu.
  - **Sửa gốc**: `(staff)/_layout` ẩn hẳn tab bar khi route đang mở **không có trong `TAB_CONFIG`** (mọi màn chi tiết: conversation/bookings/check-in). Màn chi tiết chiếm trọn window ⇒ KAV chỉ đo một khung duy nhất, không còn cuộc đua layout. Đây cũng là việc PROGRESS 30/06 ghi "còn lại: detail screen vẫn thấy tab bar".
  - **Composer**: bỏ `SafeAreaView edges={['bottom']}` (bọc **ngoài** KAV nên cộng thêm ~34px thừa lúc bàn phím mở) → tự tính `paddingBottom = isKeyboardOpen ? 8 : Math.max(insets.bottom, 8)`; nghe `keyboardWillShow/Hide` (iOS) · `keyboardDidShow/Hide` (Android) và cuộn về tin mới nhất khi bàn phím lên.
  - **Android**: gỡ `softwareKeyboardLayoutMode: "pan"` khỏi `app.json` (về mặc định `resize`) và đổi `behavior` Android từ `'height'` → `undefined` — window đã tự co, thêm behavior là co **hai lần**. Đồng bộ với cách chatbox guest đang làm. ⚠️ Đổi native config ⇒ cần **rebuild dev client**, `expo start -c` không đủ.
  - Thêm `keyboardDismissMode` `interactive` (iOS) / `on-drag` (Android) để vuốt đọc lại lịch sử không bị đóng bàn phím ngay từ cú vuốt đầu.
  - `tsc` **0 lỗi** ở file staff, `eslint` không phát sinh lỗi mới (21 lỗi còn lại pre-existing). ⚠️ Chưa chạy được app trong phiên này ⇒ nhờ bạn thử lại trên iPhone.

- [x] **Staff Inbox — keyboard không còn che khung trả lời**:
  - `/(staff)/conversation/[id]` dùng `KeyboardAvoidingView` với `padding` trên iOS và `height` trên Android, nên composer co lên theo vùng còn thấy được thay vì phụ thuộc vào window resize.
  - Vùng danh sách tin nhắn có `flex-1` để luôn nhường phần đáy cho composer; khi focus ô nhập, thread tự cuộn về tin mới nhất. Thêm `keyboardShouldPersistTaps="handled"` để thao tác trong luồng chat không làm keyboard đóng ngoài ý muốn.
  - Bổ sung Android `softwareKeyboardLayoutMode: "pan"` và `tabBarHideOnKeyboard` cho Staff Tabs. Vì tab bar là custom component, nó còn tự lắng nghe keyboard để ẩn hẳn lúc nhập, đảm bảo không chiếm/chồng vùng composer.
### July 30, 2026 — Review chuyển sang thang /10 (theo web FE)

- [x] **Đổi toàn bộ đánh giá của khách từ /5 → /10 để khớp web client** (yêu cầu: "sửa mobile thành 10 theo fe, ko sửa BE"):
  - **Nguyên nhân lỗi gốc** khách gặp (`"overallRating must be ≤ 5"`...): **web ReviewModal đã lên /10** (`RATING_MAX=10`) nhưng **BE Joi vẫn `.max(5)`** ⇒ submit web bị 400. Mobile trước đây gửi /5 nên không lỗi, nhưng lệch thang với web.
  - **Đã làm** (mirror web): util mới `utils/reviewScore.ts` (`REVIEW_SCORE_MAX=10`, `scoreLabelKey` ngưỡng ≥9/≥8/≥7/≥6, `scoreColor`); `ReviewSheet` input 10 sao/tiêu chí + điểm tổng `X.X /10`; `HotelReviews` thanh điểm ÷10 + ô tổng `/10` + nhãn theo ngưỡng /10; `ReviewCard` + `my-reviews` đổi sao → badge số `/10`. `tsc`/`eslint` sạch.
  - ⚠️⚠️ **QUAN TRỌNG — submit sẽ 400 cho tới khi sửa BE**: vì **KHÔNG đụng BE** (theo yêu cầu) mà BE vẫn `Joi.number().min(1).max(5)` (`server/src/validations/review.validation.ts:4`), nên giờ **mobile gửi điểm >5 sẽ bị 400 y hệt web**. Muốn submit chạy phải đổi BE `.max(5)` → `.max(10)` (cả `createReview` lẫn `updateReview`). Đây là việc BE, chưa làm theo yêu cầu.
  - ⚠️ **Dữ liệu cũ hiển thị lệch** (giống web đã ghi nhận): review đã lưu là /5, nay hiển thị như /10 ⇒ 5.0 cũ hiện thành "5.0/10" (nhìn như trung bình). Chỉ đúng hẳn khi BE lên /10 + review mới. ⚠️ Chưa chạy được app ⇒ nhờ xem lại thị giác form 10 sao + badge.

### July 29, 2026 (continued 2) — Price details tách khoản + khớp giá thẻ ngoài ↔ chi tiết

- [x] **Tách "Price details" ở màn phòng thành Tiền phòng → Thuế (X%) → [Phí] → Total** (theo yêu cầu):
  - `RoomType` (`types/hotels.type.ts`) khai thêm `subtotal`/`taxAmount`/`feeAmount` — BE `GET /hotels/:id/room-types` **đã** trả tách khoản (`subtotal + taxAmount + feeAmount = totalPrice`, cùng hàm `computeTaxAndFees` lúc đặt), mobile chỉ chưa khai type nên trước đây không dựng breakdown được.
  - `room/[id].tsx`: `PriceSummary` giờ có dòng tiền phòng + **Thuế (X%)** (suất hiệu dụng = `taxAmount/subtotal`, làm tròn 1 chữ số) + Phí dịch vụ (chỉ khi > 0) + Total = `totalPrice`. i18n `hotel:room.{nightsLine,tax,taxWithRate,fee}` (en/vi cân bằng).
- [x] **Fix "ngoài 2tr6, ấn vô 2tr436"** — hai nguyên nhân:
  - **Bug nhãn dòng** (do lần trước): dòng ghi `basePrice × N đêm` nhưng value là `subtotal` (đã giảm giá) ⇒ không khớp. Nay nhãn dùng **giá mỗi đêm hiệu dụng** = `subtotal / số đêm`, nên "X × N = subtotal" cộng đúng.
  - **Thẻ danh sách hiện `basePrice` (giá gốc), bỏ qua pricing rule + thuế/phí**: KS Đà Nẵng có rule **early_bird −15%** (seed) áp cho lưu trú trong 30 ngày ⇒ 2.600.000 → 2.210.000, +8% thuế +50k phí = 2.436.800. `RoomTypeCard` giờ **mirror web client**: có khoảng ngày (`totalPrice` present) → hiện **tổng cả kỳ đã gồm thuế/phí** + caption "N đêm · tổng" + "gồm X thuế & phí"; không có ngày → `basePrice` "/ đêm". i18n `hotel:room.{perNight,nightsTotal,inclTaxesFees}`.
  - `tsc` sạch (ngoài `components/ui/*` pre-existing), `eslint` sạch. ⚠️ Chưa chạy được app ⇒ nhờ xem lại thị giác thẻ phòng + breakdown.
- [x] **Fix giá "từ" ở màn Search lệch với giá trong chi tiết** ("from 1.022.000" nhưng vào thấy 876.200) — **bộ chọn ngày ngay trên màn Search (như web)**:
  - **Nguyên nhân**: Search **không có bộ chọn ngày**, gọi API không kèm ngày ⇒ BE tính giá "từ" theo **basePrice** (chưa áp pricing rule): 900.000 + 8% + 50k = 1.022.000. Còn trang chi tiết **luôn mặc định hôm nay→mai** ⇒ áp early_bird −15% → phòng rẻ nhất 765.000 + thuế/phí = 876.200.
  - **Cách chọn (theo yêu cầu user)**: **KHÔNG** ép mặc định today→tomorrow ngầm (hướng đó lọc mất KS hết phòng đêm nay). Thay vào đó thêm **`StayPickerSheet` ngay trên màn Search** (giống web): mặc định **TRỐNG** ⇒ hiện **mọi KS**, giá "từ" là ước tính theo basePrice. Khách chọn ngày → refetch có ngày ⇒ giá "từ" áp đúng pricing rule + thuế/phí; ngày được mang sang `/hotel/[id]` qua `detailParams` ⇒ giá trong khớp giá ngoài. Có nút **×** để xoá ngày về lại "mọi KS".
  - `(tabs)/search.tsx`: state `stayCheckIn/Out/guests` + `pickerOpen`; bar ngày/khách trong header tối; `guests` chỉ gửi khi có ngày (không ngày = duyệt, không lọc sức chứa). i18n `search:{addDates,clearDates,stayGuests}` (en/vi cân bằng). `tsc`/`eslint` sạch.
  - ⚠️ **Còn lại (giống hệt web)**: nếu **không chọn ngày** rồi bấm vào KS, trang chi tiết vẫn tự mặc định today→tomorrow (hành vi cũ, web cũng vậy) ⇒ giá "từ" ngoài (ước tính) có thể lệch giá trong (đã giảm). Chọn ngày trên Search là hết lệch. ⚠️ Chưa chạy được app ⇒ nhờ xem lại thị giác bar ngày + luồng chọn.

### July 17, 2026 (continued)

### July 30, 2026

- [x] **Đổi thương hiệu SmartStay AI / Smart Stay → StayHub trên toàn app mobile**:
  - Đổi ở **13 file**: i18n vi/en (`auth`, `account`, `hotel`), màn `profile/about` (tên app + 3 link `smartstay.ai` → `stayhub.ai`), `profile/help-support` (email hỗ trợ), `profile/offers` ("StayHub Plus bonus"), `profile/rewards` (mock lịch sử điểm), `.env` (`EXPO_PUBLIC_APP_NAME`), và **2 chuỗi xin quyền trong `app.json`** (camera/thư viện ảnh — chữ này hiện trong hộp thoại quyền của hệ điều hành).
  - **CỐ Ý KHÔNG đổi 3 định danh kỹ thuật** (đổi là hỏng, không phải bỏ sót):
    - `SMARTSTAY|` trong `app/(staff)/scan.tsx` — **tiền tố QR do BE sinh** (`BookingVoucher.qrData`); web + mobile cùng parse. Đổi một phía là **quét e-voucher hỏng ngay**.
    - `smartstay-auth` / `smartstay-staff` — khoá AsyncStorage của Zustand persist. Đổi = **mọi người dùng đang đăng nhập bị đá ra**, staff mất khách sạn đang trực.
    - `com.tanphatphan091.SmartStayAI` (`app.json` → `android.package`) — **applicationId**. Đổi là một app KHÁC: mất dữ liệu người dùng, sai chữ ký, không update đè được bản đã cài.
  - Còn `smartstayai-system.onrender.com` trong `.env` là **hostname API đang deploy** — đổi khi nào BE đổi domain.
  - **Verify**: 13 file JSON i18n **parse được + vi/en cân bằng khoá**, `app.json` hợp lệ. ⚠️ `tsc` của mobile đang có **110 lỗi CÓ SẴN** do `node_modules` thiếu `react-i18next` (đã khai trong `package.json` nhưng **chưa `npm install`**) + type mismatch của `components/ui/*` (gluestack) — không liên quan đợt đổi tên này (chỉ sửa chuỗi hiển thị, không đụng cấu trúc code).

- [x] **Đánh giá khách sạn cho guest — bám theo cách client làm; sửa luôn 3 lỗ hổng ở màn chi tiết KS**:
  - **Rà soát trước**: client viết đánh giá qua `ReviewModal` mở từ `BookingDetailPage` khi `status === 'checked_out'`, tra `useMyReviews()` để biết đã đánh giá chưa → create (`POST /reviews`) hay edit (`PATCH /reviews/:id`); trang chi tiết KS render `HotelReviews`. **Mobile trước đây thiếu HẲN phần viết đánh giá** (booking detail chỉ có Modify/Cancel, `useCreateReview` viết ra nhưng **không màn nào gọi**).
  - **3 lỗi thật ở màn chi tiết KS (đã sửa)**:
    1. **Điểm trung bình SAI**: tự cộng `overallRating` của đúng **5 review vừa tải** rồi chia → khách sạn 100 đánh giá vẫn ra điểm của 5 cái mới nhất. BE **có sẵn** `GET /hotels/:hotelId/review-stats` (**public**, tính trên toàn bộ review đã duyệt) — nay dùng endpoint này. ⚠️ Đường dẫn là `/review-stats` (gạch nối); `/hotels/:id/reviews/stats` là bản của **chủ KS**, khách gọi vào **401** (đã thử, xác nhận).
    2. **"View all" là nút chết** — không `onPress`, không route. Nay có màn `app/hotel/reviews/[id].tsx` (danh sách đầy đủ + tải thêm + pull-to-refresh).
    3. **Bỏ mất dữ liệu BE đã trả**: thẻ review cũ không render **ảnh**, **điểm thành phần** lẫn **phản hồi của khách sạn** (`managerResponse`).
  - **Tầng dữ liệu** (1 endpoint = 1 hook, đúng AGENTS): types `MyReview`/`UpdateReviewPayload`/`ReviewStats`/`ReviewStatus`/`MyReviewsParams`; `reviewsService` thêm `getMine`/`update`/`getHotelStats`; hooks `use-my-reviews` (enabled theo đăng nhập), `use-update-review`, `use-hotel-review-stats`; thêm key `reviews.mine`/`reviews.hotelStats`.
  - **UI mới**: `StarRating` thêm **chế độ chạm để chấm điểm** (`onRate`, hitSlop 8 vì sao 24-28px vẫn dưới ngưỡng chạm 44pt) — trước chỉ hiển thị được; `ReviewSheet` (viết/sửa, **điểm tổng suy ra = trung bình 4 tiêu chí làm tròn** đúng như client vì BE cần số nguyên 1..5; ảnh nhập bằng **URL** vì BE chỉ nhận URI, chặn sẵn 10 ảnh); `ReviewCard` dùng chung (ảnh + phản hồi KS); `HotelReviews` (điểm tổng + nhãn theo ngưỡng + 4 thanh điểm thành phần + empty state "Mới trên SmartStay" thay vì bịa điểm); màn **`profile/my-reviews`** (xem + sửa, badge `pending`/`hidden`) + link trong Profile.
  - **Vào đúng chỗ**: nút "Viết đánh giá"/"Sửa đánh giá" ở `booking/[id]` **chỉ hiện khi `checked_out`** — khớp luật BE (`review.service.ts`: 400 "Chỉ đánh giá được sau khi đã trả phòng"), nên khách không bao giờ chạm phải lỗi đó.
  - **i18n**: thêm `account.review.*` (25 key) + `account.reviews.*` + `hotel.reviews.*` (20 key) — en/vi **cân bằng** (hotel 50/50, account 127/127).
  - **Verify bằng API THẬT (không đoán)**: (1) `review-stats` gọi **không token → 200**, shape khớp `ReviewStats` từng field; (2) đường dẫn partner → **401** (chứng minh chọn đúng endpoint); (3) `/reviews/me` trả `hotel`+`booking`+`status`, **không** có `customer` → khớp `MyReview`; (4) **E2E**: tạo booking → thu tiền → check-in → check-out → `POST /reviews` (**201**, BE gán `published`) → **stats total 1→2**, review hiện ở list công khai kèm ảnh + tên khách → `PATCH` sửa được, gửi `images: []` **xoá sạch ảnh**, điểm KS tự tính lại **5 → 4.5**; (5) POST vào booking `cancelled` → **400** đúng như dự kiến. **Đã xoá review test (DELETE 204), DB về nguyên trạng** (Đà Nẵng: total 1, overall 5).
  - `tsc` **0 lỗi**, `eslint` **sạch**, `npx expo export` build OK; grep bundle: có route `/hotel/reviews/[id]` + `/profile/my-reviews`, endpoint `/reviews/me` + `/review-stats`, và chuỗi review **cả EN lẫn VI**.
  - **Ghi nhận (chưa sửa, ngoài phạm vi)**: `client` vẫn tự tính trung bình từ mẫu 100 review kèm comment "BE chưa có endpoint stats công khai" — comment đó **đã lỗi thời**, `GET /hotels/:id/review-stats` nay là public; client nên chuyển sang dùng để hết lệch điểm với app.

- [x] **Fix nút dính sát mép dưới (ReviewSheet) + 2 chỗ khác cùng lỗi**:
  - **Nguyên nhân gốc**: khoảng đệm dưới tính bằng `insets.bottom + 12`, mà **`insets.bottom` = 0 trên máy Android điều hướng bằng nút và trên iPhone không có home indicator (SE)** ⇒ nút Lưu chỉ cách mép ~20px, nhìn như dính. Máy có thanh gesture (iPhone 14/15, Android cử chỉ) thì `insets.bottom` = 24–34 nên **không tái hiện được** — dễ bỏ sót nếu chỉ test trên máy đời mới.
  - **Sửa**: dùng **mức sàn** `Math.max(insets.bottom, 12) + n` thay vì cộng trần. `ReviewSheet` chuyển padding vào **`contentContainerStyle`** (padding dọc đặt ở `style` của ScrollView là khung cuộn — sai chỗ, sẽ cắt nội dung) và bỏ `<View>` đệm thủ công + `mb-2` để khoảng thở chỉ đến từ **một nguồn**.
  - **Cùng lỗi, sửa luôn**: footer "Áp dụng" của `StayPickerSheet` (dùng ở Home + đổi lịch booking) và thanh CTA dính đáy ở `booking/checkout.tsx` — đều `insets.bottom + 12`.
  - **Kết quả (tính theo đúng công thức trong code)**: Android nút bấm / iPhone SE — nút Lưu **20px → 40px**, footer **12px → 24px**; máy có gesture giữ nguyên (vốn đã đủ). `tsc` 0 lỗi, `eslint` sạch, `expo export` build OK.

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
  - **`i18next.d.ts` type-safe bắt lỗi thật lúc build, không phải chuỗi thô lòi ra UI**: (1) `useTranslation('chat')` rồi gọi `t('chat:replying')` → sai, ns phải nằm trong tuple; (2) key động ``t(`home:propertyTypes.${x}`)`` chỉ hợp lệ khi `x` là **union literal** ⇒ thêm `as const` cho `PROPERTY_TYPES`, đổi `HotelFilter.id` từ `string` sang union `FilterId`; (3) đổi `useTranslation('common')` → `['account','common']` thì defaultNS đổi theo, `t('language')` phải thành `t('common:language')`.
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

### July 29, 2026

- [x] **Đồng bộ chatbox mobile với widget chat phía client**:
  - Bỏ selector khách sạn cũ; chatbot mobile nay là trợ lý toàn sàn, gửi `POST /conversations/messages/stream` không kèm `hotelId` như `FloatingChatWidget` trên client.
  - Làm mới UI theo client: header avatar + trạng thái online, lời chào, quick replies, bong bóng AI/khách bất đối xứng và composer bo tròn.
  - `clearChat` trở về lời chào ban đầu thay vì màn empty cũ; giữ streaming SSE và khóa gửi trùng trong hook hiện có.
  - Thêm terminal diagnostics trên Metro (chỉ `__DEV__`) cho request, HTTP headers/status, `meta`, độ dài từng `chunk`, response hoàn chỉnh và response lỗi; không log token.
  - `FlatList` chiếm đúng phần còn lại giữa header/composer (`flex-1`), nên thread dài sẽ tạo vùng cuộn thật; auto-scroll về cuối khi gửi tin hoặc nhận SSE chunks mới, rồi cuộn lại sau layout thêm 80ms.
  - Gắn thêm trigger vào `onLayout` của bubble cuối cùng: mỗi lần response stream đổi chiều cao sau native layout đều ép list cuộn xuống tin mới nhất.

- [x] **Chỉnh lại auto-scroll của Chatbox AI (mobile) — bám cách client làm, bỏ 4 trigger chồng nhau**:
  - **Đối chiếu client trước**: `FloatingChatWidget` cuộn **thẳng khung tin nhắn** (`thread.scrollTo({top: scrollHeight, behavior:'smooth'})`) trong **một** effect `[isOpen, messages, isTyping]`, cố ý **không** dùng `scrollIntoView` (hàm đó cuộn mọi khung tổ tiên, kéo tụt cả trang phía sau). Không port 1:1 sang RN được: `FlatList` **chưa layout xong** lúc state đổi ⇒ `scrollToEnd` trong effect cuộn theo chiều cao **cũ**. Đó chính là lý do bản mobile phải chữa cháy bằng `requestAnimationFrame` + `setTimeout(80)`.
  - **Vấn đề thật của bản cũ**: **4 nguồn** cùng ép cuộn (effect theo `[isStreaming, messages]`, `onContentSizeChange`, `onLayout` của list, `onLayout` của bubble cuối) + mỗi lần lại cuộn **2 lượt** (rAF rồi timeout 80ms). Mỗi chunk SSE (vài lần/giây) kích hoạt cả chùm ⇒ giật, và **ép cuộn vô điều kiện** nên khách kéo lên đọc lại lịch sử là bị giật thẳng về đáy, không đọc nổi trong lúc AI đang trả lời. `handleSend` còn có thêm `setTimeout(..., 100)` thứ năm.
  - **Sửa**: giữ **`onContentSizeChange` làm nguồn chính** — RN bắn callback này **sau** khi content đã đo lại chiều cao (kể cả bubble cao dần theo từng chunk), đúng vai trò của `scrollHeight` bên client, nên không cần rAF/timeout đoán thời điểm nữa. Giữ `onLayout` của list cho trường hợp **bàn phím mở làm khung co lại** (content không đổi ⇒ `onContentSizeChange` không bắn). Xoá effect theo state, xoá `setTimeout` 80ms + 100ms, xoá trigger `onLayout` ở bubble cuối (và prop `onLayout` của `MessageBubble` — không còn nơi nào dùng).
  - **Thêm "stick to bottom"** (client không cần vì khung chat chỉ cao 360px, mobile là full màn): `onScroll` đo `contentSize - offset - layout`, trong **48px** tính từ đáy mới auto-cuộn. Kéo lên xem lịch sử thì AI stream không giật; tự bấm gửi thì `stickToBottomRef = true` để luôn kéo về cuối.
  - Thêm `keyboardShouldPersistTaps="handled"` (bấm quick-reply lúc bàn phím đang mở trước đây tốn 2 chạm: chạm đầu chỉ đóng bàn phím) + `keyboardDismissMode="on-drag"`.
  - **Verify**: `npx tsc --noEmit` **0 lỗi** ở 2 file sửa (63 lỗi còn lại đều là scaffolding `components/ui/*` pre-existing), `eslint` **sạch**. ⚠️ Chưa chạy được app trong phiên này ⇒ cảm giác cuộn thực tế bạn thử lại giúp.

- [x] **Fix bàn phím che tin nhắn ở Chatbox AI (ảnh chụp iPhone: bong bóng cuối bị composer cắt ngang)**:
  - **Vì sao `onLayout` của list không đủ**: bàn phím làm khung chat co lại theo **hai cơ chế khác nhau** — iOS co bằng `padding` của `KeyboardAvoidingView`, Android co bằng chính window (`windowSoftInputMode` mặc định `resize`) — nên thời điểm layout xong lệch với lúc bàn phím hiện, `scrollToEnd` gọi trong `onLayout` chạy trên chiều cao chưa chốt. Nay nghe thẳng **`Keyboard.addListener('keyboardDidShow')`** (bắn sau khi bàn phím + layout đã ổn định) rồi kéo về cuối; đồng thời bật lại cờ stick-to-bottom vì chạm vào ô nhập = có ý định gõ tiếp (đúng hành vi Messenger).
  - **Lỗi thứ hai, chỉ Android**: `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` — Android **đã** tự co window rồi, thêm `height` là co **hai lần**, khung chat hụt thêm đúng một chiều cao bàn phím. `app.json` không khai `softwareKeyboardLayoutMode` ⇒ đang ở mặc định `resize`, đã xác nhận. Đổi Android sang `undefined` (KAV thành `View` thường), iOS giữ `padding`.
  - **Verify**: `tsc` 0 lỗi ở file sửa (63 lỗi `components/ui/*` pre-existing giữ nguyên), `eslint` sạch. ⚠️ Chưa chạy được app ⇒ nhờ bạn thử lại trên **cả iOS và Android** (hai nền tảng đi hai nhánh code khác nhau ở chỗ này).

- [x] **Chatbox AI: lịch sử NHIỀU đoạn chat kiểu ChatGPT (drawer trái, đổi tên, xoá từng đoạn)**:
  - **Chốt chặn từ backend (đã đọc code, không đoán)**: `GET /conversations/mine` có **`distinct: ['hotelId']`** (`conversation.service.ts:937`) ⇒ hội thoại toàn sàn (`hotelId = null`) chỉ trả về **đúng 1 dòng, luôn là cái mới nhất**; `GET /conversations/me` cũng chỉ trả cái mới nhất; **không có** endpoint lấy hội thoại theo id cho khách, **không có** xoá, **không có** `title` (`subject` tồn tại nhưng chưa bao giờ được ghi). ⇒ Danh sách đoạn chat **bắt buộc** do mobile tự quản dưới máy. Nhưng `POST /conversations/messages/stream` **có** nhận lại `conversationId` cũ của chính user và chạy tiếp đúng hội thoại đó (`service:746-752`) ⇒ mỗi đoạn giữ `conversationId` riêng thì mở lại đoạn cũ **AI vẫn nhớ ngữ cảnh**. Không đụng server (theo yêu cầu).
  - **Store viết lại**: `threads: Record<ownerKey, StoredChatThread>` (1 hội thoại/tài khoản) → **`owners: Record<ownerKey, { sessions: ChatSession[], activeSessionId }>`**. `ChatSession` = `{ id, title, isTitleCustom?, messages, conversationId, createdAt, updatedAt }`, sort `updatedAt` desc. 7 action: `createSession`/`ensureActiveSession`/`setActiveSession`/`saveMessages`/`renameSession`/`deleteSession`/`clearOwner`.
  - **Migration bắt buộc, suýt thành bug trắng dữ liệu**: bản trước persist **chưa khai `version`** ⇒ máy người dùng đang lưu `version: 0`. Chỉ đổi shape mà không khai `migrate` thì zustand giữ nguyên `{threads}` và `state.owners` thành `undefined` → **crash ngay khi mở tab Chat**. Nay `version: 2` + `migrate` biến hội thoại cũ thành **đoạn đầu tiên và mở sẵn** (hội thoại rỗng thì bỏ, không đẻ đoạn ma); `partialize` đổi `{threads}` → `{owners}` trong cùng commit.
  - **4 safeguard cũ giữ nguyên, thêm 2 trần mới**: strip cờ `streaming` + không ghi giữa lúc stream + không lưu lời chào + effect khôi phục đọc `getState()` thay vì subscribe. Thêm `MAX_SESSIONS = 30` — cap 100 tin vốn tính cho **một** hội thoại, giờ dung lượng nhân theo số đoạn mà persist ghi lại TOÀN BỘ store mỗi lần set.
  - **Bẫy khó nhất (đã xử lý)**: `sendMessage` phải gán **`restoredKeyRef` TRƯỚC** khi `activeSessionId` từ store lan về. Không thì effect khôi phục tưởng vừa "đổi đoạn" và **ghi đè đúng tin khách vừa gõ** bằng bản rỗng trong storage. Kèm: selector `sessions` fallback về hằng `EMPTY_SESSIONS` ở module scope — trả `[]` mới mỗi render sẽ trượt `Object.is` của zustand v5 và render vô hạn; `activeSessionId` subscribe dạng **scalar** để tự lưu không kéo theo re-render.
  - **Drawer trái** (`components/chat/ChatHistoryDrawer.tsx`): `Modal` + reanimated v4 (`withTiming` 220ms, translateX + opacity backdrop). Dùng `Modal` chứ không phải overlay trong màn chat vì drawer phải phủ cả **tab bar** và không bị `KeyboardAvoidingView` cắt. Reanimated là lựa chọn đúng chỗ: đã chạy production ngay trong thư mục này (`TypingDots`) và AGENTS §5.8 chỉ định v4. Animation **mở chạy trong `onShow`** — view của Modal ở cây native riêng, khởi động sớm hơn thì panel dễ đứng im. Có xử lý ca **mở lại khi animation đóng chưa xong** (Modal chưa unmount nên `onShow` không bắn lần nữa → phải tự đảo chiều, không thì drawer đóng luôn dù vừa bấm mở). Inset dùng **mức sàn** `Math.max(insets.bottom, 12)` — đúng lỗi đã phải sửa ở `StayPickerSheet`/`ReviewSheet`/`checkout`.
  - **Không làm swipe-to-close**: `app/_layout.tsx` không có `GestureHandlerRootView`, mà gesture-handler trong `Modal` trên Android còn cần một cái lồng riêng — sửa root layout ảnh hưởng mọi màn chỉ để lấy một cử chỉ. Đóng bằng backdrop / ✕ / back cứng Android / chọn một dòng.
  - **Đổi tên**: `Alert.prompt` **chỉ có trên iOS** (Android là no-op ⇒ nút sẽ im lặng không làm gì) nên tự dựng `RenameSessionDialog` (Modal + `TextInput` tái dùng nguyên class của composer). Dialog render ở **màn chat, KHÔNG lồng trong Modal của drawer** — hai `Modal` RN chồng nhau từ cùng parent không đáng tin trên iOS; luồng là đóng drawer trước rồi mới mở dialog. Đổi tên xong set `isTitleCustom` nên `saveMessages` thôi tự sinh lại tiêu đề; xoá trắng tên = quay về tự đặt. Đổi tên **không** đụng `updatedAt` để dòng không nhảy chỗ dưới ngón tay.
  - **Tự đặt tên**: `deriveTitle()` lấy tin đầu tiên của khách, gom khoảng trắng, cắt 40 ký tự **theo ranh giới từ**. Đoạn chưa nhắn gì thì `title = ''` và UI thay bằng nhãn i18n — **không bao giờ ghi chuỗi i18n xuống storage**, cùng lý do với lời chào (đổi VI⇄EN xong tên sẽ kẹt ở tiếng cũ).
  - **Header**: `☰` mở drawer · `create-outline` (đoạn mới) **thay cho** thùng rác. Bỏ luôn `isClearing` + delay 900ms của lượt trước — chúng chỉ sinh ra để chặn thao tác không hoàn tác được, giờ `Alert.alert` xác nhận làm việc đó tốt hơn (đúng pattern `booking/[id].tsx`). Xoá đoạn hiện tại vẫn làm được qua drawer → `⋯` → Xoá.
  - **Edge case**: bấm "đoạn mới" hai lần liên tiếp **không** để lại hai dòng trắng (`createSession` dùng lại đoạn rỗng có sẵn); xoá đoạn đang mở → rơi về đoạn mới nhất còn lại, xoá hết → `activeSessionId = null` (màn chat trắng có lời chào, **không** đẻ dòng rỗng); đổi/tạo đoạn bị **khoá khi đang stream** (chunk sẽ đổ vào tin đã biến mất khỏi màn hình), riêng đổi tên vẫn cho vì không đụng `messages`.
  - **Thời gian tương đối**: thêm `relativeTimeParts()` vào `utils/formatDate.ts` — trả về **mô tả** (`{unit, count}`) chứ không phải chuỗi, giữ file này i18n-free như thiết kế cũ. So theo **ngày lịch** chứ không theo mốc 24 giờ (23:00 hôm qua nhìn từ 01:00 hôm nay phải là "Hôm qua", không phải "2 giờ trước"). Quá 7 ngày rơi về `formatDate()` dd-MM-yyyy.
  - **i18n**: thêm nhánh `history.*` (22 key), xoá key `clear` chết. **en/vi cân bằng 33/33, 0 key thiếu hai chiều** (kiểm tự động).
  - **Verify**: `tsc` **về đúng baseline 63 lỗi** (toàn `components/ui/*` pre-existing, 0 lỗi ở file mới/sửa), `eslint` **sạch**, **`npx expo export --platform android` build thành công** (8.13 MB); grep thẳng bundle Hermes: có `smartstay-chat`, `history.time`, và chuỗi **cả EN lẫn VI** (`New chat`, `Chats`, `Rename chat`, `Trò chuyện mới`, `Đoạn chat`, `Đổi tên cuộc trò chuyện` — VI lưu UTF-16 nên phải dò đúng encoding).
  - ⚠️ **Rủi ro cần bạn test trên máy Android thật**: reanimated trong `Modal` mount ở cây view native riêng, kiểu hỏng kinh điển là panel **đứng im ở vị trí ban đầu**. Đã phòng bằng `onShow`; nếu vẫn vênh thì đổi 2 `useAnimatedStyle` sang `Animated.Value` + `Animated.timing({useNativeDriver:true})` — ~20 dòng, gói gọn trong `ChatHistoryDrawer.tsx`, không thứ gì khác phụ thuộc.
  - ⚠️ **Đã biết, ngoài phạm vi**: đăng nhập KHÔNG gộp lịch sử `guest` sang tài khoản; lịch sử là **của máy này** — gỡ app hoặc đổi máy là mất danh sách (hội thoại vẫn còn trên server nhưng không có đường mở lại vì BE thiếu endpoint lấy theo id).

- [x] **Chatbox AI: lưu lịch sử chat dưới máy theo từng user + nút Xoá có trạng thái đang xử lý**:
  - **Lưu hội thoại** (`stores/chatStore.ts` mới, Zustand + `persist` qua AsyncStorage — đúng pattern `authStore`/`staffStore` sẵn có): tắt app mở lại vẫn còn nguyên đoạn chat **và `conversationId`**, nên nhắn tiếp là AI vẫn nhớ ngữ cảnh chứ không mở hội thoại mới. Trước đây state chỉ nằm trong `useState` của hook ⇒ rời màn/tắt app là mất sạch.
  - **Khoá theo user** (`threads: Record<ownerKey, StoredChatThread>`, `ownerKey = user.id ?? 'guest'`): một máy nhiều tài khoản thì mỗi người một lịch sử, đăng nhập tài khoản khác **không** thấy chat của người trước. Có khoá `guest` riêng vì backend dùng `optionalAuth`, khách vãng lai vẫn chat được.
  - **KHÔNG lưu lời chào**: lời chào + quick reply đổi theo ngôn ngữ đang chọn; lưu vào storage thì bấm VI⇄EN xong mở lại app sẽ thấy lời chào bằng ngôn ngữ **cũ**. Lúc khôi phục dựng lại lời chào từ i18n hiện hành rồi nối lịch sử phía sau — giống cách widget web khôi phục hội thoại.
  - **3 cái bẫy đã xử lý**: (1) **không ghi giữa lúc stream** — mỗi chunk SSE (vài lần/giây) sẽ là một lần serialize + ghi AsyncStorage, vừa phí vừa giật; chỉ ghi khi một lượt đã chốt (`isStreaming` về `false`). (2) Effect khôi phục đọc `useChatStore.getState()` chứ **không** subscribe `threads` — subscribe thì mỗi lần tự lưu lại kích hoạt effect và **ghi đè tin đang nhắn**. (3) Cờ `streaming` bị **strip** trước khi lưu: tắt app giữa lúc AI đang trả lời mà lưu cả cờ thì mở lại sẽ thấy con trỏ `▌` nhấp nháy vĩnh viễn trên một tin không còn ai stream tiếp. Kèm giới hạn **100 tin** gần nhất/hội thoại (persist ghi lại TOÀN BỘ store mỗi lần set, chat dài vô hạn sẽ làm chậm cả lúc khởi động app).
  - **Nút Xoá**: thêm `isClearing` — bấm xong hiện `ActivityIndicator` ~900ms rồi mới dọn, thay vì cả màn hình bốc hơi ngay dưới ngón tay. Khoá nút khi **đang stream** (xoá giữa lượt sẽ để lại hội thoại rỗng trong khi chunk vẫn đổ về một tin không còn tồn tại) và khi đang xoá; có `accessibilityLabel` + `accessibilityState.busy`.
  - **Type về đúng chỗ** (AGENTS mục 8): `ChatMessage` chuyển từ `hooks/chat/use-chatbot.ts` sang `types/chatbot.type.ts`, thêm `StoredChatThread`; hook re-export lại nên các nơi `import type { ChatMessage } from '@/hooks/chat'` không phải sửa. i18n thêm key `clear` (en/vi **cân bằng**) — `i18next.d.ts` type-safe bắt được ngay lúc build khi tôi dùng key chưa khai.
  - **Verify**: `tsc` 0 lỗi ở mọi file mới/sửa (63 lỗi `components/ui/*` pre-existing giữ nguyên), `eslint` sạch. ⚠️ Chưa chạy được app ⇒ nhờ bạn thử: chat vài câu → **kill app** → mở lại (phải còn lịch sử) → nhắn tiếp (AI phải nhớ ngữ cảnh) → đăng xuất, đăng nhập tài khoản khác (phải là hội thoại trắng).

- [x] **Bỏ HẲN cơ chế ép cuộn ở Chatbox AI → `FlatList inverted` (2 lỗi iOS còn lại sau 2 lượt vá)**:
  - **Vì sao 2 lượt vá trước không dứt điểm**: `FlatList` thường neo nội dung ở **đỉnh**, nên mỗi lần khung co lại (bàn phím) hay content cao thêm (chunk SSE) thì phần đáy bị đẩy ra ngoài viewport, và code phải **chạy đua với layout** để gọi `scrollToEnd` cho kịp. Mọi biến thể (effect theo state, `rAF` + `setTimeout`, `onContentSizeChange`, `onLayout`, `Keyboard.addListener`) đều là vá triệu chứng của cùng một sai lầm kiến trúc.
  - **Đổi sang `inverted`** (cách chuẩn cho màn chat trong RN): list lật ngược nên **offset 0 nằm ở ĐÁY**, tin mới nhất tự dính đáy mà không cần một lời gọi cuộn nào. Xoá sạch: `listRef`, `stickToBottomRef`, `scrollToLatest`, `handleScroll`, `useEffect` nghe bàn phím, `onContentSizeChange`, `onLayout`, `scrollEventThrottle`, hằng `STICK_TO_BOTTOM_THRESHOLD` — file không còn hàm cuộn nào. Data đảo bằng `useMemo(() => [...messages].reverse())` vì index 0 giờ là dòng dưới cùng.
  - **Lỗi 2 — "muốn cuộn phải thoát bàn phím"**: do `keyboardDismissMode="on-drag"` đóng bàn phím ngay từ cú vuốt đầu. iOS đổi sang **`interactive`** (vuốt cuộn bình thường, chỉ đóng khi kéo xuống chạm bàn phím — đúng hành vi iMessage/Messenger); Android giữ `on-drag` vì `interactive` là API riêng của iOS.
  - Giữ nguyên `KeyboardAvoidingView` chỉ-iOS ở lượt trước (composer vẫn phải né bàn phím).
  - **Hệ quả của `inverted` (đã xử lý)**: hội thoại ít tin (vừa vào, mới có lời chào) thì content ngắn hơn khung ⇒ mặc định bị dồn xuống **đáy** màn hình, nhìn như đang chat dở. Thêm `flexGrow: 1` + `justifyContent: 'flex-end'` vào `contentContainerStyle`: container cao bằng khung, tin bị đẩy về cuối trục **chưa lật** — sau khi lật thành ra nằm trên đầu như một hội thoại mới. Content dài hơn khung thì 2 thuộc tính này tự vô hiệu, list cuộn như thường.
  - **Verify**: `tsc` 0 lỗi ở file sửa (63 lỗi `components/ui/*` pre-existing giữ nguyên), `eslint` sạch. ⚠️ `inverted` dùng `transform: scaleY(-1)` — trên Android có tiền sử vênh shadow/elevation ở cell; màn này bubble chỉ dùng border + nền phẳng nên không ảnh hưởng, nhưng vẫn nên liếc qua khi test Android.

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

### July 29, 2026

- [x] **Đổi mật khẩu (Security) — thêm ô "mật khẩu hiện tại" + gọi đúng endpoint xác minh**:
  - **Rà soát BE trước**: `PATCH /v1/users/:userId` (self-access) chỉ băm `password` mới **không** kiểm mật khẩu cũ. BE đã có endpoint chuyên biệt **`PATCH /v1/users/me/password`** (`user.route.ts`, auth) nhận `{ currentPassword, newPassword }`: `user.service.changeMyPassword` `bcrypt.compare` mật khẩu hiện tại (sai → 400 "Mật khẩu hiện tại không đúng"), chặn trùng mật khẩu cũ (400), rồi trả **204**. Màn `profile/security.tsx` trước đây đổi mật khẩu qua `useUpdateProfile({ password })` → **bỏ qua xác minh mật khẩu cũ**.
  - **Tầng dữ liệu** (1 endpoint = 1 hook, đúng AGENTS): type `ChangePasswordPayload` (`types/users.type.ts`); `usersService.changeMyPassword` (`PATCH /users/me/password`); hook `use-change-password.ts` + barrel (`useMutation`, `userId` chỉ để chặn khi chưa đăng nhập — BE lấy id từ token).
  - **UI** `profile/security.tsx`: thêm ô **Current password** (trên New/Confirm), `autoCapitalize="none"` cả 3 ô; validate thứ tự current-required → tối thiểu 8 ký tự → khớp confirm → khác mật khẩu cũ; đổi từ `useUpdateProfile` sang `useChangePassword`, reset cả 3 ô khi thành công, lỗi BE hiện inline.
  - **i18n**: thêm `account.security.currentPassword` / `currentRequired` / `sameAsOld` (EN/VI cân bằng).
  - `npx tsc --noEmit`: sạch ở file mới/sửa (39 lỗi còn lại đều pre-existing của `components/ui/*`).

### July 29, 2026 (continued)

- [x] **Nhắn tin guest ↔ nhân viên khách sạn trên mobile (trang tài khoản) — bám theo client**:
  - **Rà soát trước (backend + client)**: BE **không** có API nhắn tin người-với-người riêng — guest↔staff dùng **CHUNG** bộ endpoint chatbot `/v1/conversations` với cơ chế **handoff/escalation**. Guest gọi: `GET /conversations/mine` (danh sách kiểu Messenger), `GET /conversations/me?hotelId=` (khôi phục hội thoại + ≤50 tin), `POST /conversations/messages` (gửi tin — bot trả lời, hoặc ghi cho nhân viên khi đang handoff), `PATCH /conversations/:id/mode` (`mode='human'` → escalate tới nhân viên; `'ai'` → về bot). **Dùng cờ `handoff` (BE tính) để biết "người thật đang xử lý", KHÔNG dùng `status`** (sau khi nhân viên trả lời, `status` về `active` nhưng `handoff` vẫn `true`). SenderType: `user|ai_bot|staff|system`. Client web có trang `/account/messages` (Messenger 2 cột, toggle AI/Người, hotel-picker để mở hội thoại mới) + **Socket.IO** realtime.
  - **Mobile chưa có socket.io** → dùng **polling** (`refetchInterval: 5000` ở thread) thay realtime — kết quả hiển thị tương đương, không thêm dependency native.
  - **Tầng dữ liệu** (đúng AGENTS, 1 endpoint = 1 hook): `types/messages.type.ts` (`MyConversationListItem`/`MyConversationResponse`/`ConversationMessage`/`SendMessagePayload`/`SetConversationModePayload` + enum sender/status/mode); `services/messages.service.ts` (`listMine`/`getMine`/`sendMessage`/`setMode`); hooks `hooks/messages/` (`use-my-conversations`, `use-my-conversation` polling, `use-send-message`, `use-set-conversation-mode`) + barrel; thêm `queryKeys.messages.{mine,thread}`.
  - **UI mới** (`app/profile/messages/`): `index.tsx` — danh sách hội thoại (lọc `hotel !== null` như client), avatar KS + tin cuối + thời gian tương đối + badge "Nhân viên" khi handoff, empty state + nút "+"; `[hotelId].tsx` — thread: bong bóng theo senderType (user phải/tối, staff trái + headset "Lễ tân", ai_bot trái + sparkles "Trợ lý AI", system căn giữa), banner handoff, **toggle Trợ lý AI ⇄ Nhân viên** (gọi `setMode`, xác nhận trước khi gặp nhân viên), composer đa dòng, auto-scroll khi có tin mới; `new.tsx` — hotel-picker (`useGetHotels({limit:100})` + tìm kiếm client-side) để mở hội thoại mới. Thêm util `formatTime`/`formatRelative`.
  - **Wire**: thêm mục **Tin nhắn** (icon `chatbubbles-outline`) vào `settingItems` của `(tabs)/profile.tsx` → `/profile/messages`.
  - **i18n**: `account.menu.messages(+Sub)` + block `account.messages.*` (28 key: title/empty/toggle/handoff/error…) + `common.you` — EN/VI cân bằng.
  - `tsc` sạch (sau khi Expo regenerate typed-routes cho 3 route mới), `eslint` sạch, `expo export` build OK.
  - ⚠️ **Còn lại**: chưa có realtime (dùng polling 5s); chưa lọc tồn tại/khôi phục theo `conversationId` (khôi phục theo `hotelId` như BE); trợ lý toàn nền tảng (`hotelId=null`) bị ẩn khỏi danh sách (giống client) vì không có nhân viên.

- [x] **Sửa hồ sơ mobile bám theo client: bỏ "New password", cho sửa đủ trường + upload avatar**:
  - **Rà soát client + BE trước**: client `ProfileForm` gọi **`GET/PATCH /v1/users/me`** (không phải `/users/:userId`) với view-model phẳng; BE có `updateMyProfile` (route `PATCH /users/me`, auth) nhận `fullName / phone / avatarUrl / dateOfBirth / nationality / idCardNumber / passportNumber` (+ preferences), upsert bảng `UserProfile`, trả User kèm `profile`, **không** cho đổi email/role/status. Avatar: `POST /v1/uploads` (multipart field `file`, query `folder`) → `{ url, publicId }` (Cloudinary). Mobile trước đây chỉ sửa được name/email/**password** qua `PATCH /users/:userId`.
  - **Tầng dữ liệu** (đúng AGENTS, 1 endpoint = 1 hook): types `MyProfile` (view-model phẳng) / `MyProfileResponse` / `MyProfileRaw` / `UpdateMyProfilePayload`; `usersService.getMyProfile` + `updateMyProfile` (map `toViewModel`/`toDto` y hệt client — cắt `dateOfBirth` còn `YYYY-MM-DD`, chuỗi rỗng → `null`); hooks `use-my-profile` (GET, enabled theo đăng nhập) + `use-update-my-profile` (PATCH, đồng bộ `authStore` fullName/phone/avatarUrl để navbar/prefill thấy ngay); thêm key `users.me`. Upload: `services/upload.service.ts` (`uploadImage(uri)` — FormData `{ uri, name, type }` vì RN không có `File`) + `hooks/uploads/use-upload-image`.
  - **UI** `profile/edit.tsx` viết lại theo layout trong ảnh: card **Ảnh đại diện** (ảnh tròn/khởi tạo chữ + nút "Tải ảnh lên" qua `expo-image-picker` → upload → set `avatarUrl`, có "Xoá ảnh"); các cặp trường 2 cột **Họ tên / SĐT**, **Email** (chỉ đọc, nền mờ + badge "Đã xác minh" theo `emailVerifiedAt`), **Ngày sinh** (ô YYYY-MM-DD + icon lịch, validate ngày thật/không tương lai) **/ Quốc tịch**, **Số CCCD/CMND / Số hộ chiếu**. **Bỏ hẳn ô New password** — đổi mật khẩu đã có màn Security riêng. Chỉ gửi field đã đổi; loading spinner khi tải profile; footer dùng `Math.max(insets.bottom,12)+12`.
  - `app.json`: thêm plugin `expo-image-picker` (`photosPermission`). ⚠️ Thêm native plugin → cần **rebuild dev client** (`npx expo start -c` không đủ cho native config).
  - **i18n**: mở rộng `account.edit.*` (photo/upload/uploading/remove/uploadError/phone/verified/dob/nationality/idCard/passport/emailNote/nameRequired/save…) + `common.ok` — EN/VI cân bằng.
  - `tsc` **0 lỗi** mới (39 lỗi còn lại đều pre-existing `components/ui/*`), `eslint` sạch ở toàn bộ file mới/sửa.
  - ⚠️ **Còn lại**: DOB nhập tay dạng YYYY-MM-DD (chưa có native date-picker — client dùng `<DatePicker>`); preferences (ngôn ngữ/tiền tệ/marketing) BE có nhưng **không** nằm trong ảnh nên chưa đưa vào form mobile. `useGetProfile`/`useUpdateProfile` (bản `/users/:userId`) giữ lại nhưng không còn màn nào dùng.

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
