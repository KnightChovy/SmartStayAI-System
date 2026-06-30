# AGENTS.md — SmartStay AI · Frontend

> **SmartStay AI** — AI-Powered Hotel Booking and Customer Engagement Platform  
> Stack: **Vite + React 19 + TypeScript**

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Hướng dẫn cài đặt & chạy Dev](#3-hướng-dẫn-cài-đặt--chạy-dev)
4. [Hướng dẫn Build](#4-hướng-dẫn-build)
5. [Quy ước code](#5-quy-ước-code)
6. [Quy ước Git & Commit](#6-quy-ước-git--commit)
7. [Kiến trúc & luồng dữ liệu](#7-kiến-trúc--luồng-dữ-liệu)
8. [Hướng dẫn cho AI Agent](#8-hướng-dẫn-cho-ai-agent)
9. [Biến môi trường](#9-biến-môi-trường)

---

## 1. Tổng quan dự án

SmartStay AI frontend là ứng dụng **single-page application (SPA)** phục vụ **5 role-based portal** trên cùng một codebase Vite + React + TypeScript:

| Portal        | Route prefix     | Người dùng                  |
| ------------- | ---------------- | --------------------------- |
| Guest         | `/`              | Khách đặt phòng             |
| Staff         | `/staff`         | Lễ tân, chăm sóc khách hàng |
| Hotel-Partner | `/hotel-partner` | Hotel Partner               |
| Manager       | `/manager`       | Hotel Manager               |
| Admin         | `/admin`         | System Admin                |

**Các tính năng AI nổi bật hiển thị trên frontend:**

- AI Booking Chatbot (streaming chat UI)
- AI Content Draft Editor (Marketing portal)
- Sentiment badge trên reviews
- Smart Alert notifications (Manager portal)

---

## 2. Cấu trúc thư mục

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Router root + providers
│
├── routes/
│   ├── ProtectedRoute.tsx      # Auth guard theo role
│   ├── adminRoutes.ts
│   ├── ...
│   └── userRoutes.ts               # Định nghĩa path constants
│
├── pages/                      # Mỗi portal = 1 thư mục
│   ├── guest/
│   │   ├── HomePage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── RoomDetailPage.tsx
│   │   ├── BookingPage.tsx
│   │   ├── PaymentPage.tsx
│   │   ├── BookingSuccessPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── MyBookingsPage.tsx
│   │   └── ChatPage.tsx        # AI chatbot
│   ├── staff/
│   │   ├── DashboardPage.tsx
│   │   ├── BookingListPage.tsx
│   │   ├── CheckInPage.tsx
│   │   ├── InboxPage.tsx       # Unified inbox
│   │   └── ReviewsPage.tsx
│   ├── hotel-partner/
│   │   ├── bookings/
│   │   ├── dashboard/
│   │   ├── hotel-management/
│   │   ├── hotel-verify/
│   │   ├── revenue/
│   │   └── room-inventory/
│   ├── manager/
│   │   ├── DashboardPage.tsx
│   │   ├── RoomManagePage.tsx
│   │   ├── PricingPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   └── StaffPage.tsx
│   ├── admin/
│   │   ├── DashboardPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── PaymentsPage.tsx
│   │   ├── AiSettingsPage.tsx
│   │   └── SystemPage.tsx
│   └── auth/
│       ├── LoginPage.tsx
│       └── RegisterPage.tsx
│
├── components/
│   ├── ui/                     # Component thư viện (Button, Input, Modal, v.v.) của shacdcn/ui
│   │
│   ├── shared/                 # Dùng chung nhiều portal
│   │   ├── AppShell/           # Layout wrapper (sidebar + header)
│   │   ├── RoomCard/
│   │   ├── BookingStatusBadge/
│   │   ├── StarRating/
│   │   ├── DateRangePicker/
│   │   ├── PaginationBar/
│   │   └── SentimentBadge/     # AI sentiment indicator
│   │
│   ├── guest/
│   │   ├── ChatWindow/         # AI chatbot streaming UI
│   │   ├── RoomSearchForm/
│   │   ├── BookingSummary/
│   │   ├── VoucherCard/        # QR e-voucher display
│   │   └── LoyaltyWidget/
│   │
│   ├── staff/
│   │   ├── InboxThread/
│   │   ├── BookingTable/
│   │   └── CheckInForm/
│   │
│   ├── hotel-partner/
│   │   ├── ContentEditor/      # AI draft + review workflow
│   │   ├── ContentCalendar/
│   │   └── MetricsChart/
│   │
│   ├── manager/
│   │   ├── OccupancyChart/
│   │   ├── RevenueChart/
│   │   ├── SmartAlertBanner/
│   │   └── RoomInventoryTable/
│   │
│   └── admin/
│       ├── UserTable/
│       └── AiPromptEditor/
│
├── hooks/                      # Custom React hooks, mỗi domain 1 file trong thư mục
│   ├── auth/
|   |  ├── use-login.ts
|   |  ├── use-register.ts
│   ├── rooms/
│   ├── bookings/
│   ├── payments/
│   ├── reviews/
│   ├── chat/
│   └── ai/                      # Chatbot + content gen hooks
│
├── services/                   # Tầng gọi API (HTTP), không chứa logic UI
│   ├── auth.service.ts
│   ├── room.service.ts
│   ├── booking.service.ts
│   ├── payment.service.ts
│   ├── review.service.ts
│   └── ai.service.ts
│
├── stores/                     # Zustand global state
│   ├── authStore.ts
│   ├── bookingStore.ts
│   ├── chatStore.ts
│   └── uiStore.ts              # Theme, sidebar, modals
│
├── types/                      # TypeScript type definitions
│   ├── auth.types.ts
│   ├── room.types.ts
│   ├── booking.types.ts
│   ├── payment.types.ts
│   ├── review.types.ts
│   ├── ai.types.ts
│   └── api.types.ts            # ApiResponse<T>, PaginatedResponse<T>
│
├── utils/
│   ├── formatDate.ts
│   └── formatCurrency.ts       # VND + USD
|
├── lib/
│   ├── api.ts                  # Axios instance + interceptors
│   ├── cn.ts                  # Class name merging helper (clsx + tailwind-merge)
│   └── logger.ts              # Wrapper cho console.log, có thể mở rộng thành logging service (Sentry, LogRocket) sau này
│
├── constants/
│   ├── roles.ts                # UserRole enum
│   ├── routes.ts               # Route path constants
│   └── queryKeys.ts            # TanStack Query key factory
│
├── validations/
│   ├── auth.validation.ts      # Zod schemas cho form auth
│   ├── booking.validation.ts   # Zod schemas cho booking forms
│   └── ai.validation.ts        # Zod schemas cho chatbot input, content gen
|
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
└── styles/
    ├── index.css               # Tailwind directives + CSS vars
    └── animations.css          # Keyframes tái sử dụng
```

---

## 3. Hướng dẫn cài đặt & chạy Dev

### Yêu cầu

- **Node.js** >= 20.x
- **npm** >= 10.x

### Cài đặt

```bash
git clone https://github.com/<org>/smartstay-ai-web.git
cd smartstay-ai-web
npm install
```

### Cấu hình môi trường

```bash
cp .env.example .env
# Điền VITE_API_BASE_URL và các key cần thiết
```

### Chạy dev server

```bash
npm run dev
# → http://localhost:5173
```

### Các lệnh thường dùng

```bash
npm run dev          # Dev server với HMR
npm run build        # Build production
npm run preview      # Preview bản build production
npm run lint         # ESLint toàn bộ src/
npm run lint:fix     # ESLint + auto-fix
npm run type-check   # tsc --noEmit (không emit, chỉ check type)
npm run test         # Vitest unit tests
npm run test:ui      # Vitest UI mode
```

---

## 4. Hướng dẫn Build

```bash
npm run build
# Output: dist/
```

`vite.config.ts` cấu hình:

- Code splitting theo route (dynamic `import()`)
- Chunk riêng cho vendor lớn (`react`, `react-dom`, `recharts`, v.v.)
- Asset fingerprinting
- `base` URL lấy từ `VITE_BASE_PATH` (mặc định `/`)

Preview bản build:

```bash
npm run preview
# → http://localhost:4173
```

---

## 5. Quy ước code

### 5.1 TypeScript

- **`strict: true`** — không tắt bất kỳ strict flag nào.
- **Không dùng `any`**. Nếu bắt buộc, ghi `// eslint-disable-next-line @typescript-eslint/no-explicit-any` kèm lý do.
- **Không dùng `as` ép kiểu bừa bãi**. Dùng type guard hoặc Zod để validate dữ liệu ngoài.
- Dùng `interface` cho object shape, `type` cho union/intersection/utility types.

```typescript
// ✅ Đúng
interface Room {
  id: string;
  name: string;
  pricePerNight: number;
}

type RoomStatus = 'available' | 'booked' | 'maintenance';

// ❌ Sai
const room: any = fetchRoom();
const price = (room as Room).pricePerNight;
```

### 5.2 Đặt tên

| Loại               | Convention                   | Ví dụ                               |
| ------------------ | ---------------------------- | ----------------------------------- |
| Folder             | `kebab-case`                 | `room-price`, `handle-booking`      |
| Biến / hàm         | `camelCase`                  | `roomPrice`, `handleBooking`        |
| Component folder   | `kebab-case`                 | `room-card`, `booking-form`         |
| File component     | `PascalCase.tsx`             | `RoomCard.tsx`                      |
| File non-component | `camelCase.ts`               | `booking.service.ts`, `useRooms.ts` |
| Constant           | `UPPER_SNAKE_CASE`           | `MAX_GUESTS`, `DEFAULT_PAGE_SIZE`   |
| Env variable       | `VITE_UPPER_SNAKE`           | `VITE_API_BASE_URL`                 |
| Interface / Type   | `PascalCase`                 | `BookingDto`, `ApiResponse`         |
| Enum + giá trị     | `PascalCase` + `UPPER_SNAKE` | `BookingStatus.IN_PROGRESS`         |
| Zustand store hook | `use[Name]Store`             | `useAuthStore`                      |
| React Query key    | từ `queryKeys.ts`            | `queryKeys.rooms.detail(id)`        |

### 5.3 Component

- Props interface đặt tên `[ComponentName]Props`.
- Logic phức tạp hoặc fetch data tách ra custom hook, không viết thẳng trong JSX.
- Dùng **named export** cho tất cả components.

```typescript
// ✅ Cấu trúc chuẩn
interface RoomCardProps {
  room: Room;
  onSelect?: (id: string) => void;
  isHighlighted?: boolean;
  className?: string;
}

export function RoomCard({ room, onSelect, isHighlighted = false, className }: RoomCardProps) {
  return (
    <div className={cn('...', isHighlighted && 'ring-2 ring-brand', className)}>
      {/* content */}
    </div>
  );
}
```

### 5.4 Custom Hooks

- Tên bắt đầu bằng `use`.
- Mỗi hook làm **một việc** rõ ràng.
- **Tách từng custom hook theo từng API — MỖI ENDPOINT = MỘT FILE RIÊNG.** Không bao giờ gom nhiều hook/nhiều API vào chung một file kiểu `useAccount.ts` hay `use-bookings.ts`. Tham khảo `hooks/auth/` làm chuẩn.
- **Quy tắc tổ chức thư mục (bắt buộc làm y hệt mỗi lần):**
  1. Mỗi domain là một thư mục con `kebab-case` trong `hooks/` (vd: `hooks/account/`, `hooks/bookings/`, `hooks/hotel-verify/`).
  2. Mỗi hook (mỗi API) là **một file `kebab-case` riêng**, đặt tên theo hook bên trong: `use-profile.ts`, `use-create-booking.ts`, `use-submit-registration.ts`.
  3. Mỗi thư mục domain có một `index.ts` làm barrel, re-export tất cả hook con: `export { useProfile } from './use-profile';`.
  4. Query keys dùng chung của domain tách ra file `keys.ts` trong thư mục đó (vd: `hooks/hotel-verify/keys.ts`) và export qua `index.ts`.
  5. **Import luôn qua barrel của thư mục** (`@/hooks/account`), KHÔNG import thẳng vào từng file (`@/hooks/account/use-profile`).
- Khi gặp một file gom nhiều hook: tách mỗi hook ra file riêng theo các bước trên, xóa file cũ, rồi cập nhật **tất cả** đường dẫn import liên quan sang barrel của thư mục.
- Trả về object `{ data, isLoading, error }`, không trả về array trừ pair `[value, setValue]`.

```text
hooks/account/
├── index.ts                          # barrel: re-export tất cả hook bên dưới
├── use-profile.ts                    # 1 API = 1 file
├── use-update-profile.ts
├── use-loyalty.ts
├── use-notifications.ts
└── use-available-promotions.ts
```

```typescript
// hooks/account/use-profile.ts — một hook, một API
export function useProfile(seed: Partial<UserProfile>) {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => profileService.get(seed),
  });
}

// hooks/account/index.ts — barrel
export { useProfile } from './use-profile';
export { useUpdateProfile } from './use-update-profile';

// Nơi dùng — luôn import qua barrel của thư mục
import { useProfile, useUpdateProfile } from '@/hooks/account';
```

### 5.5 State management — quy tắc chọn

| Loại state                            | Công cụ                         |
| ------------------------------------- | ------------------------------- |
| Dữ liệu từ API (server state)         | **TanStack Query**              |
| Auth session, chat history, UI global | **Zustand**                     |
| Form state                            | `useState` hoặc React Hook Form |
| UI local (toggle, modal)              | `useState`                      |

> **Không** lưu dữ liệu API vào Zustand — đây là việc của TanStack Query.

### 5.6 Styling

- **TailwindCSS** là primary. Dùng `cn()` để merge class có điều kiện.
- Không dùng inline `style={{}}` trừ giá trị thực sự dynamic (animation transform, màu từ API).
- CSS custom chỉ trong `styles/` hoặc CSS Module khi Tailwind không đủ.
- Design tokens khai báo dưới dạng CSS variables trong `styles/index.css`.

```typescript
import { cn } from '@/utils/cn';

<div className={cn('rounded-lg p-4', isActive && 'bg-brand/10', className)} />
```

### 5.7 Error handling

- Mọi mutation phải có `onError` hiển thị toast.
- Pages phải xử lý `isError` từ React Query (hiển thị error state, không crash).
- Không để `console.log` / `console.error` trong code commit.

### 5.8 Accessibility (a11y)

- Mọi `<img>` phải có `alt`.
- Dùng semantic HTML: `<button>` cho action, `<a>` cho navigation.
- Form fields phải có `<label>` liên kết đúng.
- Interactive elements accessible bằng bàn phím (focus visible).

---

## 6. Quy ước Git & Commit

### Branching

```
main        ← production-ready, chỉ merge từ develop qua PR
develop     ← integration branch, base cho mọi feature
feature/*   ← tính năng mới
fix/*       ← bug fix
chore/*     ← config, dependencies
docs/*      ← tài liệu
```

Ví dụ: `feature/guest-chatbot-ui`, `fix/booking-date-picker`

- Không push thẳng lên `main` hay `develop`.
- Branch từ `develop`, merge về `develop`.

### Commit message (Conventional Commits)

```
<type>(<scope>): <mô tả ngắn>
```

**Types:** `feat` | `fix` | `style` | `refactor` | `test` | `chore` | `docs`

**Scope** = portal hoặc module: `guest`, `staff`, `marketing`, `manager`, `admin`, `chatbot`, `auth`, `ui`

```
feat(guest): add AI chatbot streaming message UI
fix(booking): correct date range validation edge case
chore(deps): upgrade TailwindCSS to v4
refactor(ui): extract Button variants to CVA
```

### Pull Request

- 1 PR = 1 mục đích rõ ràng.
- Yêu cầu ít nhất **1 approve** trước khi merge.
- CI (lint + type-check + test) phải xanh.
- Squash & merge vào `develop`.

---

## 7. Kiến trúc & luồng dữ liệu

```
Page (route component)
  └── gọi custom hook (useXxx)
        └── TanStack Query  /  Zustand store
              └── Axios instance  (services/api.ts)
                    └── Backend REST API
```

### Luồng AI Chatbot (streaming)

```
ChatPage
  └── useChat() hook
        ├── chatStore (Zustand) — lưu message history
        └── ai.service.sendMessage()
              └── POST /ai/chat  →  SSE stream
                    → parse từng chunk token
                    → append vào chatStore
                    → re-render ChatWindow realtime
```

### Auth flow

```
LoginPage → authService.login() → lưu JWT vào authStore
  → axios interceptor tự gắn Authorization header
  → ProtectedRoute kiểm tra role → redirect đúng portal
  → token hết hạn: interceptor tự refresh hoặc redirect /login
```

---

## 8. Hướng dẫn cho AI Agent

> Đọc section này trước khi sinh code cho dự án SmartStay AI frontend.

### Nguyên tắc bắt buộc

1. **TypeScript strict** — không dùng `any`, không bỏ qua lỗi type.
2. **Không fetch API trong component** — phải qua `services/` rồi custom hook.
3. **Server state = TanStack Query** — không lưu API data vào Zustand.
4. **Import alias `@/`** trỏ về `src/` — dùng thay cho relative path dài.
5. **Đặt file đúng thư mục** theo cấu trúc ở mục 2.
6. **Luôn để type/interface trong thư mục `types/`** — mọi `interface`/`type` dùng chung (DTO, payload, entity, props chia sẻ) phải khai báo trong file tương ứng ở `src/types/` (vd: `auth.types.ts`), không định nghĩa rải rác trong service/hook/component.
7. **Tách từng custom hook theo từng API** — mỗi endpoint một hook riêng (`useLoginMutation`, `useSendOtpMutation`, …), không gom nhiều API vào một hook tổng kiểu `useAuth`. Xem mục 5.4.

### Template: Component mới

```typescript
import { cn } from '@/utils/cn';

interface MyComponentProps {
  className?: string;
  // định nghĩa props đầy đủ, không dùng any
}

export function MyComponent({ className }: MyComponentProps) {
  return (
    <div className={cn('...', className)}>
      {/* content */}
    </div>
  );
}
```

### Template: Service mới

```typescript
import { api } from './api';
import type { MyEntity, CreateMyEntityDto } from '@/types/my.types';

export const myService = {
  async getAll(): Promise<MyEntity[]> {
    const { data } = await api.get('/my-entities');
    return data;
  },
  async create(dto: CreateMyEntityDto): Promise<MyEntity> {
    const { data } = await api.post('/my-entities', dto);
    return data;
  },
};
```

### Template: Custom hook với React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { myService } from '@/services/my.service';

export function useMyEntities() {
  return useQuery({
    queryKey: queryKeys.myEntities.all(),
    queryFn: myService.getAll,
  });
}

export function useCreateMyEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: myService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myEntities.all() });
    },
  });
}
```

### Template: Zustand store

```typescript
import { create } from 'zustand';

interface MyStore {
  value: string;
  setValue: (v: string) => void;
  reset: () => void;
}

export const useMyStore = create<MyStore>(set => ({
  value: '',
  setValue: value => set({ value }),
  reset: () => set({ value: '' }),
}));
```

### Checklist trước khi commit

- [ ] `pnpm type-check` — không có lỗi TypeScript
- [ ] `pnpm lint` — không có lỗi ESLint
- [ ] Không còn `console.log` / `console.error`
- [ ] Không dùng `any` chưa có lý do
- [ ] File đặt đúng thư mục
- [ ] Props interface tên `[Name]Props`
- [ ] Fetch data qua service + hook, không gọi axios trong component
- [ ] Mutation có `onError` handler

---

## 9. Biến môi trường

Tất cả env variable cho Vite phải có prefix `VITE_`.  
File `.env` **không commit** (có trong `.gitignore`).

### `.env.example`

```bash
# API
VITE_API_BASE_URL=http://localhost:3001/api

# App
VITE_APP_NAME=SmartStay AI
VITE_BASE_PATH=/

# Firebase Cloud Messaging
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Feature flags
VITE_FEATURE_LOYALTY=true
VITE_FEATURE_SOCIAL_SCHEDULING=false
```

Truy cập trong code:

```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

---

## Dependencies chính

| Package                             | Mục đích                                |
| ----------------------------------- | --------------------------------------- |
| `react` + `react-dom`               | UI framework                            |
| `react-router` v7                   | Client-side routing                     |
| `@tanstack/react-query`             | Server state & data fetching            |
| `@tanstack/react-table`             | Data table (Staff, Admin portals)       |
| `zustand`                           | Global client state                     |
| `axios`                             | HTTP client                             |
| `tailwindcss` + `@tailwindcss/vite` | Utility-first CSS + Vite integration    |
| `clsx` + `tailwind-merge`           | Class merging (`cn()` helper)           |
| `class-variance-authority`          | Variant-based styling for UI components |
| `tw-animate-css`                    | Animation utilities for Tailwind        |
| `zod`                               | Schema validation                       |
| `date-fns`                          | Date utilities                          |
| `lucide-react`                      | Icon library                            |
| `recharts`                          | Charts (analytics dashboards)           |
| `radix-ui`                          | UI primitives                           |
| `shadcn`                            | shadcn/ui CLI + component registry      |
| `@fontsource-variable/geist`        | Variable font for typography            |

---

## Tiến độ phát triển

Mỗi lần prompt code phải cập nhật tiến độ vào file PROGRESS.md (important!).

_Cập nhật file này khi có thay đổi cấu trúc dự án, quy ước mới, hoặc dependency quan trọng được thêm vào._
