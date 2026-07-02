# Smart Stay AI - Client Development Progress

This file tracks the accomplished tasks, resolved user requests, and visual/functional refactoring completed in the client application.

---

## Completed Tasks Checklist

### July 2, 2026

- [x] **Manager Dashboard — làm lại toàn trang theo Acceptance Criteria (AC-1→AC-8, mock data)**:
  - **Data layer mock (shape theo API tương lai)**: `types/dashboard.types.ts`; `services/dashboard.service.ts` = MOCK deterministic theo date-range (revenue/bookings prorate theo ngày, activeUsers/hotelPartners là level; sparkline 8 tháng; verifications giữ state module-level để approve/reject phản ánh ngay; search phân nhóm hotels/users/bookings); hooks `hooks/dashboard/` (summary/time-series/verifications/review-mutation/alerts/top-hotels/recent-activity/search, dùng `keepPreviousData`).
  - **AC-1 Charts**: `RevenueTrendChart` (area, 12 tháng), `BookingsBarChart` (bar), `UsersGrowthChart` (line) — đủ tiêu đề, trục X/Y, tooltip custom giá trị chính xác, responsive `ResponsiveContainer`; khung `ChartCard` dùng chung.
  - **AC-2 KPI cards**: 4 card chuẩn hoá — giá trị + `ChangeBadge` (xanh↑/đỏ↓/xám–) + dòng "vs previous period" + **mini `Sparkline`** (SVG) + click card điều hướng trang tương ứng (Revenue→/revenue, Partners→/hotel-partners, Users/Bookings→/analytics).
  - **AC-3 Date range filter**: `DashboardDateRangePicker` preset Today/This Week/This Month/This Quarter/This Year/Custom + validate from≤to; đổi range refetch mọi khối; **persist trong URL query params** (`preset`/`from`/`to`) nên giữ khi reload.
  - **AC-4 Loading/Empty/Error**: skeleton riêng cho KPI/chart/list (`states.tsx`), empty state có icon+text+CTA, error + nút "Try again" từng khối (không spinner toàn trang).
  - **AC-5 Actionable lists**: `RecentVerifications` có View/Approve/Reject (Approve/Reject qua `ConfirmDialog` + toast); `PolicyAlerts` có link "View detail" tới hồ sơ hotel; badge trạng thái dùng token dùng chung (`labels.ts`).
  - **AC-6 Search**: `DashboardSearch` command palette — mở bằng click, **⌘/Ctrl+K** hoặc **"/"**, gõ ≥2 ký tự → gợi ý phân nhóm Hotels/Users/Bookings (debounce 250ms), Esc đóng.
  - **AC-7 A11y/Responsive**: KPI grid 4→2→1; các hàng chart/list `lg:grid-cols-2/3` stack 1 cột dưới lg; icon-only button có `aria-label`; focus-visible ring; metadata dùng `slate-500` (contrast tốt hơn `slate-400`).
  - **AC-8 Bổ sung quản lý**: `PendingQueueCard` ("Needs your attention" đếm verification chờ duyệt), `TopHotelsWidget` (top theo revenue), `RecentActivity` (audit log), nút **Export** (dropdown CSV / PDF-print).
  - Toàn bộ tách nhỏ dưới `components/manager/dashboard/` + barrel; `DashboardPage.tsx` là orchestrator (URL range + ghép component). `npx tsc`: 0 lỗi ở dashboard, tổng vẫn 21 pre-existing.
  - ⚠️ Mock data (theo yêu cầu) — khi có BE chỉ cần thay thân `services/dashboard.service.ts` sang `api.get(...)`, không đụng hook/type/component.

- [x] **Manager Analytics — tách component (page thành orchestrator mỏng)**:
  - Bóc toàn bộ UI trong `AnalyticsPage.tsx` ra `components/manager/analytics/`: `AnalyticsKpiCards` (+ `KpiCard` nội bộ), `AnalyticsTrendChart` (+ `LineTooltip`/`LowDataBlock`), `AnalyticsTopHotels` (tự giữ state Show all), `AnalyticsTopCities` (+ `CityTooltip`), `AnalyticsSkeleton`, `ChangeBadge`, `states.tsx` (`EmptyBlock`), và `helpers.ts` (formatNumber/formatPercent, `periodChange`/`conversionChange`, `ChartTooltipProps`, hằng `PIE_COLORS`/`SMALL_SAMPLE`/`MIN_TREND_POINTS`/`TOP_HOTELS_PREVIEW`). Barrel `index.ts` export toàn bộ.
  - `AnalyticsPage.tsx` giờ chỉ còn header + toggle + error/loading + orchestrate các component (truyền `data.totals/timeSeries/topHotels/topCities` + `period`, dim khi `isFetching`). Không đổi hành vi (A1–A8 giữ nguyên). `tsc` sạch, tổng lỗi vẫn 21 pre-existing.

- [x] **Manager Analytics — nâng cấp UI trên data sẵn có (NHÓM A: A1–A8, không đụng BE)**:
  - **A1 — Badge % thay đổi trên KPI cards**: tính từ chính `timeSeries` (kỳ cuối vs kỳ trước) — `bookings`/`confirmedBookings`/`newUsers` qua `periodChange`, riêng Conversion Rate qua `conversionChange` (so tỷ lệ confirmed/bookings 2 kỳ). Badge xanh↑/đỏ↓/xám– (null → "—" khi <2 kỳ hoặc kỳ trước = 0), kèm dòng `vs previous month|year` (đổi theo toggle).
  - **A2 — Low-data guard**: đếm số điểm khác 0; `< 3` điểm → hiện khối "Not enough data to show a trend yet" thay vì vẽ line phẳng gây hiểu nhầm.
  - **A3 — Cỡ mẫu cho Conversion Rate**: card hiển thị `based on N booking(s)`; `N < 10` → chuyển tông amber + icon cảnh báo (mẫu nhỏ dễ gây hiểu lầm khi = 100%).
  - **A4 — Custom tooltip**: line chart hover → tên + giá trị đủ 3 series (Bookings/Confirmed/New Users) + mốc thời gian; donut hover → city + số booking + %.
  - **A5 — Top Hotels top-N + Show all**: `topLimit=10`, mặc định hiện 5, nút "Show all (N)"/"Show less"; thanh bar chuẩn hoá theo max của **toàn** danh sách. (Không thêm drill-down vì manager portal chưa có route chi tiết hotel.)
  - **A6 — Loading skeleton**: giữ `AnalyticsSkeleton` (đã có), thêm dòng skeleton thứ 4 cho vùng badge/note; dim nội dung khi `isFetching` (đổi period) để không nhảy layout.
  - **A7 — Responsive**: KPI grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (4→2→1); block dưới `lg:grid-cols-3` stack 1 cột dưới 1024px.
  - **A8 — Toggle Monthly/Yearly gọi lại API**: `usePlatformAnalytics({ period, topLimit })` — đổi period → query key đổi → refetch với `period=month|year` (BE đã hỗ trợ). Số liệu format nhất quán qua `formatNumber`.
  - Tách nhỏ trong file: `KpiCard`, `ChangeBadge`, `LineTooltip`, `CityTooltip`, `LowDataBlock`. `npx tsc -p tsconfig.app.json --noEmit`: file sạch, tổng lỗi vẫn 21 (pre-existing, không liên quan).

- [x] **Manager Revenue — làm lại toàn trang theo Acceptance Criteria (mock data + viết spec BE)**:
  - **Bối cảnh & quyết định**: BE hiện KHÔNG có endpoint revenue (chỉ có `/admin/overview` snapshot + `/admin/commissions` per-booking, đều không lọc theo date-range, không time-series, không target). Theo chỉ đạo: **làm mock data trước** cho đúng AC + **viết spec cho BE bổ sung**. Export chọn **CSV only**.
  - **Spec BE**: `docs/revenue-api-spec.md` — mô tả 5 nhóm endpoint đề xuất dưới `/v1/platform-manager/revenue`: `summary` (KPI + so kỳ trước), `timeseries` (revenue/commission/target, bucket day|month, compare), `by-partner` (bảng có sort/search/filter/paginate + changePct), `breakdown` (donut theo city/businessType), và model **RevenueTarget** + GET/PUT targets. Ghi rõ cách migrate mock→thật (chỉ đổi thân service).
  - **Data layer khớp contract (để swap mock→API chỉ sửa service)**: `types/revenue.types.ts`; `services/revenue.service.ts` = **MOCK deterministic theo date-range** (FNV-1a seed → cùng một hàm gốc sinh ra KPI/chart/bảng nên mọi khối luôn nhất quán, AC-1.4; kỳ tương lai clip về 0 để test empty; có delay giả lập loading); hooks `hooks/revenue/` (summary/time-series/by-partner/breakdown, `by-partner` dùng `keepPreviousData` chống nhảy layout).
  - **Utils**: `utils/formatCurrency.ts` thêm `formatCompactVnd` (₫X.XB/₫XM/₫XK) + `formatVndFull` (tooltip số đầy đủ, AC-11); `utils/exportCsv.ts` (CSV RFC-4180 + BOM cho Excel tiếng Việt).
  - **UI** `components/manager/revenue/`: `RevenueDateRangePicker` (preset Hôm nay/Tháng này/Tháng trước/Quý này/Năm nay/Tùy chọn + validate from≤to, AC-1); `RevenueKpiCards` (compact value + tooltip full, dòng "so với kỳ trước", info tooltip cách tính, AC-4); `ChangeBadge` (xanh↑/đỏ↓/xám– theo dấu, AC-3.7/4.2); `RevenueVsCommissionChart` (dual Y-axis + overlay kỳ trước, AC-5/9); `RevenueVsTargetChart` (bar, màu đạt/chưa đạt + tooltip %đạt target, AC-6; tự ẩn khi target=null); `RevenueBreakdownChart` (donut theo khu vực, AC-8); `RevenuePartnerTable` (sort mọi cột + icon hướng, search debounce 300ms, filter status, phân trang giữ sort/filter, drill-down `/manager/hotel-partners?partnerId=`, đủ Hotel/Bookings/Gross/Commission/Rate/Change%/Status, AC-3). Mỗi khối có **loading skeleton / empty / error + Thử lại** riêng (`states.tsx`, AC-2). Custom tooltip dùng type riêng `chart-tooltip.ts` (recharts v3 đổi shape `TooltipProps`).
  - **Page** `RevenuePage.tsx`: 1 global date-range điều phối toàn bộ hook (summary/timeseries/breakdown/table cùng range → nhất quán); header có picker + nút **Export CSV** (toast thành công/lỗi qua sonner, AC-7); layout responsive 1→2→3 cột (AC-10).
  - **Lưu ý cho reviewer**: đây là **mock** (theo yêu cầu) — DoD "test với data thật" sẽ đạt sau khi BE làm xong theo `docs/revenue-api-spec.md`. Target/breakdown-by-region là 2 phần BE chưa có nguồn, đã ghi rõ trong spec.
  - `npx tsc -p tsconfig.app.json --noEmit`: mọi file mới/đụng tới đều sạch (2 lỗi recharts formatter cũ ở RevenuePage đã hết); chỉ còn lỗi pre-existing không liên quan (unused `React`, `User.name`, `NodeJS`).

- [x] **Manager Analytics — nối trang vào API thật `GET /platform-manager/analytics` (bỏ mock)**:
  - **Bối cảnh**: BE đã có đủ route + controller + service + swagger cho `/platform-manager/analytics` (schema `PlatformAnalytics`: `totals{totalBookings,confirmedBookings,conversionRate,totalUsers}`, `period`, `range`, `timeSeries[]`, `topCities[]`, `topHotels[]`). Trang `pages/manager/analytics/AnalyticsPage.tsx` trước đây toàn dữ liệu hardcode (growthData/conversionData/topCities + KPI tĩnh) và bịa funnel view→search mà API không hề có.
  - **Data layer (đúng convention 1 endpoint = 1 file)**: `types/analytics.types.ts` (`PlatformAnalyticsParams` + `PlatformAnalytics` và các sub-type khớp swagger); `services/analytics.service.ts` (`getPlatformAnalytics(params)` → `GET /platform-manager/analytics`, lọc param rỗng bằng `cleanParams`); domain hook `hooks/analytics/` (`keys.ts` → `analyticsKeys.platform(params)`, `use-platform-analytics.ts` → `usePlatformAnalytics`, barrel `index.ts`).
  - **UI**: `AnalyticsPage` giờ gọi `usePlatformAnalytics({ period })` với toggle **Monthly/Yearly**; KPI cards (Total/Confirmed Bookings, Conversion Rate = `conversionRate` hiển thị %, Total Users); line chart time-series (bookings/confirmed/newUsers); Top Hotels dạng bar-list (width theo maxBookings) và Top Cities dạng pie + legend (share % tính client-side từ tổng). Có skeleton lúc loading, error card + nút Retry, và empty-block khi mảng rỗng. Tooltip formatter để `v` untyped (tránh lỗi recharts `ValueType` như ở RevenuePage).
  - `npx tsc -p tsconfig.app.json --noEmit`: mọi file mới/đụng tới đều sạch; chỉ còn lỗi pre-existing không liên quan (unused `React`, `User.name`, `NodeJS`, recharts formatter ở RevenuePage).

