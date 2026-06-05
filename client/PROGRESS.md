# Smart Stay AI - Client Development Progress

This file tracks the accomplished tasks, resolved user requests, and visual/functional refactoring completed in the client application.

---

## Completed Tasks Checklist

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