- [x] **Thay `<input type=date>` bằng shadcn DatePicker (Popover + Calendar) cho Hotel Partner + siết validation ngày chặt chẽ**:
  - **Cài shadcn**: `npx shadcn add calendar popover` (kéo `react-day-picker` v10). Giữ nguyên `button.tsx` (đã custom `size="xs"`) — từ chối overwrite. Sửa import `@/lib/utils` → `@/lib/cn` trong `calendar.tsx` + `popover.tsx` (dự án dùng `lib/cn`).
  - **Component chung** `components/ui/date-picker.tsx`: controlled, `value`/`onChange` dạng `YYYY-MM-DD` (tương thích value cũ), hiển thị **dd/MM/yyyy**, hỗ trợ `min`/`max` (vừa bound dropdown năm vừa disable ngày ngoài khoảng), nút Clear, `captionLayout="dropdown"`. Trigger là Button `type="button"` (không submit form); Calendar portal ra ngoài form nên chọn ngày không submit. Thêm RHF wrapper `DateField` vào `hotel-partner/shared/form-controls.tsx` (Controller + DatePicker + FieldShell).
  - **Áp dụng + logic ngày**:
    - `PricingRuleFormModal` → `DateField` start/end với min/max động (end ≥ start ngay trên lịch). `pricingRuleFormSchema`: thêm `requiredDate` (đúng format + ngày thật) và giữ refine end ≥ start (an toàn khi 1 vế chưa hợp lệ).
    - `BookingsTab` filter (from/to) → DatePicker, from ≤ to qua min/max chéo.
    - `ProfileForm` (dùng chung, hiển thị ở `/partner/profile`) → DOB: max = hôm nay, min = 120 năm trước.
    - Verify wizard (`PropertyDetailsStep`, `AccommodationCertificateStep`, `RepresentativeVerificationStep`) → Controller + DatePicker. `hotel-verify.validation.ts` thêm helper ngày (`isDateStr`/`notFuture`/`ageFrom`): license/certificate `issueDate` không được tương lai; `expiryDate ≥ issueDate`; **người đại diện phải ≥ 18 và ≤ 120 tuổi**, DOB không tương lai; DatePicker của DOB bound max = 18 năm trước.
  - `npx tsc -p tsconfig.app.json --noEmit`: không phát sinh lỗi mới; chỉ còn lỗi pre-existing (`User.name`, unused `React`, recharts formatter).

- [x] **Profile self-service dùng chung (`CommonProfilePage`) + nối API thật `/users/me` — áp dụng Hotel Partner & Manager**:
  - **Nối API thật (bỏ mock localStorage)**: BE đã có `GET /users/me` + `PATCH /users/me` (self-service, id lấy từ token; không nhận email/role/status). `services/profile.service.ts` viết lại gọi API thật, map response lồng (User + `profile`) ↔ view-model phẳng `UserProfile`: `dateOfBirth` cắt còn `YYYY-MM-DD` cho `<input type=date>`, patch **whitelist** đúng field self-service (BE Joi reject unknown key nên bỏ email/emailVerifiedAt). Thêm raw types `MyProfileResponse`/`UserProfileRaw`/`UpdateMyProfileDto` vào `types/account.types.ts`. `hooks/account/use-profile.ts` đổi `useProfile()` bỏ tham số `seed` (không cần nữa).
  - **Trang dùng chung** trong `common/`: `common/profile/ProfileForm.tsx` (form avatar-upload + info + preferences, tách từ trang guest cũ, lưu qua `useUpdateProfile`) và `common/profile/CommonProfilePage.tsx` (heading + `useProfile` + skeleton + form). Guest `pages/account/ProfilePage.tsx` giờ render `<CommonProfilePage />` (dedupe, hết dùng seed).
  - **Route theo cổng** (mỗi role render chung 1 trang): `ROUTES.partnerProfile` = `/partner/profile`, `ROUTES.managerProfile` = `/manager/profile`; đăng ký `{ path: 'profile', element: <CommonProfilePage /> }` trong `partnerRoutes.tsx` + `managerRoutes.tsx` (nằm trong layout nên giữ sidebar). Helper `getProfilePathForRole(role)` trong `constants/routes.ts`.
  - **Navbar chung** `common/navbar/Navbar.tsx`: link **Profile** ở dropdown giờ trỏ theo role qua `getProfilePathForRole(user?.role)` — Hotel Partner + Manager (đều dùng CommonNavbar mặc định) tự vào đúng cổng của mình.
  - **Còn lại (theo yêu cầu "trước mắt làm partner + manager")**: Admin & Staff **chưa** thêm route/link (2 layout này tự override `rightContent` của navbar) — sẽ bổ sung sau; data-layer + trang chung đã sẵn sàng để cắm thêm.
  - `npx tsc -p tsconfig.app.json --noEmit`: không phát sinh lỗi mới; chỉ còn lỗi pre-existing (`User.name`, unused `React`, recharts formatter).

- [x] **`formatDate` dùng chung theo dd/MM/yyyy + áp dụng cho Hotel Partner & Manager**:
  - **Util** `utils/formatDate.ts`: đổi `formatDate` thành formatter ngày chung dạng **`dd/MM/yyyy`** — nhận `string | Date | null`, trả "—" nếu rỗng/không hợp lệ (build thủ công `dd`/`mm`/`yyyy`, không phụ thuộc locale). Bản format dài "en-US" cũ (dùng cho đồng hồ realtime Admin) tách sang `formatDateLong(date: Date)`.
  - **Admin (giữ nguyên hiển thị)**: 9 modal (`AdminCalendar/FileManager/Notes/CreateUser/Support/Tasks/Messages/Report/Maintenance`) đổi import + gọi `formatDate` → `formatDateLong` để đồng hồ realtime không đổi look.
  - **Hotel Partner**: `BookingDetailModal`, `BookingsTab`, `StaffTab`, `PricingRulesTab` chuyển từ `formatDateShort` sang `formatDate`; `VerificationCenter` bỏ `new Date(...).toLocaleDateString()` → `formatDate(...)`.
  - **Manager**: `VerificationRequestsPage` bỏ `toLocaleDateString('vi-VN')` → `formatDate(...)`; `VerificationDetailModal` helper `fmtDate` giờ delegate về `formatDate` (giữ null cho giá trị rỗng để ẩn dòng). `formatDateShort` vẫn giữ cho các portal khác (staff/guest/account/admin).
  - `npx tsc -p tsconfig.app.json --noEmit`: sạch cho mọi file đụng tới; chỉ còn lỗi pre-existing (`User.name`, unused `React`, recharts formatter).

- [x] **Hotel Partner + Manager — đổi toàn bộ loading content từ spinner sang skeleton**:
  - **Bộ skeleton dùng chung** `components/shared/skeletons.tsx` (build trên shadcn `Skeleton`, màu neutral): `TableSkeleton` (header + rows khớp `DataTable`), `ToolbarSkeleton`, `DirectorySkeleton` (toolbar + table cho trang chọn KS), `CardGridSkeleton`, `ListSkeleton` (list dạng dòng), `DetailSkeleton` (header + N section).
  - **Hotel Partner**: thay `LoadingState`/spinner ở content-loading bằng skeleton đúng ngữ cảnh — tables `RoomsTab`/`RoomTypesTab`/`PricingRulesTab`/`BookingsTab`/`StaffTab`/`AmenitiesPage` → `TableSkeleton`; pages chọn KS `HotelsPage`/`RoomInventoryPage`/`BookingsPage`/`StaffManagementPage` → `DirectorySkeleton`; `HotelDetailPage` + `BookingDetailModal` + `VerificationCenter` → `DetailSkeleton`; `HotelAmenitiesModal` + `RoomTypeAmenitiesModal` → `ListSkeleton`. Mỗi file bỏ `LoadingState` khỏi import (giữ `ErrorState`/`EmptyState`).
  - **Manager**: `VerificationRequestsPage` (bảng) → `TableSkeleton` (border-0 vì nằm trong card có sẵn border); `VerificationDetailModal` → `DetailSkeleton`.
  - **Giữ nguyên spinner** ở nút submit mutation (`isPending` trên các FormModal) và dropzone `RoomTypeImagesModal` lúc upload — đây là feedback thao tác chủ động, skeleton không hợp. `LoadingState` gốc trong `hotel-partner/shared/states.tsx` vẫn giữ (portal khác còn dùng).
  - `npx tsc -p tsconfig.app.json --noEmit`: sạch cho mọi file mới/đụng tới; chỉ còn lỗi pre-existing không liên quan (unused `React`, recharts formatter).

- [x] **Hotel Verify — Address Search tự điền Full Address (prefill nguyên `s.display` khi ô đang trống)**:
  - `services/vietnam-geo.service.ts` giữ `parseVietmapDisplay` (province/ward). `BusinessInfoStep.handleAddressSelect` giờ prefill ô **Full Address** bằng toàn bộ địa điểm đã chọn (`s.display`) khi field còn trống, không đè lên thứ chủ KS tự gõ; vẫn auto-fill Tỉnh/TP + Phường/Xã + ghim bản đồ. Cập nhật hint label + placeholder cho rõ.

- [x] **Hotel Partner — bổ sung 9 API partner/owner còn thiếu ở FE (hồ sơ KS · ảnh KS · tiện nghi KS · xoá loại phòng/phòng · tạo tiện nghi)**:
  - **Bối cảnh**: rà soát swagger vs 5 service của client → 9 endpoint partner/owner chưa được FE gọi. Nhóm inbox hội thoại (S04) **bỏ** vì thuộc cổng staff. Backend contract khớp `server/src/validations/hotel.validation.ts` + `amenity.validation.ts`.
  - **Data layer (1 endpoint = 1 hook)**: types thêm ở `hotel.types.ts` (`UpdateHotelDto`, `HotelImageInput`, `AddHotelImagesDto`, `CreateAmenityDto`) và `hotel-management.types.ts` (`HotelAmenity`, `AmenityAssignment`, `SetHotelAmenitiesDto`); `queryKeys.hotels.amenities`; service `hotel.service` (`update`/`addImages`/`deleteImage`/`setPrimaryImage`/`getAmenities`/`setAmenities`), `hotel-management.service` (`deleteRoomType`/`deleteRoom`), `amenity.service` (`createAmenity`). Hooks: `hooks/hotels/{use-update-hotel,use-add-hotel-images,use-delete-hotel-image,use-set-primary-hotel-image,use-hotel-amenities,use-set-hotel-amenities}` + `hooks/hotel-management/{use-delete-room-type,use-delete-room,use-create-amenity}` (đều invalidate đúng key `hotels.managed`/`hotels.amenities`/`roomTypes`/`rooms`).
  - **Validation**: `hotel-management.validation.ts` thêm `hotelProfileFormSchema` (name/address/city/country required, district/ward optional, starRating & businessType chọn từ select, checkIn/out theo pattern HH:mm) và `amenityFormSchema`. Số/giờ giữ dạng string ở form, convert ở submit (đồng nhất cách xử lý zod v4 của dự án).
  - **UI (shadcn/ui + tailwind, tách component, mobile-first)**: `HotelProfileFormModal` (form sửa hồ sơ KS), `HotelImagesModal` (thêm ảnh theo category cover/exterior/room + đặt ảnh chính + **xoá ảnh có ConfirmDialog**, grid 2→3→4 cột), `HotelAmenitiesModal` (chọn tiện nghi + Free/Paid + nút **New amenity** mở `AmenityFormModal`) — dùng lại các modal đã có sẵn trong `components/hotel-partner/hotel-management/`. Tích hợp vào `HotelDetailPage`: nút **Edit profile** / **Photos** ở header + nút **Manage** ở mục Amenities (helper `Section` nhận `action`).
  - **Delete có ConfirmDialog**: `RoomTypesTab` + `RoomsTab` thêm action **Delete** (destructive) → `ConfirmDialog`; lỗi 400 của BE (còn phòng/booking, phòng đã từng đặt) hiển thị verbatim qua `errorMessage()`.
  - `npx tsc -p tsconfig.app.json --noEmit`: sạch cho toàn bộ file mới/đụng tới (chỉ còn các lỗi pre-existing không liên quan: unused `React`, `User.name`, recharts formatter, `NodeJS`).

- [x] **Hotel Partner — trang Amenities riêng + đồng bộ màu button + chuyển nút quản lý phòng**:
  - **Route quản lý Amenity riêng** (`/partner/amenities`): thêm `pages/hotel-partner/amenities/AmenitiesPage.tsx` — danh sách tiện nghi (bảng `DataTable`: tên + icon, category Pill màu theo loại, icon key) + lọc theo category (tabs All/Hotel/Room/Service, gọi `useAmenities(category)`) + tìm theo tên (client-side) + nút **New amenity** mở `AmenityFormModal`. Đăng ký route trong `partnerRoutes.tsx`, thêm mục **Amenities** (icon `Sparkles`) vào sidebar `HotelPartnerLayout`, hằng `ROUTES.partnerAmenities`. **Lưu ý**: BE chỉ có `GET`/`POST /amenities` (không có update/delete) nên trang chỉ **Create + List** đúng theo lựa chọn của user — chưa có sửa/xoá cho tới khi bổ sung endpoint.
  - **Đồng bộ màu button về config role-partner**: các nút hành động ở `HotelDetailPage` (Edit profile, Photos, Manage amenities, Manage room) và trang Amenities đều dùng `bg-role-partner-primary hover:bg-role-partner-secondary text-white` thay cho `variant="outline"`/default, để nhất quán màu thương hiệu partner (`--color-role-partner-primary`).
  - **Chuyển & đổi tên nút quản lý phòng**: bỏ nút "Manage Inventory" ở header `HotelDetailPage`, đưa xuống **phía dưới phần Room types** và đổi tên thành **"Manage room"** (vẫn disable + tooltip khi KS chưa active, deep-link `/partner/room-inventory?hotelId=`).
  - `npx tsc -p tsconfig.app.json --noEmit`: sạch cho mọi file mới/đụng tới; chỉ còn lỗi pre-existing không liên quan.

- [x] **Hotel Partner — bổ sung 9 API partner/owner còn thiếu ở FE (hồ sơ/ảnh/tiện nghi KS + xoá room-type/room + tạo amenity)**:
  - **Rà soát**: đối chiếu swagger với client, 9 endpoint partner/owner chưa được FE gọi: `PATCH /hotels/:id` (sửa hồ sơ), `POST/DELETE /hotels/:id/images[/:imageId]` + `PATCH .../images/:imageId/primary`, `GET/PUT /hotels/:id/amenities`, `DELETE /hotels/:id/room-types/:roomTypeId`, `DELETE /hotels/:id/rooms/:roomId`, `POST /amenities`. (Conversations là của staff nên bỏ qua.)
  - **Data layer** (`types/hotel.types.ts` + `types/hotel-management.types.ts`): thêm `UpdateHotelDto`, `HotelImageInput`/`AddHotelImagesDto`, `HotelAmenity`/`AmenityAssignment`/`SetHotelAmenitiesDto`, `CreateAmenityDto`, `BusinessType`. **Service**: `hotelService` thêm `update`/`addImages`/`deleteImage`/`setPrimaryImage`/`getAmenities`/`setAmenities`; `amenityService.createAmenity`; `hotelManagementService.deleteRoomType`/`deleteRoom`. Thêm `queryKeys.hotels.amenities`.
  - **Hooks** (1 endpoint = 1 file, đúng convention): `hooks/hotels/` thêm `use-update-hotel`, `use-add-hotel-images`, `use-delete-hotel-image`, `use-set-primary-hotel-image`, `use-hotel-amenities`, `use-set-hotel-amenities`; `hooks/hotel-management/` thêm `use-delete-room-type`, `use-delete-room`, `use-create-amenity`; cập nhật 2 barrel. Mọi mutation invalidate `hotels.managed`/`hotels.amenities`/`hotelManagementKeys` phù hợp.
  - **Validation** (`hotel-management.validation.ts`): `hotelProfileFormSchema` (name/address/city/country bắt buộc, description ≤5000, starRating/businessType tuỳ chọn, checkIn/out HH:mm 24h) + `amenityFormSchema` (name bắt buộc, category enum). Giữ chuẩn số-để-string như các form cũ.
  - **UI mới** dưới `components/hotel-partner/hotel-management/` (shadcn + `Modal`/`form-controls` dùng chung, mobile-first, tách nhỏ):
    - `HotelProfileFormModal` — form sửa hồ sơ (RHF + zod), grid 2 cột responsive, `''→null` để xoá field, `businessType` chỉ gửi khi chọn.
    - `HotelImagesModal` — quản lý ảnh: grid ảnh hiện có với set-primary/xoá (xoá qua `ConfirmDialog`), chọn category (cover/exterior/room) rồi upload nhiều ảnh, pick ảnh chính trong batch trước khi lưu.
    - `HotelAmenitiesModal` — chọn tiện nghi (hydrate từ `useHotelAmenities` kèm Free/Paid), tìm kiếm, nút **New amenity** mở `AmenityFormModal` (tạo xong tự chọn), Clear all.
    - `AmenityFormModal` — tạo tiện nghi mới vào catalog (name/category/icon).
  - **Wiring**: `HotelDetailPage` thêm nút **Edit profile** / **Photos** ở header + nút **Manage** ở khối Amenities, render 3 modal với `hotel={hotel}`; `Section` nhận thêm `action`. `RoomTypesTab` + `RoomsTab` thêm hành động **Delete** (menu ⋯, tone đỏ) qua `ConfirmDialog`, lỗi BE (vd phòng đã từng được đặt) hiện nguyên văn bằng `errorMessage()`.
  - `npx tsc -p tsconfig.app.json --noEmit`: các file mới/đụng tới đều sạch; chỉ còn các lỗi pre-existing không liên quan (unused `React`, `User.name`, `NodeJS`, recharts formatter).

- [x] **CommonNavbar — avatar giờ là dropdown (Profile + Back to Home)**:
  - `common/navbar/Navbar.tsx` (dùng chung admin/partner/staff portal) trước đây chỉ render avatar + tên tĩnh (ảnh hardcode). Đổi thành shadcn `DropdownMenu`: trigger là avatar + tên + `ChevronDown`, mở ra header thông tin người dùng (avatar/tên/email từ `useAuthStore`) và 2 mục **Profile** (`Link` → `ROUTES.accountProfile`) + **Back to Home** (`Link` → `ROUTES.home`).
  - Avatar lấy `avatarUrl` thật từ store (fallback initials từ `fullName || userName`); bỏ ảnh Twitter hardcode. Dùng `user.fullName` (không phải `user.name`) nên không dính lỗi type có sẵn ở guest navbar.
  - `tsc -p tsconfig.app.json --noEmit`: file `common/navbar/Navbar.tsx` sạch (4 lỗi `User.name` còn lại là pre-existing của `components/layout/Navbar.tsx`, không đụng tới).

### June 30, 2026

- [x] **Guest Hotel Detail — bản đồ luôn hiện kể cả khi DB chưa có toạ độ (geocode địa chỉ)**:
  - **Vấn đề**: `HotelDetailPage` đã render `<HotelMap>` nhưng bọc điều kiện `hotel.latitude && hotel.longitude`; seed hotel không có toạ độ → map không bao giờ hiện.
  - **Service**: thêm `geocodeAddress(text)` vào `services/vietnam-geo.service.ts` — tái dùng `autocompleteAddress` (lấy gợi ý đầu) và fallback `getPlaceDetail` theo `ref_id` để ra `{ lat, lng }` (qua proxy `/api/vietmap`, key `VITE_API_SEARCH_KEY`).
  - **Hook**: `hooks/geo/use-geocode.ts` (+ barrel) — `useGeocode(address, enabled)` cache `Infinity`; thêm `queryKeys.geo.geocode`.
  - **Page**: `HotelDetailPage` ưu tiên lat/lng từ DB, nếu thiếu thì geocode `formatAddress(...)` rồi render `HotelMap` với toạ độ đã suy ra (`mapLat/mapLng`). Map hiện khi có toạ độ từ một trong hai nguồn.
  - `tsc -p tsconfig.app.json --noEmit`: không phát sinh lỗi mới ở file đã đụng (tổng lỗi vẫn là các lỗi cũ không liên quan).
- [x] **Chatbot widget — hotel picker (giống mobile) + fix nặng "AI trả lời lại hiện theo kiểu chat của user"**:
  - **Bug nặng (AI hiện theo dạng chat của user)**: trong `floating-chat-widget-shadcnui.tsx`, hàm `updateStreamMessage` lúc stream **mutate biến ngoài `streamMessageAdded` ngay trong updater của `setMessages`**. React gọi updater **2 lần** (StrictMode/dev) → lần thứ hai thấy cờ đã `true` nên chạy nhánh `prev.map(... index === prev.length - 1 ...)`, ghi đè **tin nhắn cuối đang tồn tại (chính là bong bóng của user)** bằng text của AI → câu trả lời AI hiện trong bong bóng user. **Fix**: mỗi tin có `id` ổn định (`Message.id`), updater giờ **thuần** — tự quyết định append/update từ chính `prev` (`prev.some(m => m.id === aiId)`), không dùng cờ ngoài, nên gọi 2 lần vẫn đúng và không bao giờ đụng tin của user. `key` của message đổi sang `item.id`. Stream lỗi thì fallback sang endpoint non-stream **tái dùng đúng `aiId`** (không tạo bong bóng thừa).
  - **Hotel picker giống mobile**: thêm thanh chip chọn khách sạn (horizontal scroll, icon `Building2`) lấy từ `useSearchHotels({ limit: 50 })`. `activeHotelId` = hotel chọn từ chip → hotel trên URL (trang chi tiết) → hotel đầu tiên. Đổi khách sạn sẽ reset hội thoại + lời chào (như `clearChat` bên mobile); header phụ đề hiển thị **tên khách sạn đang chat**. Khi đã chọn được hotel, chat đi qua concierge thật của hotel đó (cần đăng nhập); không có hotel nào thì vẫn giữ fallback concierge tổng (`chatService.reply`).
  - `tsc -p tsconfig.app.json --noEmit` sạch cho file đã sửa (chỉ còn 23 lỗi pre-existing không liên quan: unused `React`, `User.name`, `NodeJS`).

### June 24, 2026

- [x] **Admin users/properties polish + single Sonner toast system**:
  - **Fixed admin dashboard shortcut logout bug**: `AdminLayout.closeAllModals()` no longer calls the logout mutation, so dashboard app shortcuts / quick actions open their modals instead of logging the admin out. Added explicit `type="button"` to dashboard quick-action buttons.
  - **Admin Properties actions**: changed row actions from inline `List/Unlist` and `Enable/Disable` buttons into a compact shadcn `DropdownMenu` action trigger. Removed the `Add Property` header button because admins should not create hotels directly.
  - **Admin Users add modal**: the existing Create User modal is now a real controlled form calling `useCreateAdminUser()` / `POST /users` with name, email, temporary password, and role. Success/error feedback uses Sonner toasts and the admin users query is invalidated by the existing hook.
  - **Admin Users filters**: wired the header `Filters` button to a filter panel for name, role, and status. The selected values now feed `useAdminUsers({ name, role, status, sortBy, limit })`, and a Reset action clears active filters. `AdminUsersParams` now includes `status`.
  - **Toast consolidation**: removed the duplicate `react-hot-toast` root toaster from `main.tsx`, switched auth login/register hooks to `sonner`, and uninstalled `react-hot-toast` from `package.json` / `package-lock.json`. The app now uses only the shadcn Sonner wrapper mounted in `App.tsx`.
  - Verification note: `npm run build` still fails only on pre-existing unrelated TypeScript issues (`React` unused imports, `User.name`, `NodeJS` namespace, Recharts formatter); no new errors were reported from the changed admin/toast files.

### June 23, 2026

- [x] **Narrower hotel-partner tables + verify-form uploads now visible & persistent on reload (removed "Submitted Files")**:
  - **Tables too wide → horizontal scroll**: the `HOTEL` column had an unbounded name+address cell, so auto table-layout blew the column (and the whole table) past the viewport. Capped the cell (`max-w-45 sm:max-w-55 lg:max-w-70`, truncation already present) in `HotelsTable` and trimmed each table's `minWidthClass` (Hotels 720→600, Bookings 760→680, Pricing 760→680, Room Types 720→640) so they fit without sideways scrolling.
  - **Reverted the partner "Submitted Files" card** added earlier to `VerificationCenter` (per request) — removed the component, its render, and the now-unused `FilePreviewModal`/`ImageIcon` imports. (The manager-side lightbox + Cloudinary PDF fix stay.)
  - **Real ask — verify-form uploads disappeared on reload**: `FileUploadDropzone` only tracked freshly-picked `File[]` in local state, so after a reload the persisted draft still held the uploaded **URLs** but the dropzone rendered empty → looked like the files were lost. Added `existingUrls?: string[]` + `onRemoveExisting?` to `FileUploadDropzone`: it now renders thumbnails of already-uploaded files (PDFs via the Cloudinary first-page JPG preview), counts them toward `minFiles`, and offers per-file removal.
  - **Wired every upload step** to feed `existingUrls` from the persisted value and to **persist to the draft store immediately on upload** (not only on Continue/Back), so a reload at any point keeps the files: `PropertyDetailsStep` (license), `RepresentativeVerificationStep` (front/back ID), `AccommodationCertificateStep` (4 docs — `useUploadZone` gained a `persist` callback + `remove`), and `PropertyImagesStep` (cover/exterior/room — uploads now **append** and persist via a shared `commitImages`, replacing the old count-only banners with real thumbnails). Each dropzone is `key`-remounted on URL change so the transient `File[]` preview clears and only the persisted thumbnail remains (no duplicates).
  - `tsc -p tsconfig.app.json --noEmit` clean for all touched files (same 32 pre-existing unrelated errors).

- [x] **Fixed 4 reported bugs (partner dead routes / table overflow / mojibake / duplicated address)**:
  - **Bug 1 — sidebar links 404 + lost layout**: `routes/partnerRoutes.tsx` declared no routes for `revenue / analytics / reviews / settings`, so those sidebar links fell through to the guest catch-all `*` → `NotFoundPage` rendered **outside** `HotelPartnerLayout` (sidebar gone). Added placeholder routes pointing at a new `pages/ComingSoonPage.tsx` (titled per feature) plus a `{ path: '*', element: <NotFoundPage /> }` **inside** the PartnerLayout branch so a mistyped `/partner/*` URL keeps the sidebar.
  - **Bug 2 — hotel tables overflow the whole page (Bookings/Hotels/Room Inventory/Staff)**: classic flexbox `min-width: auto` — the `SidebarInset` (`<main>`, the row flex item) and the per-layout content `<main className="flex-1 …">` wouldn't shrink below their content, so a `min-w-[720px]` table widened the entire layout and defeated the table's own `overflow-x-auto`. Added `min-w-0` to `SidebarInset` (`components/ui/sidebar.tsx` — fixes every portal at once) and to the `<main>` of all three layouts (partner/manager/admin). Now only the table scrolls; header/filters/sidebar stay put.
  - **Bug 3 — `â€¢` mojibake in dashboard Recent Activities**: a double-encoded bullet (`U+00E2 U+20AC U+00A2` = UTF-8 bytes of `•` re-read as Windows-1252) was a literal in `RecentActivities.tsx`. Replaced with a clean `{'•'}` JSX literal.
  - **Bug 4 — duplicated hotel address** ("…, Phường 10, …, Tỉnh Lâm Đồng, **Phường 10, Tỉnh Lâm Đồng**, Vietnam"): the DB `address` already contains ward/city/province, but `HotelDetailPage` re-appended `district`/`city`/`country`. Added `utils/formatAddress.ts` — joins parts, drops empties, and skips any segment already contained in (or equal to, case-insensitively) an earlier one — and used it in the guest `HotelDetailPage` header.
  - `tsc -p tsconfig.app.json --noEmit` clean for all new/touched files (same 32 pre-existing unrelated errors remain — unused `React`, `User.name`, recharts formatter, `NodeJS`).

- [x] **Hotel Partner — wire `PATCH /hotels/:id/publish` (partner self-publish / unpublish)**:
  - **Types** `types/hotel.types.ts`: added `SetHotelListingRequest` (`{ isListed }`) and the raw `Hotel` response interface (full hotel shape returned by the endpoint).
  - **Service** `services/hotel.service.ts`: `hotelService.setListing(hotelId, isListed)` → `PATCH /hotels/:id/publish`, returns the updated `Hotel`.
  - **Hook** `hooks/hotels/use-set-hotel-listing.ts` (one-endpoint-per-file): `useSetHotelListing` mutation invalidating `queryKeys.hotels.mine` + `queryKeys.hotels.managed(hotelId)`; exported from the `hooks/hotels` barrel.
  - **UI** `components/hotel-partner/hotel-management/PublishToggle.tsx`: a switch in the Hotels table Status column. Enabling is blocked client-side when `!isActive` (with a `title` hint + toast, mirroring the BE rule "Khách sạn chưa được duyệt nên chưa thể mở bán"); disabling always allowed. Success/error feed `sonner` toasts via `errorMessage()` so the BE 400 reasons ("Cần có ít nhất một loại phòng đang bật…") surface verbatim.
  - **Wiring**: `HotelsTable` gained `showPublishToggle?` (renders `PublishToggle` instead of the static Listed/Unlisted pill); threaded through `HotelDirectory` and enabled only on `HotelsPage` (`/partner/hotel-management`) — the Room Inventory hotel-picker keeps the static pill. `tsc -p tsconfig.app.json --noEmit` clean for all new/touched files (only the same pre-existing unrelated errors remain).

- [x] **Fix shared search/filter (`AppFilter`) UI + reliable in-app viewing of verify documents/images (Cloudinary PDF fix)**:
  - **`common/filter/AppFilter.tsx` (used by Hotels directory, Staff, Room Inventory, Bookings)**: the search magnifier was pinned at `top-3` inside an `h-8` (32px) `Input`, so it sat ~4px below center; changed to `top-1/2 -translate-y-1/2` (+ `pointer-events-none`, `left-2.5`, `pl-8.5`) for true vertical centering. Made the input safely controlled (`value={search ?? ''}`) to avoid the controlled/uncontrolled warning, let the search box grow (`flex-1`), and removed the Reset icon's stray `mr-2` (the button already supplies `gap`).
  - **Root cause of "manager ấn View → link Cloudinary không xem được"**: backend uploads with `resource_type: 'auto'`, so PDFs land as Cloudinary `image` resources at `/image/upload/.../x.pdf`, and Cloudinary **blocks raw PDF/ZIP delivery by default** (401 "restricted access"). The old "View" was a plain `<a href={fileUrl}>` to that blocked URL.
  - **`utils/cloudinary.ts` (new)**: `isPdfUrl`, `isCloudinaryUrl`, `cloudinaryPdfPreview` (rasterizes a Cloudinary PDF's first page to a deliverable JPG via the `pg_1,f_jpg,q_auto` transformation — a derived image is **not** subject to the PDF-delivery block, so it renders even with the restriction on), and `cloudinaryDownloadUrl` (`fl_attachment`).
  - **`components/shared/FilePreviewModal.tsx` (new)**: an in-app lightbox (Esc / backdrop / X to close, `z-60` above the `z-50` detail modal) that previews images inline and PDFs via the rasterized first-page JPG, always with "Open original ↗" + "Download" and a graceful "Preview unavailable" fallback on image error.
  - **`components/manager/VerificationDetailModal.tsx`**: lifted a `preview` state to the modal root and render one `FilePreviewModal`; documents now open in the lightbox (button, not an `<a>` to the blocked URL), and property images + representative ID images open there too. Removed the now-unused `ExternalLink` import.
  - **`components/hotel-partner/hotel-verify/VerificationCenter.tsx`**: added a **Submitted Files** card on the partner's application status view (current-version documents with status pills → View, plus cover/exterior/room image thumbnails → lightbox). Data comes from the BE application, so it stays intact across reloads.
  - `tsc -p tsconfig.app.json --noEmit` clean for every touched/new file; only the pre-existing unrelated errors remain (unused `React` imports, `User.name`, recharts formatter, `NodeJS` namespace).
  - ⚠️ To also view/download the **original multi-page PDF** (not just the rasterized first page), enable **Settings → Security → "Allow delivery of PDF and ZIP files"** in the Cloudinary console — it's an account setting, not code.

### June 22, 2026 (continued 2)

- [x] **Hotel Partner — Bookings management UI + data-layer alignment to the owner Booking API spec**:
  - **Data layer (reused the hotel-scoped staff layer, no duplication)**: aligned `types/staff.types.ts` to the spec — added `PaymentMethod` (`vnpay|sepay|stripe|cash`, with `StaffPaymentMethod` kept as a deprecated alias), `BookingSource`, a full `Invoice` interface, and `CheckOutResponse` (StaffBooking + invoice). Added `voucher: { voucherCode; usedAt } | null` to the list shape `HotelBooking` (it now matches the spec's `StaffBooking`), made assigned-room `floor` nullable, added optional `bookingId` on `BookingRoomLink`, broadened payment method + detail `invoice` to the full `Invoice`, and tightened `source` to `BookingSource`. `staff.service.checkOut` now returns `CheckOutResponse`. All additive/compatible — the existing staff front-desk pages still compile unchanged.
  - **Validation** `validations/hotel-booking.validation.ts`: `checkInFormSchema` (optional roomId, voucherCode ≤50) and `checkOutFormSchema` (extraCharge numeric ≥0, string-based to play nicely with the RHF resolver).
  - **Page** `pages/hotel-partner/bookings/BookingsPage.tsx`: same hotel-picker pattern as Staff/Room Inventory — `HotelDirectory` (active hotels) → workspace with `HotelSwitcher` + back, hotel persisted in `?hotelId=`.
  - **Components** under `components/hotel-partner/bookings/`: `BookingsTab` (shared `DataTable`: code/guest, room type, dates, total, status Pill; server-side status filter + `createdAt:desc` sort + `AppPagination`; client-side search; row/Action → detail), `BookingDetailModal` (full detail — stay, customer, voucher, payments + invoice — plus front-desk actions gated by status/check-in window: check-in, check-out, collect cash, no-show), `CheckInModal` + `CheckOutModal` (RHF + `zodResolver` form modals; check-in offers room assignment via `useHotelRooms` filtered to available rooms of the booking's type, or auto-assign), and `labels.ts` (`BOOKING_STATUS_CONFIG`/`OPTIONS`, `PAYMENT_STATUS_CONFIG`, `PAYMENT_METHOD_LABELS`). Cash/no-show go through the shared `ConfirmDialog`; all actions feed `sonner` toasts via `errorMessage()` so BE messages surface.
  - **Wiring**: registered `/partner/bookings` in `partnerRoutes.tsx` (the sidebar "Bookings" item already existed) and added `ROUTES.partnerBookings`. Actions reuse the existing `useCheckIn`/`useCheckOut`/`useRecordCashPayment`/`useMarkNoShow`/`useHotelBooking`/`useHotelBookings`/`useHotelRooms` hooks.
  - `tsc -p tsconfig.app.json --noEmit` clean for all new/touched files; only the pre-existing unrelated errors remain (`User.name`, unused `React`, recharts formatter, `NodeJS` namespace).

### June 22, 2026 (continued)

- [x] **Hotel Partner — Staff management UI (built on the group-1 data layer)**:
  - **New route + nav**: `/partner/staff` registered in `routes/partnerRoutes.tsx`, added a "Staff" item (Users icon) to the partner sidebar in `HotelPartnerLayout.tsx`, and a `ROUTES.partnerStaff` constant.
  - **Page** `pages/hotel-partner/staff/StaffManagementPage.tsx`: mirrors `RoomInventoryPage` — picks a hotel via the shared `HotelDirectory` (filtered to `isActive` hotels), persists the choice in the query string (`?hotelId=...`), and uses `HotelSwitcher` + a back button in the workspace view. Loading / error / empty states reuse `shared/states`.
  - **Components** under `components/hotel-partner/staff/`: `StaffTab` (list table via shared `DataTable` with name+email, phone, role Pill, account-status Pill, assigned date; client-side search + role filter via `AppFilter`; `ActionMenu` → destructive Remove behind `ConfirmDialog`), `StaffFormModal` (create+assign form via `Modal` + RHF + `zodResolver`), and `labels.ts` (`STAFF_ROLE_CONFIG`/`STAFF_ROLE_OPTIONS`/`USER_STATUS_CONFIG`).
  - **Validation** `validations/hotel-staff.validation.ts`: `addStaffFormSchema` (name, email, password ≥8 chars with a letter + a number to match the BE custom password rule, optional phone, `assignedRole` enum). Phone submitted as `null` when blank.
  - **Wiring**: form/remove call `useAddHotelStaff` / `useRemoveHotelStaff`; success/error feedback via `sonner` toasts using the shared `errorMessage()` helper so BE messages (e.g. "Email already taken") surface. There is intentionally **no edit** flow — the spec exposes no staff-update endpoint.
  - **Shared tweak**: extended the shared `TextField` (`shared/form-controls.tsx`) type union with `email | password | tel` so the form can render a masked password + typed email/phone inputs.
  - `tsc -p tsconfig.app.json --noEmit` clean for all new/touched files (the only remaining errors — `User.name` in the unrelated `components/staff/StaffLayout.tsx`, plus the pre-existing `React`/recharts/`NodeJS` ones — were already there).

- [x] **Hotel Partner — Staff management data layer (group 1 of the Partner-Hotel API spec, data layer only)**:
  - **Spec triage**: of the 16 endpoints in the "Partner-Hotel còn thiếu ở FE" spec, only **Staff management (group 1)** was actually missing — bookings (group 2), housekeeping (group 3) and quick room-status (group 5) were already wired in `services/staff.service.ts` + `hooks/staff/*`; Conversations/Inbox (group 4) was de-scoped for now.
  - Added the data layer following the one-endpoint-per-file convention (no UI): `types/hotel-staff.types.ts` (`StaffRole`, `UserStatus`, `StaffUser`, `StaffAssignment`, `StaffAssignmentScalar`, `SanitizedUser`, `AddStaffDto`, `AddStaffResponse`; reuses `UserRole` from `@/constants/roles`), `services/hotel-staff.service.ts` (`list`/`add`/`remove` → `GET`/`POST`/`DELETE /hotels/:hotelId/staff[/:userId]`, `getManagedHotel` perm), and the `hooks/hotel-staff/` domain: `keys.ts`, `use-hotel-staff` (query), `use-add-hotel-staff` + `use-remove-hotel-staff` (mutations invalidating the list), barrel `index.ts`.
  - `tsc -p tsconfig.app.json --noEmit` clean for all new files (pre-existing repo errors — unused `React` imports, `User.name`, recharts formatter, `NodeJS` namespace — are unrelated and untouched).

### June 19, 2026

- [x] **Hotel Partner — Split "Hotels" from "Room Inventory", convert management UI from cards → tables**:
  - **Backend review**: confirmed the hotel-management API surface is complete and unchanged — partner hotels come from `GET /hotels/mine` (partner resolved from the access token, **no** `:userId` param), full detail from `GET /hotels/:id/manage`; room types (`…/room-types/manage`, `POST`, `PUT`, `…/images`, `…/amenities`), rooms (`…/rooms` paginated + `POST`/`PUT`/`PATCH …/status`), pricing rules (`…/pricing-rules` CRUD), amenities (`GET /amenities`). No new endpoints needed.
  - **Fixed broken WIP data layer** (branch didn't compile): `usePartnerHotels` called a non-existent `hotelService.getByPartner(userId)` against the wrong path with an undefined `queryKeys.hotels.byPartner`, an undefined `PartnerHotel` type, and the hook wasn't even exported from the `hooks/hotels` barrel. Added `PartnerHotel` to `types/hotel.types.ts` (hotel fields + primary image + `_count{roomTypes,rooms}`), `hotelService.getMine()` → `GET /hotels/mine`, `queryKeys.hotels.mine`, rewrote `usePartnerHotels()` (no args, token-based) and exported it from the barrel.
  - **Separated into two routed features** (both were missing from `partnerRoutes.tsx`): `/partner/hotel-management` → **HotelsPage** (property overview only) and `/partner/room-inventory` → **RoomInventoryPage** (room types / rooms / pricing for one hotel). Hotel + active tab live in the query string (`?hotelId=…&tab=…`) so refresh/share keeps state; "Manage inventory" on a hotel row deep-links into Room Inventory. Removed the old combined `HotelManagementPage`.
  - **Cards → tables** (senior call: this is an internal ops surface — tables win on density, scannability and consistency with Staff/Admin; cards stay for guest-facing browsing). Added shared primitives `shared/DataTable.tsx` (generic `Column<T>[]`), `shared/TablePagination.tsx`, `shared/Pill.tsx`, and a `formatAdjustment()` helper in `shared/labels.ts`. Rebuilt `HotelsTable`, `RoomTypesTab`, `PricingRulesTab` as tables and refactored the already-tabular `RoomsTab` onto the same primitives. Deleted `PartnerHotelCard`, `RoomTypeCard`, `PricingRuleCard`.
  - **DRY**: extracted `HotelDirectory` (search + listing filter + table) shared by HotelsPage and the Room Inventory hotel-picker; `InventoryTabs` owns the tab bar + a URL-safe `isInventoryTab` guard.
  - `tsc -p tsconfig.app.json --noEmit` clean for all touched files (pre-existing repo errors — unused `React` imports under `noUnusedLocals` and a recharts formatter type in `manager/revenue` — are unrelated and untouched).

### June 16, 2026 (continued)

- [x] **Hotel Verify — "Review & Fix" now prefills the wizard with the existing application**:
  - **Bug**: clicking "Review & Fix" navigated to `?applicationId=…&step=1`; `VerifyHotelPage` fetched the application by id but never fed it into the wizard, so each step's RHF `defaultValues` (read from the Zustand `hotel-verify-draft`) showed an empty/stale form instead of the submitted data.
  - **Fix**: added `mapApplicationToDraft(app)` + a `hydrateFromApplication` action to `stores/hotel-verify.store.ts` that maps the detail response (`hotel` + `documents[]` + `licenses[]` + `representatives[]` + `payoutAccounts[]`) back into the six step form-value shapes (cover/exterior/room images grouped by `imageCategory`, `roomConfig.types`, license metadata + current non-replaced document URLs per type, ISO dates sliced to `YYYY-MM-DD`). `VerifyHotelPage` calls it once per `applicationId` (ref-guarded) inside an effect and gates the wizard behind a `hydrated` flag so the prefill lands **before** the step forms mount.
  - **Known limitation**: the bank **account number** is encrypted server-side and never returned, so it is left blank and must be re-entered when editing the Payment step.

- [x] **Sonner toast notifications + logout feedback**:
  - Installed `sonner`; added a shared `components/ui/sonner.tsx` Toaster wrapper (`position="top-right"`, `richColors`, `closeButton`) and mounted `<Toaster />` once at the App root (inside `TooltipProvider`, outside the route tree) so toasts persist across route changes.
  - `useLogout` now fires `toast.success('Đăng xuất thành công')` on success and `toast.error(...)` on failure (the local session is still cleared + redirected to `/login` via `onSettled` either way). This is the project's first toast wiring — reuse the `toast` API from `sonner` for future mutations.
- [x] **Sidebar Logout wired to the logout API across all portals**:
  - The shared `CommonSidebar` already rendered a Logout button calling its `onLogout` prop, but the portal layouts never wired it to the real `POST /auth/logout` flow: `ManagerLayout`/`HotelPartnerLayout` passed no `onLogout` (button was a no-op) and `AdminLayout` passed `closeAllModals` (only closed modals).
  - Wired the existing `useLogout()` hook (`hooks/auth/use-logout.ts` → `authService.logout(refreshToken)` then `clearAuth()` + redirect to `/login`) into all three layouts. `ManagerLayout` and `HotelPartnerLayout` now pass `onLogout={() => logout()}`; `AdminLayout` passes a `handleLogout` that closes any open modals first, then logs out.

### June 21, 2026

- [x] **Front desk: newest-first sort + "Confirmed" filter tile (FE, client-only)**:
  - `FrontDeskPage` now sorts the booking list by `createdAt` descending so the newest bookings appear at the top (previously sorted by check-in date ascending).
  - Added a 5th filter tile **"Confirmed"** (`CalendarCheck` icon, indigo tone) that lists every `status === 'confirmed'` booking — including upcoming arrivals not yet inside the check-in window. The existing "To check in" tile still shows only same-day actionable arrivals (`confirmed && check-in ≤ today < check-out`).
  - Widened the tile grid to `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` and added an `indigo` entry to `TILE_TONES`. `tsc --noEmit` clean (only pre-existing `baseUrl` deprecation warning).

### June 20, 2026

- [x] **Admin portal connected to existing backend admin APIs — client-only**:
  - Read server admin-capable routes: `/users` (`getUsers`/`manageUsers`), `/hotel-partners/registrations` (`manageHotelVerifications`), and hotel-scoped bookings via `/hotels/:hotelId/bookings` (`manageBookings`).
  - Added `services/admin.service.ts` plus `types/admin.types.ts` API DTOs for users, hotel verification requests, review payloads, and admin booking rows.
  - Added `hooks/admin/*` following one-endpoint-per-file convention: users list/create/update/delete, verification list/review, and admin booking overview.
  - Replaced mock data in Admin Users, Properties, and Bookings pages with backend fetches, including loading/error states.
  - Properties now shows hotel verification requests from the platform review queue; bookings build an overview from available hotels and their hotel-scoped booking lists.
- [x] **Guest chatbot widget connected to backend hotel concierge API — client-only**:
  - Added the 21st.dev shadcn floating chat widget dependency/component and adapted it for SmartStay guest pages instead of the registry demo agents.
  - Kept the widget mounted only in the guest/customer `Layout`; admin, partner, and staff portals use separate layouts and do not render it.
  - Read the backend conversation contract and connected authenticated hotel-detail chats to `POST /conversations/messages` with `{ hotelId, conversationId?, message }`, storing `conversationId` for follow-up turns.
  - Connected the streaming endpoint `POST /conversations/messages/stream` by parsing SSE `meta`, `chunk`, and `done` events from a POST `fetch`; hotel chat now renders bot text incrementally and falls back to `/messages` if the stream cannot open.
  - Added `types/chat.types.ts` DTO/response types, `chatService.sendHotelMessage`, and `hooks/chat/use-send-chat-message.ts` + barrel to follow the one-endpoint-per-hook convention.
  - Added `validations/chat.validation.ts` and wired the widget input through `react-hook-form` + `zodResolver`; messages are trimmed, required, and limited to 2000 characters to match backend validation.
  - Preserved the existing client-side fallback concierge for generic guest pages without a concrete `hotelId`.

### June 19, 2026

- [x] **Staff only sees hotels they're assigned to (no free hotel switching) — client-only**:
  - Constraint: no server changes allowed. The BE has no endpoint that lists a staff member's assigned hotels, so `staffService.listMyHotels` now **discovers them client-side**: list public `GET /hotels`, then probe each `GET /hotels/:id/bookings?limit=1` (guarded by `getOperableHotel`) and keep only the hotels that don't return 403.
  - The probes pass a `skipAuthRetry` config (`{ _retry: true }`) so the expected 403s **skip the shared axios refresh-token interceptor** in `lib/api.ts` (which otherwise escalates 401/403 into a token refresh and can log the user out / thrash `refresh-tokens`).
  - `SelectHotelPage`: lists only operable hotels; **auto-selects when there's exactly one**; clear empty state when the staff member isn't assigned to any hotel; removed the free-text search.
  - `RequireStaffHotel` (guard): validates the persisted hotel against the operable list, **auto-picks the single assignment**, drops a stale/unassigned selection, and **holds rendering until a valid hotel is in the store** — so the operational pages never fire a 403 (fixes the leftover Đà Nẵng selection that was 403-ing).
  - `StaffLayout`: the **"Change" button only shows when the staff member has >1 operable hotel**.
  - `tsc` clean (client). Server folder untouched.

- [x] **Localize Staff Portal UI to English**:
  - Translated all Vietnamese user-facing text in the staff portal to English: pages (`StaffDashboardPage`, `FrontDeskPage`, `BookingDetailPage`, `HousekeepingPage`, `RoomsPage`, `SelectHotelPage`), layout/components (`StaffLayout` nav + topbar, `StatusBadge` booking/room/task/payment labels, `RequireStaffHotel`), and all toast/feedback/error strings.
  - Also translated the in-code comments across `hooks/staff/*`, `routes/staffRoutes.tsx`, `stores/staffHotelStore.ts`, `types/staff.types.ts`, and `services/staff.service.ts` so the whole staff module reads in English.
  - No behavior changes — labels/copy only. `tsc -b` clean (only pre-existing `baseUrl` deprecation warnings).

### June 18, 2026

- [x] **Làm lại UI/UX quầy lễ tân + nối nốt API/param còn thiếu (FE)**:
  - Rà soát route + service BE: **toàn bộ endpoint staff-operable đã được call**. Phần thiếu là _param_ chưa dùng → nối nốt: `check-in` giờ gửi được `roomId` (chọn phòng bàn giao) ngoài `voucherCode`.
  - `BookingDetailPage`: thêm dropdown **"Gán phòng"** lấy từ `useHotelRooms` (lọc phòng `available` đúng `roomTypeId`; rỗng = để BE tự gán); cảnh báo trước cửa sổ check-in (`checkInDate > hôm nay` → disable nút + báo rõ), cảnh báo quá kỳ lưu trú; thêm card Voucher (mã + đã/chưa dùng); gộp layout 2 cột rõ ràng.
  - `FrontDeskPage`: bỏ bảng phẳng + dải status chip, đổi sang **4 ô lọc theo việc cần làm** (Cần check-in / Trả phòng hôm nay / Đang lưu trú / Chờ thanh toán) có đếm số, + nút "Xem tất cả". Mỗi dòng có **nút thao tác nhanh inline** (Check-in tự gán phòng / Check-out) + banner feedback dùng `errorMessage` (hiện message thật từ BE). "Cần check-in" = `confirmed && ngày nhận ≤ hôm nay < ngày trả`.
  - Thêm helper dùng chung `toUtcDateKey` / `todayUtcKey` trong `utils/formatDate.ts` (so ngày theo UTC, khớp `toUtcDate` của BE). `npx tsc --noEmit` sạch.
  - Cũng sửa bug interceptor `lib/api.ts`: `return Promise.reject(error)` bị kẹt trong nhánh `if (401||403)` khiến lỗi 400 fall-through → axios resolve `undefined` → `const {data}=undefined` ném lỗi không có `.response` → UI luôn hiện fallback. Đã đưa reject ra ngoài; gộp điều kiện `_retry`.

- [x] **Cổng nhân viên (Staff Portal) — lễ tân + housekeeping + bản đồ phòng (FE, không sửa BE)**:
  - Đọc Swagger + route BE (`feat staff`): toàn bộ API staff nằm dưới `/hotels/:hotelId/...` và backend tự kiểm quyền qua `getOperableHotel` (chủ KS / manageBookings / staff được phân công). Nối đúng hợp đồng: `GET /hotels/:id/bookings` (lọc `status/fromDate/toDate/page/limit`, trả `{results,...}` kèm `customer`+`roomType`), `GET .../bookings/:bookingId`, `POST .../check-in` (`{roomId?,voucherCode?}`), `POST .../check-out` (`{extraCharge?}`), `POST .../record-cash-payment`, `POST .../no-show`, `GET .../housekeeping?status=`, `POST .../housekeeping/:taskId/complete`, `GET .../rooms`, `PATCH .../rooms/:roomId/status`.
  - Tầng dữ liệu theo chuẩn dự án: `types/staff.types.ts`, `services/staff.service.ts`, `hooks/staff/*` (mỗi API một file + `keys.ts` + barrel `index.ts`: `use-hotel-bookings`, `use-hotel-booking`, `use-check-in`, `use-check-out`, `use-record-cash-payment`, `use-mark-no-show`, `use-housekeeping-tasks`, `use-complete-housekeeping`, `use-hotel-rooms`, `use-update-room-status`, `use-staff-hotels`).
  - Vì BE **không có** endpoint trả khách sạn được phân công cho staff (login chỉ trả `user`), thêm `stores/staffHotelStore.ts` (persist) + màn `SelectHotelPage` (chọn nơi trực từ `GET /hotels`) + guard `RequireStaffHotel`. Chọn nhầm KS không được phân công → BE trả 403 và UI báo rõ.
  - Giao diện: `components/staff/StaffLayout.tsx` (sidebar + topbar hiển thị KS đang trực + nút "Đổi" + đăng xuất), `StatusBadge` (booking/room/task/payment), các trang `StaffDashboardPage` (đếm khách đến/đi/đang ở/chờ thanh toán hôm nay), `FrontDeskPage` (bảng booking + lọc trạng thái + tìm kiếm), `BookingDetailPage` (check-in/out, thu tiền mặt, no-show + feedback), `HousekeepingPage` (1-tap hoàn thành), `RoomsPage` (đổi nhanh trạng thái theo tầng).
  - Định tuyến: `routes/staffRoutes.tsx` (`/staff`, guard `ProtectedRoute allowedRoles={[STAFF]}`), đăng ký trong `routes/index.ts`; thêm hằng `ROUTES.staff*` và đặt landing role STAFF → `/staff/dashboard`. Thêm util chung `utils/errorMessage.ts`.
  - Tạo tài khoản nhân viên demo qua API có sẵn (`POST /hotels/:id/staff` với token partner): `staff@gmail.com` / `Manh2432004`, gán vào "SmartStay Hà Nội Old Quarter".
  - ⚠️ Ghi nhận bug BE (chưa sửa theo yêu cầu): `GET /hotels/:id/housekeeping` trả 500 `prisma.housekeepingTask` undefined — Prisma Client chưa generate lại sau khi thêm model housekeeping. UI đã xử lý lỗi này mềm mại (banner cảnh báo).

### June 17, 2026

- [x] **Làm rõ hiển thị số phòng trống trên RoomTypeCard**:
  - Trước: "X rooms left" là chữ xám nhỏ gộp chung dòng số đêm, dễ bỏ sót.
  - Giờ: tách thành **badge pill nổi bật** (có icon `BedDouble`) ngay dưới thông số phòng. Bình thường (`> 3` phòng) dùng tông vàng `tertiary` ("X rooms available"); sắp hết (`≤ 3` phòng) dùng tông đỏ `error` ("Only X rooms left!") tạo cảm giác cần đặt sớm. Tránh dùng màu `primary` (taupe). Dòng giá chỉ còn số đêm cho gọn.

- [x] **HotelDetailPage tự điền ngày mặc định để hiện số phòng trống ngay**:
  - BE `getRoomTypes` chỉ trả `availableRooms`/`totalPrice`/`numNights` khi có cả `checkIn`+`checkOut`; mở trang chi tiết không kèm ngày (vd bấm từ HotelCard chưa chọn ngày) thì room-types không có số phòng.
  - Thêm `useEffect` trong `HotelDetailPage`: nếu URL thiếu `checkIn`/`checkOut` → set mặc định hôm nay → mai (và `guests` nếu thiếu) vào URL bằng `setParams(..., { replace: true })`. Nhờ ghi vào URL nên DateRangePicker, `useRoomTypes` và bước đặt phòng (`handleSelectRoom`) đều dùng chung ngày hợp lệ; link cũng shareable. Có guard `if (checkIn && checkOut) return` để không đè ngày khách đã chọn từ trang search.

- [x] **Nối thanh toán VNPay vào luồng đặt phòng (FE, không sửa BE)**:
  - Đọc kỹ hợp đồng BE: `POST /payments/bookings/:bookingId/vnpay` (auth, chủ booking, booking phải `pending` & chưa hết hạn giữ chỗ) → trả `{ paymentUrl }`; sau khi khách trả tiền, VNPay redirect về BE rồi BE chuyển khách sang `${CLIENT_URL}/booking/payment-result?status=success|failed&bookingCode=...`.
  - Tạo tầng dữ liệu thanh toán theo đúng chuẩn `hooks/` của dự án: `types/payment.types.ts` (`CreateVnpayPaymentResponse`, `PaymentResultStatus`), `services/payment.service.ts` (`createVnpay`), `hooks/payments/use-create-vnpay-payment.ts` + barrel `index.ts`.
  - Thêm route + trang kết quả: `ROUTES.paymentResult` = `/booking/payment-result`, đăng ký trong `guestRoutes.tsx`, trang `pages/guest/PaymentResultPage.tsx` (đọc `status`/`bookingCode` trên query, hiện thành công/thất bại, invalidate `bookings` khi thành công).
  - Nối `BookingCheckoutPage`: bước Confirm nay **tạo booking pending một lần** (giữ id để bấm lại không tạo trùng) → gọi `useCreateVnpayPayment` → `window.location.href = paymentUrl`. Thêm helper `errorMessage()` (không dùng `any`) để hiện lỗi từ BE; nút đổi nhãn `Confirm & Pay` / `Redirecting to VNPay…` / `Retry payment`; xử lý 503 khi VNPay chưa cấu hình (giữ khách ở trang, báo lỗi rõ ràng).
  - Verify với BE đang chạy (seed): tạo booking `BKMQI8WO17C4B983` OK; `POST .../vnpay` trả đúng 503 "VNPay chưa được cấu hình" (do `.env` thiếu `VNP_TMN_CODE`/`VNP_HASH_SECRET`) — FE bắt và hiển thị message này. Để chạy redirect thật chỉ cần thêm 2 biến VNPay vào `server/.env` (không đụng code).
  - Ràng buộc tồn kho ("đặt hết số lượng thì không đặt tiếp") đã được BE đảm bảo sẵn: search room-types ẩn loại hết phòng, `createBooking` tăng `bookedRooms` có điều kiện `< totalRooms`; FE hiện "X rooms left" và chặn đặt khi BE trả lỗi hết phòng.

### June 16, 2026 (continued)

- [x] **Fix luồng đặt phòng cho khách chưa đăng nhập (login redirect đánh rơi phòng đã chọn)**:
  - `HotelDetailPage` khi khách chưa login bấm "Book now" → điều hướng `/login` kèm `state: { from: { pathname: '/booking' }, booking: { hotel, roomType, checkIn, checkOut, guests } }`. Nhưng `LoginPage` trước đây luôn `navigate(getLandingPathForRole(role))` sau khi login, **bỏ qua `from` + `booking`** → khách bị đẩy về `/` và mất phòng đã chọn (checkout hiện "No room selected").
  - Sửa `pages/auth/LoginPage.tsx`: đọc `location.state` (kiểu `LoginRedirectState`), sau khi login thành công quay lại `from.pathname (+ search)` kèm `state: booking`; không có `from` thì mới về cổng mặc định theo role. Xử lý cả 2 nguồn redirect: `ProtectedRoute` (gửi cả `location`) và nút Book now (gửi `{ pathname }`).
  - Kết quả: khách chưa đăng nhập có thể search → chọn phòng → login → về thẳng `/booking` với đủ dữ liệu → tạo booking (`POST /bookings`).

- [x] **Verify guest "search hotels → booking" flow khớp với BE API + fix Hero search bỏ rơi ngày**:
  - Rà soát toàn bộ luồng client đã nối đúng hợp đồng BE: `GET /hotels` (`useSearchHotels` → `SearchResultsPage`), `GET /hotels/:id/room-types` (`useRoomTypes` → `HotelDetailPage`), `POST /bookings` (`useCreateBooking` → `BookingCheckoutPage`), `GET /bookings/me|:id`, `PATCH /bookings/:id/cancel`. Service/hook/type (`hotel.service.ts`, `booking.service.ts`, `hotel.types.ts`, `booking.types.ts`) khớp đúng response (Decimal serialize thành string, `minPrice`, `availableRooms`/`totalPrice` chỉ có khi truyền `checkIn`/`checkOut`).
  - Sửa `components/home/Hero.tsx`: form tìm kiếm trang chủ trước đây dùng `prompt()` lưu ngày dạng free-text rồi **vứt bỏ** khi submit (chỉ gửi `city` + `guests`) → BE bỏ qua bước tính tồn kho & giá kỳ ở. Thay bằng 2 `input[type=date]` thật (check-in tự đẩy check-out +1 ngày, `min` chặn quá khứ) + stepper số khách; `onSubmit` nay gửi `checkIn`/`checkOut`/`guests` sang `/search` để BE trả đúng phòng trống + tổng giá.

### June 16, 2026

- [x] **Hotel Verify — Aligned the entire FE data layer to the real backend API spec (7 endpoints under `/v1/hotel-partners`)**:
  - **Canonical types rewritten** (`hotel-verify.types.ts`): replaced the assumed/ad-hoc shapes with the real spec. `VerificationStatus` is now `'pending' | 'in_review' | 'approved' | 'rejected'` (dropped the invented `need_more_info`). Added spec enums `DocumentStatus`, `DocumentType` (incl. `tax_certificate`/`owner_id`/`property_proof`), `LicenseType`, `LicenseValidityStatus`, `StarRating`, `BusinessType`, `RepresentativeRole`. Rebuilt the detail entity `VerificationApplication` to match the GET detail response exactly: top-level `notes/createdAt/updatedAt`, nested `hotel` (with `images[]`, `roomConfig{ totalRooms, types[] }`, `representatives[]` using `dateOfBirth`, `payoutAccounts[]` **without** `accountNumber`), `partner`, `documents[]`, `licenses[]`, `reviewer`. `latitude`/`longitude` typed as `string | null` (Decimal serialised as string). Added `district?` back to `SaveBusinessInfoDto` and a `ReplaceDocumentDto`.
  - **Manager types rewritten** (`manager.types.ts`): `PaginatedVerificationRequests.results` now uses `VerificationListItem` (the lighter list shape — nested `hotel{ cover images }` + `partner`, not flat `hotelName/ownerName`); `VerificationRequestDetail = VerificationApplication`. Removed the dead `HotelVerificationRequest*`/`HotelVerificationDocument` interfaces.
  - **Services**: `hotel-verify.service.ts` added `replaceDocument(documentId, fileUrl)` → `POST /documents/:id/replace` (#7). `manager-verification.service.ts` retyped to the new list/detail/document shapes.
  - **Hooks**: added `useReplaceDocument` (partner, invalidates the applications query). Manager `useReviewDocument` now returns a typed `VerificationDocument`.
  - **Manager list page** (`VerificationRequestsPage.tsx`): reads nested `r.hotel.name`, `r.partner.businessName`, `r.hotel.city`; search filters on the nested fields.
  - **Manager detail modal** (`VerificationDetailModal.tsx`): fully rewritten to read the real detail shape instead of the form shape. Sections: Hotel Info (`hotel` + partner contact), **Documents** (license metadata from `licenses[]` + each `documents[]` file with status badge, view link, and **per-document Approve/Reject** via `useReviewDocument` (#6)), Representatives (`hotel.representatives[]`), Property & Rooms (images grouped by `imageCategory` + `roomConfig.types`), Payment (`hotel.payoutAccounts[]`, account number shown as encrypted). Whole-request Approve/Reject (#5) reads the freshest status from the loaded detail.
  - **Partner Verification Center** (`VerificationCenter.tsx`): status enum updated to spec (`in_review` replaces `need_more_info`; tabs now Pending Review / In Review / Approved / Rejected). Added a **Documents to Resubmit** card that lists rejected, not-yet-replaced documents and lets the partner re-upload + replace each file (`useUploadFile` → `useReplaceDocument`, #7).

### June 15, 2026

- [x] **Hotel Verify — Fixed blank/white screen on Verification Center after successful submit**:
  - **Root cause**: `VerificationCenter.tsx` referenced an undefined `StepStatus` enum (never imported, never defined) plus fields that don't exist on the real `VerificationApplication` type (`overallStatus`, `createdAt`, `steps.businessInfo`). Once an application existed (i.e. right after a successful verify submit), rendering hit those references and threw `ReferenceError: StepStatus is not defined`, which unmounted the whole React tree → blank white page at `/partner/verify`.
  - **Fix `VerificationCenter`**: rewrote the status card to use the actual `VerificationApplication` shape — `status` (`'pending' | 'approved' | 'rejected' | 'need_more_info'`) instead of `StepStatus.REJECTED`/`overallStatus`, `submittedAt` instead of `createdAt`, and `rejectionReason` instead of `steps.businessInfo`. Added proper handling for `approved` (emerald check icon, "Verification Approved", completed timeline) and `need_more_info` (treated as action-required alongside `rejected`); removed the now-unused `import React`.
  - **Fix `VerifyHotelPage`**: corrected `const { data: isLoading } = useGetApplicationById(...)` → `const { isLoading } = ...`; the old alias assigned the loaded application object to `isLoading`, leaving the edit flow stuck on the spinner forever once data arrived.

### June 11, 2026 (continued)

- [x] **Hotel Verify — Moved Room Config to Step 5 (Property & Rooms), required map location, top-level `roomConfig` payload**:
  - **Room Config relocated**: moved the room configuration (total rooms + room types) out of Step 2 (Business License) into **Step 5**, which is renamed **"Property & Rooms"** (per design decision — room/inventory data belongs with the physical-property description, not legal docs). `roomConfigSchema` moved from `propertyDetailsSchema` → `propertyImagesSchema`. `PropertyDetailsStep` reverted to license-only (removed `useFieldArray`/`watch`/`control` + the room UI). `PropertyImagesStep` (manual-state, no RHF) now holds room config via local `useState` (`totalRooms`, `roomTypes` with add/remove + live "X / Y allocated" indicator and submit-time validation: total ≥1, each type named & ≥1 room, sum must equal total); persisted on both Back and Continue.
  - **Payload shape**: `roomConfig` is now emitted as a **top-level key** in `HotelRegistrationRequest` (removed from `SaveBusinessLicenseDto`); `buildPayload` in `ReviewSubmitStep` destructures `roomConfig` out of the property-images draft and keeps `propertyImages` as images-only. Review card 2 reverted to "Business License"; card 5 → "Property & Rooms" now shows the room summary.
  - **Labels**: `VerificationStepper` (step 2 → "Business License", step 5 → "Property & Rooms") and `VerificationStepsCard` updated to match.
  - **Required map location**: `businessInfoSchema.location` is now **required** (was optional) so `lat`/`lng` are always sent to the BE — `SaveBusinessInfoDto.location` made non-optional, and `BusinessInfoStep` shows a red `*`, red map border + inline error when unpinned, and validates on pin.

### June 11, 2026

- [x] **Hotel Verify — Hotel-only, Room Configuration, Draft Persistence, Review Navigation**:
  - **Draft persistence across reload**: wrapped `stores/hotel-verify.store.ts` with Zustand `persist` middleware (`name: 'hotel-verify-draft'`, `localStorage` via `createJSONStorage`, `partialize` keeps only `draft`). All 6 step DTOs now survive a page reload. Exported the `HotelVerifyDraft` interface (used to type `buildPayload` in `ReviewSubmitStep`, replacing the now-broken `ReturnType<typeof useHotelVerifyStore>['draft']`).
  - **Step 1 hotel-only**: `BusinessInfoStep` no longer offers a property-type dropdown — removed the `Select` (resort/villa/apartment), hardcoded `businessType: 'hotel'` in defaults + a `useEffect(setValue('businessType','hotel'))`, and rendered a read-only "Hotel · Hotels only" badge (`BadgeCheck` icon).
  - **Step 2 Room Configuration** (kept Business License, added a section below it): extended `propertyDetailsSchema` with `roomConfig` (`roomConfigSchema`: `totalRooms` coerced int ≥1, `roomTypes` array of `{ name, quantity }` min 1, plus a `superRefine` that the sum of per-type quantities must equal `totalRooms`). `PropertyDetailsStep` now uses `useFieldArray` for `roomConfig.roomTypes` — add/remove room types, per-type room count, a live "X / Y rooms allocated" indicator (emerald when matched, amber otherwise). Header renamed to "Business License & Rooms"; stepper/review labels → "License & Rooms". Added `RoomTypeDto`/`RoomConfigDto` to `hotel-verify.types.ts` and `roomConfig` to `SaveBusinessLicenseDto`.
  - **Review card navigation**: `ReviewSubmitStep` `SummaryCard` is now clickable for **every** step (not just incomplete ones) — clicking/Enter/Space jumps to that step via `onNavigateToStep`; complete cards show "Tap to edit this step", incomplete show "Tap to complete this step"; added `role="button"`, `tabIndex`, and focus-visible ring for a11y. The License & Rooms card now also summarises total rooms + room-type breakdown.

### June 5, 2026 (continued 3)

- [x] **Role-based redirect after login (admin / user / hotel partner)**:
  - Created `src/constants/roles.ts` — `UserRole` const map (matching backend `server/src/config/roles.ts`: `guest`, `customer`, `staff`, `marketer`, `hotel_partner`, `platform_manager`, `admin`), a `ROLE_HOME_ROUTE` map, and a `getLandingPathForRole(role)` helper (admin/platform_manager → `/admin/dashboard`, hotel_partner → `/partner/dashboard`, guest/customer/others → `/`, unknown → `/`).
  - Typed the auth flow: added `AuthToken`, `AuthTokens`, `AuthResponse` interfaces to `auth.types.ts` and changed `User.role` from `string` to `UserRole`; typed `authService.login` as `Promise<AuthResponse>` (`api.post<AuthResponse>`) to avoid `any`.
  - Rewired `LoginPage.tsx` `onSubmit` to read the returned `user.role` from `login()` and `navigate(getLandingPathForRole(role), { replace: true })` instead of the hardcoded `navigate('/')`.
  - Created `src/routes/ProtectedRoute.tsx` — role-based auth guard used as a layout route (`<Outlet />`): not authenticated → redirect `/login` (keeps intended page in `location.state.from`); wrong role → redirect to that role's own landing via `getLandingPathForRole`; `allowedRoles` prop optional (empty = login-only).
  - Guarded route groups in `App.tsx`: wrapped `/partner/*` with `ProtectedRoute allowedRoles={[HOTEL_PARTNER]}` and `/admin/*` with `allowedRoles={[ADMIN, PLATFORM_MANAGER]}`.
- [x] **Split routing into per-role modules (`routes/`)**:
  - Replaced the monolithic `<Routes>` tree in `App.tsx` with react-router v7 object routes (`useRoutes`). `App.tsx` now only imports `appRoutes` + `TooltipProvider` (no page imports).
  - Created `src/routes/authRoutes.tsx` (public auth pages), `guestRoutes.tsx` (guest `/` portal), `partnerRoutes.tsx` (`/partner`, guarded `hotel_partner`), `adminRoutes.tsx` (`/admin`, guarded `admin`/`platform_manager`) — each exports a typed `RouteObject[]`, with the `ProtectedRoute` guard baked into the partner/admin modules.
  - Added `src/routes/index.ts` aggregating all modules into `appRoutes`.
- [x] **Guest navbar user dropdown menu**:
  - Replaced the inline avatar + name + Log out button in `components/layout/Navbar.tsx` with a shadcn/Radix `DropdownMenu`: avatar+name+chevron is the trigger; the menu shows a user-info header (avatar, name, email, role badge), a role-aware `Dashboard` link (only for roles whose landing page isn't `/`, via `getLandingPathForRole`), `My Account`, and a destructive `Log out` item.
  - Added a `ROLE_LABELS` map for friendly role display; lucide icons (`LayoutDashboard`, `LogOut`, `User`, `ChevronDown`).
- [x] **Hotel Verify Wizard — Mobile Responsive, Data Persistence, Review Navigation**:
  - `VerificationStepper`: added `overflow-x-auto` horizontal scroll wrapper with `min-w-max` inner container; reduced circle size to `w-7 h-7 sm:w-8 sm:h-8`; hides labels on mobile except active step; compact `mb-10 sm:mb-16` spacing.
  - `VerifyHotelPage`: reduced outer padding to `p-4 sm:p-6`; passes `onNavigateToStep={updateStep}` to `ReviewSubmitStep`.
  - `ReviewSubmitStep`: added `onNavigateToStep?: (step: number) => void` prop; `SummaryCard` becomes clickable (amber border + cursor-pointer) when step is incomplete and `onNavigateToStep` is provided; shows "Tap to complete this step →" CTA on incomplete cards.
  - `PropertyDetailsStep`, `AccommodationCertificateStep`, `RepresentativeVerificationStep`, `PaymentPayoutsStep`: added `getValues` from `useForm`; Back button calls `setXxx(getValues())` before navigating so partially-filled form data is saved to Zustand draft without validation.
  - `PropertyImagesStep`: fully rewritten — uploads files immediately per zone on `onFilesChange`; URL arrays initialised from `draft.propertyImages` on mount so re-entry shows previously-uploaded counts; Back saves partial URLs to store; Continue validates URL counts (not File objects); per-zone "N images uploaded" emerald banners on re-entry.
  - `BusinessInfoStep`: map height changed to `h-52 sm:h-72` for mobile; fixed pre-existing `useRef` missing initial-value error.

### June 5, 2026 (continued 2)

- [x] **Vietnam Geo: Remove District level (Province → Ward direct)**:
  - Removed `District`, `ProvinceWithDistricts`, `DistrictWithWards` from `vietnam-geo.types.ts`; replaced with `ProvinceWithWards` (wards directly under province) and updated `Ward.province_code`.
  - Removed `getProvinceWithDistricts` / `getDistrictWithWards` from `vietnam-geo.service.ts`; added `getProvinceWithWards(code)` calling `/p/${code}?depth=2`.
  - Removed `useVietnamDistricts` from `useVietnamGeo.ts`; `useVietnamWards` now takes `provinceCode` directly (Province → Ward in one hop).
  - Removed `district` field from `businessInfoSchema` (validation) and `SaveBusinessInfoDto` (types).
  - Rewired `BusinessInfoStep.tsx`: replaced Province → District → Ward 3-level cascade với 2-level Province → Ward; district Select removed; ward geocoding dùng `${ward}, ${province}, Việt Nam`.
- [x] **Map: Switch to VietMap Vector Tiles (maplibre-gl)**:
  - Installed `maplibre-gl`.
  - Rewrote `PropertyMapPicker.tsx` using `maplibre-gl` WebGL vector renderer; style URL built from `VITE_API_MAP_KEY` (`https://maps.vietmap.vn/api/maps/light/styles.json?apikey=…`).
  - Replaced `react-leaflet` `TileLayer` (raster) + `Marker` với native maplibre-gl `Map`, `Marker`, `flyTo`; removed `VITE_MAP_TILE_URL` dependency.
  - Pinned-coordinate badge moved inside map container as absolute overlay.

### June 5, 2026 (continued)

- [x] **Vietnam Address Cascading Selects + VietMap Integration (BusinessInfoStep)**:
  - Created `src/types/vietnam-geo.types.ts` — `Province`, `District`, `Ward`, `ProvinceWithDistricts`, `DistrictWithWards` interfaces matching `provinces.open-api.vn` response shape.
  - Created `src/services/vietnam-geo.service.ts` — calls free public API `https://provinces.open-api.vn/api/` for all 63 provinces, districts under a province (depth=2), and wards under a district (depth=2).
  - Created `src/hooks/hotel-verify/useVietnamGeo.ts` — three TanStack Query hooks: `useVietnamProvinces`, `useVietnamDistricts(provinceCode)`, `useVietnamWards(districtCode)` with `staleTime: Infinity` (static reference data).
  - Created `src/components/hotel-partner/hotel-verify/PropertyMapPicker.tsx` — `react-leaflet` map using VietMap raster tiles (`VITE_API_MAP_KEY`); falls back to OpenStreetMap tiles with an amber notice banner when key is absent; `MarkerMover` sub-component flies to the pinned position on first pin; click to place/move a marker; emits `{ lat, lng }` via `onChange`.
  - Rewrote `BusinessInfoStep.tsx`: replaced hardcoded City/Province Select + free-text District Input with three fully cascading API-driven Selects (Province → District → Ward); each shows a spinner while loading; Province change resets District and Ward; `useEffect` restores province/district codes from saved names on wizard re-entry; replaced the static map placeholder with the live `PropertyMapPicker`; pinned coordinates shown as an emerald badge; all stored in the `location` field of `businessInfoSchema`.
  - Installed `leaflet`, `react-leaflet`, `@types/leaflet`.

### June 5, 2026

- [x] **Hotel Verify Full Validation & API Integration**:
  - Added complete Zod schemas for all 6 wizard steps in `hotel-verify.validation.ts`: `businessInfoSchema`, `propertyDetailsSchema`, `accommodationCertificateSchema`, `representativeSchema`, `propertyImagesSchema`, `paymentPayoutsSchema`.
  - Added `HotelRegistrationRequest` interface to `hotel-verify.types.ts` mapping all step DTOs to the single POST payload.
  - Added `uploadFile(file)` method to `hotel-verify.service.ts` (calls `POST /uploads`, returns URL) and typed `submitRegistration` with `HotelRegistrationRequest`.
  - Created `src/stores/hotel-verify.store.ts` — Zustand draft store that accumulates all 6 step form values across the wizard; resets on successful submission.
  - Updated `useHotelVerify.ts`: typed `useSubmitRegistration` with `HotelRegistrationRequest`, added `useUploadFile` hook.
  - Extended `FileUploadDropzone` with `onFilesChange`, `error`, and `isUploading` props.
  - Rewired `BusinessInfoStep` to save to store on Continue (uses draft as defaultValues for re-entry).
  - Rewired `PropertyDetailsStep` with React Hook Form + Zod; file uploads on selection via `uploadFile`, URL injected via `setValue`; saves to store.
  - Rewired `AccommodationCertificateStep` with React Hook Form + Zod; per-zone upload state (`useUploadZone` helper); optional sections (security, classification) omitted from store if empty.
  - Rewired `RepresentativeVerificationStep` with React Hook Form + Zod; separate upload handlers for front/back ID images; saves to store.
  - Rewired `PropertyImagesStep` — no RHF (all files); three `FileUploadDropzone` instances with manual min-count validation; all files uploaded in parallel on Continue; saves URL arrays to store.
  - Rewired `PaymentPayoutsStep` with React Hook Form + Zod; `watch` drives the live ATM card preview; `taxInvoice` omitted from payload if empty.
  - Rewrote `ReviewSubmitStep` to read live data from the Zustand store for all 6 summary cards; incomplete-step banner if any step is missing; calls `POST /hotel-partners/registrations` with assembled `HotelRegistrationRequest`; resets draft on success; shows inline error on failure.

### June 5, 2026

- [x] **AGENTS.md Naming Convention Alignment**:
  - Renamed portal folders to lowercase/kebab-case: `pages/admin`, `pages/auth`, and `pages/guest`.
  - Renamed component folders to `components/admin`, `components/booking-information`, and `components/detail`.
  - Added the `Page` suffix to guest and auth route component files and component names.
  - Renamed shared infrastructure files to `lib/cn.ts`, `stores/authStore.ts`, and `hooks/useMobile.ts`.
  - Updated all affected imports and preserved Git-visible case-only renames for cross-platform builds.

### June 2, 2026

- [x] **Admin Common Layout Integration**:
  - Rewired `AdminLayout` to use `CommonSidebar` and `CommonNavbar` from `src/common`, matching the existing `HotelPartnerLayout` composition.
  - Passed admin-specific nav items, footer settings, realtime calendar trigger, messages, support, and avatar controls through the shared common layout components.
  - Extended `CommonNavbar` with optional `currentTime` and `onDateClick` props so admin can keep its realtime calendar modal behavior.
  - Removed the now-unused `AdminNavbar` and `AdminSidebar` component files after migrating admin to the shared common layout.
- [x] **Admin Analytics Two-Bar Revenue Chart**:
  - Changed the analytics Revenue Growth visualization from one revenue bar plus a target line to paired revenue and target bars for each month.
  - Removed hover-driven bar recoloring so revenue and target bars keep consistent colors while the tooltip still works.
- [x] **Hotel Partner Verification System**:
  - Implemented the complete 8-step `VerifyHotelPage.tsx` wizard flow for hotel partners.
  - Created welcome dashboard components (`VerificationHeroCard`, `VerificationBenefitsCard`, `VerificationStepsCard`, `VerificationCenter`).
  - Built specialized step components: `BusinessInfoStep`, `PropertyDetailsStep`, `AccommodationCertificateStep`, `RepresentativeVerificationStep`, `PropertyImagesStep`, `PaymentPayoutsStep`, and `ReviewSubmitStep`.
  - Created a robust shared UI component `FileUploadDropzone` for drag-and-drop file/image uploads with real-time previews and validation constraints (e.g., minFiles).
  - Designed the complex `PaymentPayoutsStep` with a real-time responsive Banking Preview Card.
  - Tuned layout paddings and text sizes across Verification components to ensure single-screen visibility on desktop devices without forced scrolling.
- [x] **Common Layout & Shared Components UI Alignment**:
  - Extracted and centralized `CommonSidebar` and `CommonNavbar` inside `src/common`.
  - Refactored `HotelPartnerLayout` to consume the shared Layout elements and removed redundant specific sidebars.
  - Aligned `CommonNavbar` and `CommonSidebar` to match the aesthetics of the `Admin` layout (reduced height, centered items, dynamic logo badges, rich active states, and user profile integration).
  - Implemented seamless `collapsible="icon"` functionality for the Sidebar to handle clean icon-only rendering when shrunk.
  - Established a robust `.btn-common` design system class in `index.css` containing theme-driven role modifiers (`.btn-role-guest`, `.btn-role-admin`, etc.) ensuring universal button consistency across portals.
  - Updated Partner Dashboard components (`DashboardStats`, `DashboardHeader`) with polished Lucide icons, micro-animations, and unified role button styles.

### Previous Updates

- [x] **Simplified Registration Flow**:
  - Removed Verification Code and Send OTP fields from Register screen (`Register.tsx`).
- [x] **Auth Screens Modernization (Visuals & Primives)**:
  - Removed all heavy image and overlay backgrounds on the `Login`, `Register`, `VerifyIdentity`, and `ForgotPassword` screens.
  - Replaced elements with custom Shadcn-styled components (`Input`, `Label`, `Button`) on all 4 pages.
  - Aligned Register page form card width (`max-w-[480px]`) to match the Login page card width perfectly.
- [x] **Button Color Harmonization**:
  - Aligned the color of submit buttons in `Login.tsx` and `Register.tsx` to match the exact primary `bg-primary` / `text-on-primary` style from the "Send OTP" screen.
- [x] **Robust Form Validation (React Hook Form + Zod)**:
  - Fully integrated `react-hook-form` and `zod` schema resolvers inside `Login.tsx` and `Register.tsx`.
  - Replaced native alerts with beautiful red (`text-error`) inline validation messages.
- [x] **Shadcn Button Adoption across Homepage**:
  - Successfully migrated all active button elements on the homepage sections to use the **Shadcn UI Button** component:
    - `Hero.tsx` (Search form submission trigger)
    - `LoyaltyBanner.tsx` ("Join Rewards" and "Learn More" buttons)
    - `Promotions.tsx` ("Claim Offer" and "Sign In to See" actions)
    - `DiscoverVietnam.tsx` ("View all destinations" custom link button)
    - `WeekendDeals.tsx` ("View all deals" text trigger and active floating "Favorite" circle overlays)
    - `AccommodationTypes.tsx` (Interactive card list categories)
- [x] **Build & Casing Import Fixes**:
  - Resolved lowercase/uppercase import casing mismatch warnings (`components/home` vs `components/Home`) to enable 100% clean production bundler compilation.
  - Successfully compiled the production build with `npm run build` (236 modules successfully bundled).
- [x] **Executive Penthouse Suite Details Page Integration**:
  - Built a modern, gorgeous luxury room details page component `RoomDetail.tsx` matching the editorial quiet luxury style.
  - Implemented fully interactive React features: lightbox slideshow modal, smooth description expand/collapse, dynamically computed totals, room-type toggles, and premium modal booking notifications.
  - Interconnected homepage components (`WeekendDeals`, `AccommodationTypesPage`) to route users seamlessly to the suite detail page.
- [x] **Booking Information Integration**:
  - Created a brand-new high-fidelity checkout form page `BookingInformation.tsx` under `/booking-information`.
  - Extracted UI layout segments into highly clean component files inside `components/BookingInformation/`: progress stepper `BookingStepper`, guest form inputs `BookingDetailsForm`, room perk lists `BookingPerks`, and dynamically computed calendar/invoice sidebars `BookingSidebar`.
  - Connected the confirmation overlay inside the detail page to fluidly transition the user to this Booking Information screen, auto-populating check-in/out dates, guest parameters, and selected room values.
- [x] **Universal React Hook Form Migration**:
  - Migrated **100% of input forms** in the application to use `react-hook-form` paired with Zod schema resolvers (`@hookform/resolvers/zod`).
  - Refactored `ForgotPassword.tsx` to handle inputs and schema validations with Zod.
  - Refactored `VerifyIdentity.tsx` to register 6 numeric digit boxes in Zod and hook them up to the keyboard focus handlers.
  - Refactored `Hero.tsx` search parameters (destination, dates, guests) to utilize react-hook-form registers and form watchers.
  - Refactored `DigitalConcierge.tsx` chat input to use react-hook-form handlers and automatic resets.
- [x] **Admin Dashboard Shell**:
  - Built a clean admin dashboard page with sidebar, top bar, KPI cards, chart placeholders, and quick actions.
  - Registered the `/admin` route to render the new dashboard view.
- [x] **Admin Layout Extraction**:
  - Split admin sidebar, navbar, and layout wrapper into reusable components for admin pages.
- [x] **Alias Setup**:
  - Added `@/` path alias to Vite and TypeScript configs for cleaner imports.

---

## Detailed File Modification Map

| Component / File                                                                                                                                     | Refactoring Action                | Key Features                                                                                                                                                      |
| :--------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[ui/input.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/components/ui/input.tsx)**                               | `[NEW]` Shadcn Component          | Reusable standard text input primitive.                                                                                                                           |
| **[ui/label.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/components/ui/label.tsx)**                               | `[NEW]` Shadcn Component          | Reusable premium typography form labels.                                                                                                                          |
| **[Register.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/pages/Register.tsx)**                                    | `[MODIFY]` Simplified Auth Screen | Adopted Shadcn components, deleted Verification/Send Code states and elements, integrated Zod schema validation & React Hook Form, and removed background images. |
| **[Login.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/pages/Login.tsx)**                                          | `[MODIFY]` Auth Screen            | Integrated Zod schema validation & React Hook Form, removed background images, and adopted Shadcn components.                                                     |
| **[ForgotPassword.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/pages/ForgotPassword.tsx)**                        | `[MODIFY]` Auth Screen            | Removed background images, adopted Shadcn components.                                                                                                             |
| **[VerifyIdentity.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/pages/VerifyIdentity.tsx)**                        | `[MODIFY]` Auth Screen            | Removed background images, adopted Shadcn components for numeric OTP codes and resend triggers.                                                                   |
| **[Home/Hero.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/components/Home/Hero.tsx)**                             | `[MODIFY]` Home Component         | Migrated search trigger to Shadcn Button.                                                                                                                         |
| **[Home/LoyaltyBanner.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/components/Home/LoyaltyBanner.tsx)**           | `[MODIFY]` Home Component         | Migrated standard buttons to Shadcn Button.                                                                                                                       |
| **[Home/Promotions.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/components/Home/Promotions.tsx)**                 | `[MODIFY]` Home Component         | Migrated card triggers to Shadcn Button.                                                                                                                          |
| **[Home/DiscoverVietnam.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/components/Home/DiscoverVietnam.tsx)**       | `[MODIFY]` Home Component         | Migrated link text trigger to Shadcn Button variant link.                                                                                                         |
| **[Home/WeekendDeals.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/components/Home/WeekendDeals.tsx)**             | `[MODIFY]` Home Component         | Migrated text link and circle favorite overlay buttons to Shadcn Buttons. Interlinked cards to route to `/room/executive-penthouse`.                              |
| **[Home/AccommodationTypes.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/components/Home/AccommodationTypes.tsx)** | `[MODIFY]` Home Component         | Migrated type category card buttons to ghost Shadcn Buttons.                                                                                                      |
| **[AccommodationTypes.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/pages/AccommodationTypes.tsx)**                | `[MODIFY]` Stays Page             | Interlinked accommodation cards to route to `/room/executive-penthouse`.                                                                                          |
| **[RoomDetail.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/pages/RoomDetail.tsx)**                                | `[MODIFY]` Room Detail Page       | Refactored details layout into component folder delegating to `components/Detail` sub-components.                                                                 |
| **[BookingConfirmation.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/components/Detail/BookingConfirmation.tsx)**  | `[MODIFY]` Details Component      | Updated 'Confirm Booking' action to transition users to `/booking-information` route.                                                                             |
| **[BookingInformation.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/pages/BookingInformation.tsx)**                | `[NEW]` Booking Form Page         | Created the central BookingInformation customer form orchestrating dynamic pricing variables.                                                                     |
| **[components/BookingInformation/\*](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/components/BookingInformation)**     | `[NEW]` Components folder         | Extracted stepper progress indicator, user input form (Hook Form + Zod), highlights perks, and calendar snapshot sidebars.                                        |
| **[App.tsx](file:///Users/manh/Documents/WDP/WDP_Project/SmartStayAI-System/client/src/App.tsx)**                                                    | `[MODIFY]` Main Router            | Registered the `/booking-information` route.                                                                                                                      |

---

_Last Updated: 2026-06-01_

- [x] **Admin Multi-Page Refactor (Based on New Mockups)**:
  - Reworked admin routing to nested pages under /admin/\* with shared shell layout.
  - Extracted and reused AdminSidebar, AdminNavbar, and AdminLayout as a true admin frame.
  - Added separate pages for AdminPropertiesPage, AdminUsersPage, AdminBookingsPage, and AdminAnalyticsPage based on provided references.
  - Switched new admin action controls and search fields to Shadcn primitives (Button, Input).
- [x] **Admin Component Decomposition (All Pages + Dashboard)**:
  - Added dedicated `/admin/dashboard` page based on the provided dashboard reference.
  - Split dashboard into small components: stat card, growth chart panel, app panel, quick actions panel, activity log table, and system health card.
  - Refactored admin pages (`analytics`, `properties`, `users`, `bookings`) to compose from modular components instead of large page files.
  - Added shared admin primitives: `AdminPageHeader` and `AdminTable` for consistent structure and reuse across admin screens.
  - Verified build success after refactor (`npm run build`).
- [x] **Admin Responsive Tailwind Tuning (Laptop + Mobile)**:
  - Refined admin shell spacing and breakpoints (`AdminLayout`, `AdminNavbar`, `AdminSidebar`) for better laptop fit.
  - Reduced oversized typography and normalized card/table spacing on dashboard widgets.
  - Added horizontal overflow handling and minimum width strategy for admin tables on smaller screens.
  - Tuned analytics/dashboard chart-card sizing and responsive ring/chart placeholders.
  - Verified compile success after class updates with `npm run build`.
- [x] **Admin Fixed Shell + Narrower Content Width**:
  - Made admin sidebar fixed to viewport on desktop (`lg+`) so it no longer stretches with page content height.
  - Made admin navbar fixed at top on desktop with proper left offset matching sidebar width.
  - Reduced effective page footprint by constraining main content container to `max-w-[1120px]` / `xl:max-w-[1200px]`.
  - Added top padding compensation for fixed navbar to avoid overlap.
  - Verified build success after layout changes (`npm run build`).
- [x] **Admin Dashboard Resizing to Match Latest Reference**:
  - Re-tuned fixed-shell dimensions (sidebar, navbar offsets, content container) for the latest provided dashboard proportion.
  - Resized dashboard-specific UI blocks (KPI cards, growth panel, device panel, right app rail, quick action rail, activity log, system health) to align with the screenshot's larger visual scale.
  - Verified build passes after class adjustments (`npm run build`).

_Last Updated: 2026-06-02_

- [x] **Admin Sidebar Mobile/Tablet Drawer**:
  - Added a hamburger button to the admin navbar on screens below `lg`.
  - Added a mobile/tablet slide-out sidebar drawer with backdrop dismissal and auto-close after navigation.
  - Added a direct close button inside the mobile/tablet sidebar drawer.
  - Kept the fixed desktop sidebar behavior unchanged on `lg+` screens.
- [x] **Admin Settings Page**:
  - Added a dedicated `/admin/settings` page instead of reusing the analytics route.
  - Built responsive settings sections for platform defaults, AI automation, security controls, notifications, and API keys.
- [x] **Admin Navbar Dynamic Time**:
  - Replaced the hardcoded admin navbar timestamp with a browser-formatted realtime date/time that updates every second.
- [x] **Admin Realtime Calendar Modal**:
  - Added a responsive calendar overlay opened from the admin navbar date/time or calendar icon.
  - Calendar renders the current month from live browser time, highlights today's date, and shows a realtime clock with today's schedule.
  - Connected the sidebar Calendar item to open the same realtime calendar modal on desktop, tablet, and mobile.
- [x] **Admin Dashboard App Panel Refresh**:
  - Redesigned the dashboard app panel as a card-style shortcut launcher with icons, statuses, and responsive grid behavior.
  - Connected the dashboard Calendar shortcut to the shared realtime calendar modal.
- [x] **Admin Messages Modal**:
  - Added a responsive messages overlay with conversation list, active chat thread, typing state, and message input.
  - Connected the dashboard Messages shortcut to open the shared admin messages modal.
- [x] **Admin Tasks Modal**:
  - Added a task overview overlay matching the provided reference, with status, priority, task, assignee, and due columns.
  - Connected the dashboard Tasks shortcut to open the shared admin tasks modal.
- [x] **Admin File Manager Modal**:
  - Added a file manager overlay with category sidebar, breadcrumb header, file search, folder cards, and recent files table.
  - Connected the dashboard File Manager shortcut to open the shared admin file manager modal.
- [x] **Admin Generate Report Modal**:
  - Added a two-step report generation overlay with report parameters, date range, output format, delivery, and generate action.
  - Connected the dashboard Quick Actions "Generate Report" button to open the shared admin report modal.
- [x] **Admin Modal Coverage + Realtime Pass**:
  - Added missing modals for Notes, Support, Create New User, and Schedule Maintenance.
  - Connected every dashboard app shortcut and quick action to a modal.
  - Passed the shared realtime admin clock into modals that display timestamps or date-sensitive values.
  - Connected navbar Bell to Messages and Help to Support.
- [x] **Admin Dashboard Growth Chart Rendering**:
  - Replaced the empty Monthly User Growth placeholder with a responsive Recharts area chart.
- [x] **Admin Analytics Numbers + Charts**:
  - Added revenue totals/latest values and rendered the Revenue Growth chart with Recharts.
  - Added user demographic total, pie chart, hover-only centered donut value, and numeric segment legend.
- [x] **Admin Dashboard Device Chart Hover Values**:
  - Replaced the dashboard Device Distribution CSS donut with a Recharts donut.
  - Added numeric legend and hover-only centered value/label behavior.
- [x] **Admin Criteria Coverage Pages**:
  - Added Payments, AI Settings, and System Monitor admin pages.
  - Updated dashboard stats to include users, revenue, bookings, and engagement metrics.
  - Added user moderation actions for approve, activate, and deactivate.
  - Added sidebar and routes for payments, AI settings, and system monitoring.
- [x] **Admin Analytics Hover + User Actions**:
  - Reworked analytics revenue chart hover so revenue is a single bar series and target is a dashed line.
  - Simplified user management row actions into a cleaner View, primary moderation action, and secondary action layout.
- [x] **Admin Users Action Semantics**:
  - Updated Users table so Status remains the activity state and Actions only contains View, Edit, and Delete controls.
  - Fixed Users table rendering so Actions no longer replaces the Status column.
- [x] **Admin Users Shadcn Dropdown Actions**:
  - Added a shadcn-style DropdownMenu primitive backed by Radix UI.
  - Changed Users row actions from inline buttons to a compact dropdown containing View, Edit, and Delete.
- [x] **Landing Hero Background Image**:
  - Added a full-bleed luxury resort background image layer to `Home/Hero.tsx`, matching the warm quiet-luxury palette.
  - Layered a light `surface` gradient overlay (`from-surface via-surface/85 to-surface/60`) so the dark heading text and white search bar stay readable.
  - Lifted hero content above the background with explicit `z-10` stacking.
- [x] **Auth Background Images (Login + Register)**:
  - Re-introduced full-screen luxury background image layers behind the glass cards in `Auth/Login.tsx` and `Auth/Register.tsx`, leveraging the existing `backdrop-filter: blur(20px)` glassmorphism.
  - Added a symmetric light overlay (`from-surface/85 via-surface/65 to-surface/85`) on both pages so the translucent cards and gradient brand logo stay legible.
  - Used two harmonious warm-toned images (hotel interior for Login, resort for Register) sitting under the `relative z-10` content.
- [x] **Auth Background Image (Forgot Password)**:
  - Added a matching luxury background image layer + light `surface` overlay behind the glass card in `Auth/ForgotPassword.tsx`, consistent with Login/Register.
  - Preserved the existing premium blur-glow accents above the new background layer.
