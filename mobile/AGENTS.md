# AGENTS.md — StayHub · Mobile

> **StayHub** — AI-Powered Hotel Booking and Customer Engagement Platform
> Stack: **Expo SDK 56 + Expo Router + React Native 0.85 + TypeScript + NativeWind 4**

> ⚠️ **Expo ĐÃ THAY ĐỔI.** Đọc đúng docs theo phiên bản tại
> https://docs.expo.dev/versions/v56.0.0/ **trước khi** viết bất kỳ code nào.
> Không suy đoán API theo trí nhớ — Expo Router, expo-image, reanimated v4… có
> breaking change giữa các SDK.

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Hướng dẫn cài đặt & chạy Dev](#3-hướng-dẫn-cài-đặt--chạy-dev)
4. [Hướng dẫn Build (EAS)](#4-hướng-dẫn-build-eas)
5. [Quy ước code](#5-quy-ước-code)
6. [Quy ước Git & Commit](#6-quy-ước-git--commit)
7. [Kiến trúc & luồng dữ liệu](#7-kiến-trúc--luồng-dữ-liệu)
8. [Hướng dẫn cho AI Agent](#8-hướng-dẫn-cho-ai-agent)
9. [Biến môi trường](#9-biến-môi-trường)

---

## 1. Tổng quan dự án

StayHub mobile là ứng dụng **React Native (Expo)** dành cho **khách đặt phòng
(Guest/Customer)** — bản đồng hành của web frontend trong cùng monorepo. App dùng
**Expo Router** (file-based routing) và gọi chung **REST API backend** với client web.

> Khác với web (5 role-based portal), app mobile tập trung vào trải nghiệm **khách
> hàng**: tìm & đặt phòng, quản lý booking, e-voucher, loyalty, và **AI Booking
> Chatbot**. Các portal vận hành (Staff/Manager/Admin/Hotel-Partner) vẫn ở web.

**Các tính năng AI nổi bật trên mobile:**

- AI Booking Chatbot (streaming chat UI)
- Sentiment badge trên reviews
- Smart push notifications (Expo Notifications)

**Nền tảng:** iOS + Android (và Web qua `react-native-web` cho dev/preview).

---

## 2. Cấu trúc thư mục

Routing theo **Expo Router** — mọi file trong `src/app/` là một route. `app.json`
trỏ `main: "expo-router/entry"`; `metro.config.js` đã bọc `withNativeWind`.

```
src/
├── app/                        # ⬅️ FILE-BASED ROUTING (Expo Router)
│   ├── _layout.tsx             # Root layout: providers (Query, theme), import "../../global.css"
│   ├── index.tsx               # Splash / entry redirect
│   │
│   ├── (auth)/                 # Group: không xuất hiện trong URL
│   │   ├── _layout.tsx         # Stack cho luồng auth
│   │   ├── login.tsx
│   │   └── register.tsx
│   │
│   ├── (tabs)/                 # Group: bottom tab navigator cho guest
│   │   ├── _layout.tsx         # Tabs (Home, Search, Bookings, Chat, Profile)
│   │   ├── index.tsx           # Home
│   │   ├── search.tsx
│   │   ├── bookings.tsx        # My bookings
│   │   ├── chat.tsx            # AI chatbot
│   │   └── profile.tsx
│   │
│   ├── hotel/
│   │   └── [id].tsx            # Dynamic route — hotel/room detail
│   ├── booking/
│   │   ├── [id].tsx
│   │   ├── checkout.tsx
│   │   └── payment-result.tsx
│   └── +not-found.tsx          # Catch-all 404
│
├── components/
│   ├── ui/                     # Primitives (Button, Input, Card, Modal, …) — Gluestack-ui
│   │
│   ├── shared/                 # Dùng chung nhiều màn hình
│   │   ├── AppHeader/
│   │   ├── RoomCard/
│   │   ├── BookingStatusBadge/
│   │   ├── StarRating/
│   │   ├── DateRangePicker/
│   │   └── SentimentBadge/     # AI sentiment indicator
│   │
│   ├── guest/
│   │   ├── ChatWindow/         # AI chatbot streaming UI
│   │   ├── RoomSearchForm/
│   │   ├── BookingSummary/
│   │   └── VoucherCard/        # QR e-voucher display
│   │
│   └── ...                     # mỗi domain một thư mục con kebab-case
│
├── hooks/                      # Custom hooks — MỖI ENDPOINT = MỘT FILE RIÊNG
│   ├── auth/
│   │   ├── index.ts            # barrel
│   │   ├── use-login.ts
│   │   └── use-register.ts
│   ├── rooms/
│   ├── bookings/
│   ├── payments/
│   ├── reviews/
│   ├── chat/                   # Chatbot hooks
│   └── ai/
│
├── services/                   # Tầng gọi API (HTTP), không chứa logic UI
│   ├── api.ts                  # Axios instance + interceptors (lib)
│   ├── auth.service.ts
│   ├── room.service.ts
│   ├── booking.service.ts
│   ├── payment.service.ts
│   ├── review.service.ts
│   └── ai.service.ts
│
├── stores/                     # Zustand global state
│   ├── authStore.ts            # persist qua expo-secure-store / AsyncStorage
│   ├── chatStore.ts
│   └── uiStore.ts
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
├── lib/
│   ├── api.ts                  # Axios instance + interceptors
│   ├── cn.ts                   # Class name merge helper (clsx + tailwind-merge)
│   ├── storage.ts              # Wrapper SecureStore / AsyncStorage
│   └── logger.ts               # Wrapper console, mở rộng được (Sentry) sau này
│
├── constants/
│   ├── roles.ts                # UserRole enum
│   ├── routes.ts               # Route path constants (Expo Router href)
│   └── queryKeys.ts            # TanStack Query key factory
│
├── validations/                # Zod schemas cho form
│   ├── auth.validation.ts
│   ├── booking.validation.ts
│   └── ai.validation.ts
│
├── utils/
│   ├── formatDate.ts
│   └── formatCurrency.ts       # VND + USD
│
└── hooks/ui/                   # Hooks UI thuần (useColorScheme, useKeyboard, …)

global.css                      # @tailwind base/components/utilities (NativeWind input)
tailwind.config.js              # content: ["./src/**/*.{ts,tsx}"], preset nativewind
nativewind-env.d.ts             # /// <reference types="nativewind/types" /> + declare module "*.css"
```

> **Lưu ý Expo Router:** chỉ những file dưới `src/app/` mới là route. Components,
> hooks, services… đặt **ngoài** `app/` để Router không hiểu nhầm thành màn hình.

---

## 3. Hướng dẫn cài đặt & chạy Dev

### Yêu cầu

- **Node.js** >= 20.x
- **npm** >= 10.x
- **Expo Go** (iOS/Android) hoặc **dev build**; Xcode / Android Studio cho simulator/emulator.

### Cài đặt

```bash
cd mobile
npm install
```

### Cấu hình môi trường

```bash
cp .env.example .env
# Điền EXPO_PUBLIC_API_BASE_URL và các key cần thiết
```

### Chạy dev server

```bash
npx expo start            # mở Metro + QR code
# nhấn  i = iOS sim, a = Android emulator, w = web
```

### Các lệnh thường dùng

```bash
npm run start        # expo start (Metro bundler)
npm run android      # expo start --android
npm run ios          # expo start --ios
npm run web          # expo start --web
npm run lint         # expo lint
npx tsc --noEmit     # type-check, không emit
npx expo-doctor      # kiểm tra version mismatch của SDK 56
```

> Sau khi đổi `app.json`, native config, hoặc thêm thư viện có native code → cần
> rebuild dev client (không hot-reload được). `npx expo start -c` để xoá cache Metro.

---

## 4. Hướng dẫn Build (EAS)

App dùng **EAS Build** (không build local thủ công).

```bash
npm i -g eas-cli
eas login
eas build --profile preview   --platform android   # APK preview
eas build --profile production --platform all        # store build
```

- Profiles khai báo trong `eas.json`.
- Biến runtime: chỉ `EXPO_PUBLIC_*` mới lộ ra JS bundle; secret build-time đặt trong
  EAS Secrets, **không** commit.
- OTA update qua `eas update` (nếu bật `expo-updates`).

---

## 5. Quy ước code

### 5.1 TypeScript

- **`strict: true`** — không tắt bất kỳ strict flag nào (kế thừa `expo/tsconfig.base`).
- **Không dùng `any`**. Nếu bắt buộc, ghi `// eslint-disable-next-line` kèm lý do.
- **Không dùng `as` ép kiểu bừa bãi**. Dùng type guard hoặc Zod để validate dữ liệu ngoài.
- Dùng `interface` cho object shape, `type` cho union/intersection/utility types.

### 5.2 Đặt tên

| Loại               | Convention                   | Ví dụ                                |
| ------------------ | ---------------------------- | ------------------------------------ |
| Folder             | `kebab-case`                 | `room-card`, `handle-booking`        |
| Biến / hàm         | `camelCase`                  | `roomPrice`, `handleBooking`         |
| Component folder   | `kebab-case`                 | `room-card`, `booking-form`          |
| File component     | `PascalCase.tsx`             | `RoomCard.tsx`                       |
| **Route file**     | `kebab-case` / `[param]`     | `payment-result.tsx`, `[id].tsx`     |
| File non-component | `camelCase.ts` / `kebab`     | `booking.service.ts`, `use-rooms.ts` |
| Constant           | `UPPER_SNAKE_CASE`           | `MAX_GUESTS`, `DEFAULT_PAGE_SIZE`    |
| Env variable       | `EXPO_PUBLIC_UPPER_SNAKE`    | `EXPO_PUBLIC_API_BASE_URL`           |
| Interface / Type   | `PascalCase`                 | `BookingDto`, `ApiResponse`          |
| Enum + giá trị     | `PascalCase` + `UPPER_SNAKE` | `BookingStatus.IN_PROGRESS`          |
| Zustand store hook | `use[Name]Store`             | `useAuthStore`                       |
| React Query key    | từ `queryKeys.ts`            | `queryKeys.rooms.detail(id)`         |

> **Route default export:** mỗi file trong `app/` phải **`export default`** một
> component (yêu cầu của Expo Router). Đây là ngoại lệ duy nhất của quy tắc
> "named export" bên dưới.

### 5.3 Component

- Props interface đặt tên `[ComponentName]Props`.
- Logic phức tạp hoặc fetch data tách ra custom hook, không viết thẳng trong JSX.
- Dùng **named export** cho components dùng lại (ngoại lệ: route screens trong `app/`
  bắt buộc `export default`).

```tsx
import { View, Text, Pressable } from 'react-native';
import { cn } from '@/lib/cn';

interface RoomCardProps {
  room: Room;
  onSelect?: (id: string) => void;
  isHighlighted?: boolean;
  className?: string;
}

export function RoomCard({
  room,
  onSelect,
  isHighlighted = false,
  className,
}: RoomCardProps) {
  return (
    <Pressable
      onPress={() => onSelect?.(room.id)}
      className={cn(
        'rounded-lg p-4 bg-white',
        isHighlighted && 'ring-2 ring-brand',
        className,
      )}
    >
      <Text className="text-base font-semibold">{room.name}</Text>
    </Pressable>
  );
}
```

### 5.4 Custom Hooks

- Tên bắt đầu bằng `use`.
- Mỗi hook làm **một việc** rõ ràng.
- **Tách từng custom hook theo từng API — MỖI ENDPOINT = MỘT FILE RIÊNG.** Không bao
  giờ gom nhiều hook/nhiều API vào chung một file kiểu `useAccount.ts`. Tham khảo
  `hooks/auth/` làm chuẩn.
- **Quy tắc tổ chức thư mục (bắt buộc làm y hệt mỗi lần):**
  1. Mỗi domain là một thư mục con `kebab-case` trong `hooks/` (vd: `hooks/bookings/`).
  2. Mỗi hook (mỗi API) là **một file `kebab-case` riêng**: `use-create-booking.ts`.
  3. Mỗi thư mục domain có một `index.ts` làm barrel, re-export tất cả hook con.
  4. Query keys dùng chung của domain tách ra file `keys.ts` trong thư mục đó.
  5. **Import luôn qua barrel của thư mục** (`@/hooks/bookings`), KHÔNG import thẳng
     vào từng file.
- Khi gặp file gom nhiều hook: tách mỗi hook ra file riêng, xóa file cũ, cập nhật
  **tất cả** import liên quan sang barrel.
- Trả về object `{ data, isLoading, error }`, không trả array trừ pair `[value, setValue]`.

```ts
// hooks/bookings/use-create-booking.ts — một hook, một API
export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingService.create,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() }),
  });
}

// hooks/bookings/index.ts — barrel
export { useCreateBooking } from './use-create-booking';

// Nơi dùng — luôn import qua barrel
import { useCreateBooking } from '@/hooks/bookings';
```

### 5.5 State management — quy tắc chọn

| Loại state                            | Công cụ                           |
| ------------------------------------- | --------------------------------- |
| Dữ liệu từ API (server state)         | **TanStack Query**                |
| Auth session, chat history, UI global | **Zustand** (persist qua storage) |
| Form state                            | React Hook Form                   |
| UI local (toggle, modal)              | `useState`                        |

> **Không** lưu dữ liệu API vào Zustand — đây là việc của TanStack Query.
> Token auth lưu qua **`expo-secure-store`** (nhạy cảm), không để trong AsyncStorage thường.

### 5.6 Styling — NativeWind

- **NativeWind** (Tailwind cho React Native) là primary. Dùng `className`, **không**
  `style={{}}` trừ giá trị thực sự dynamic (animation transform, màu từ API).
- Dùng `cn()` (`@/lib/cn`) để merge class có điều kiện.
- `tailwind.config.js` phải có `content: ["./src/**/*.{js,jsx,ts,tsx}"]` — nếu thiếu
  path, class sẽ **không** được sinh ra.
- Import `global.css` **một lần** ở root `app/_layout.tsx`.
- Không phải mọi util web đều có trên RN (vd `space-x-*` cần `gap`); kiểm tra docs
  NativeWind khi class không ăn.

```tsx
import { cn } from '@/lib/cn';
<View className={cn('rounded-lg p-4', isActive && 'bg-brand/10', className)} />;
```

### 5.7 Error handling

- Mọi mutation phải có `onError` hiển thị toast (vd `sonner-native` / `react-native-toast`).
- Màn hình phải xử lý `isError` từ React Query (hiển thị error state, không crash).
- Không để `console.log` / `console.error` trong code commit (dùng `lib/logger`).

### 5.8 Native / Platform

- Component đặc thù nền tảng: dùng `Platform.select` hoặc file `.ios.tsx` / `.android.tsx`.
- Bọc nội dung bằng `SafeAreaView` (`react-native-safe-area-context`) cho notch/insets.
- Animation dùng `react-native-reanimated` v4 (đọc docs — API khác v2/v3).
- Ảnh dùng `expo-image` (không phải `Image` của RN) để có cache + placeholder.

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

Ví dụ: `feature/mobile-chatbot-ui`, `fix/booking-date-picker`

- Không push thẳng lên `main` hay `develop`. Branch từ `develop`, merge về `develop`.

### Commit message (Conventional Commits)

```
<type>(<scope>): <mô tả ngắn>
```

**Types:** `feat` | `fix` | `style` | `refactor` | `test` | `chore` | `docs`

**Scope** = module: `guest`, `booking`, `chatbot`, `auth`, `ui`, `nav`, `deps`

```
feat(chatbot): add streaming message UI on mobile
fix(booking): correct date range validation edge case
chore(deps): bump expo-router to ~56.2
```

### Pull Request

- 1 PR = 1 mục đích rõ ràng. Yêu cầu ít nhất **1 approve**.
- CI (lint + type-check) phải xanh. Squash & merge vào `develop`.

---

## 7. Kiến trúc & luồng dữ liệu

```
Screen (route trong app/)
  └── gọi custom hook (useXxx)
        └── TanStack Query  /  Zustand store
              └── Axios instance  (lib/api.ts)
                    └── Backend REST API (chung với web)
```

### Luồng AI Chatbot (streaming)

```
chat.tsx (tab)
  └── useChat() hook
        ├── chatStore (Zustand) — lưu message history
        └── ai.service.sendMessage()
              └── POST /conversations/messages/stream  →  SSE qua fetch
                    → parse từng chunk (meta / chunk / done)
                    → append vào chatStore
                    → re-render ChatWindow realtime
```

### Auth flow

```
(auth)/login → authService.login() → lưu token vào authStore (expo-secure-store)
  → axios interceptor tự gắn Authorization header
  → root _layout điều hướng theo trạng thái đăng nhập
  → token hết hạn: interceptor refresh hoặc đẩy về (auth)/login
```

---

## 8. Hướng dẫn cho AI Agent

> Đọc section này **và** docs Expo v56 trước khi sinh code cho mobile.

### Nguyên tắc bắt buộc

1. **Đọc docs Expo v56 trước** — không suy đoán API Router/SDK theo trí nhớ.
2. **TypeScript strict** — không dùng `any`, không bỏ qua lỗi type.
3. **Không fetch API trong component** — phải qua `services/` rồi custom hook.
4. **Server state = TanStack Query** — không lưu API data vào Zustand.
5. **Import alias `@/`** trỏ về `src/` — dùng thay cho relative path dài.
6. **Đặt file đúng thư mục** theo mục 2. Chỉ file trong `app/` mới là route.
7. **Route file `export default`; component khác `export` có tên.**
8. **Luôn để type/interface trong `types/`** — không định nghĩa rải rác.
9. **Tách từng custom hook theo từng API** — mỗi endpoint một hook riêng (mục 5.4).
10. **Style bằng NativeWind `className`**, không `StyleSheet`/inline trừ giá trị dynamic.

### Template: Screen mới (route)

```tsx
// app/hotel/[id].tsx
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useRoom } from '@/hooks/rooms';

export default function HotelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError } = useRoom(id);

  if (isLoading) return <Text className="p-4">Loading…</Text>;
  if (isError)
    return <Text className="p-4 text-error">Something went wrong</Text>;

  return (
    <View className="flex-1 p-4">
      <Text className="text-lg font-semibold">{data?.name}</Text>
    </View>
  );
}
```

### Template: Component mới

```tsx
import { View } from 'react-native';
import { cn } from '@/lib/cn';

interface MyComponentProps {
  className?: string;
  // định nghĩa props đầy đủ, không dùng any
}

export function MyComponent({ className }: MyComponentProps) {
  return <View className={cn('p-4', className)} />;
}
```

### Template: Service mới

```ts
import { api } from '@/lib/api';
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

```ts
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.myEntities.all() }),
  });
}
```

### Template: Zustand store

```ts
import { create } from 'zustand';

interface MyStore {
  value: string;
  setValue: (v: string) => void;
  reset: () => void;
}

export const useMyStore = create<MyStore>((set) => ({
  value: '',
  setValue: (value) => set({ value }),
  reset: () => set({ value: '' }),
}));
```

### Checklist trước khi commit

- [ ] `npx tsc --noEmit` — không có lỗi TypeScript
- [ ] `npm run lint` — không có lỗi ESLint
- [ ] `npx expo-doctor` — không có version mismatch (SDK 56)
- [ ] Không còn `console.log` / `console.error`
- [ ] Không dùng `any` chưa có lý do
- [ ] File đặt đúng thư mục; route file `export default`
- [ ] Props interface tên `[Name]Props`
- [ ] Fetch data qua service + hook, không gọi axios trong component
- [ ] Style bằng NativeWind `className`
- [ ] Mutation có `onError` handler

---

## 9. Biến môi trường

Mọi biến cần lộ ra JS bundle **phải** có prefix `EXPO_PUBLIC_`.
File `.env` **không commit** (có trong `.gitignore`). Secret thật để trong **EAS Secrets**.

### `.env.example`

```bash
# API
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api

# App
EXPO_PUBLIC_APP_NAME=StayHub

# Map (nếu dùng)
EXPO_PUBLIC_MAP_KEY=
```

Truy cập trong code:

```ts
const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
```

> ⚠️ `EXPO_PUBLIC_*` được nhúng vào bundle lúc build → **không** để secret thật ở đây.
> Đổi `.env` cần restart Metro (`npx expo start -c`).

---

## Dependencies chính

| Package                          | Mục đích                          |
| -------------------------------- | --------------------------------- |
| `expo` (~56) + `expo-router`     | Framework + file-based routing    |
| `react-native` + `react`         | UI framework                      |
| `nativewind` + `tailwindcss`     | Utility-first styling (className) |
| `@tanstack/react-query`          | Server state & data fetching      |
| `zustand`                        | Global client state               |
| `axios`                          | HTTP client                       |
| `zod` + `react-hook-form`        | Schema validation + forms         |
| `clsx` + `tailwind-merge`        | Class merging (`cn()` helper)     |
| `expo-image`                     | Ảnh có cache/placeholder          |
| `expo-secure-store`              | Lưu token an toàn                 |
| `react-native-reanimated` (v4)   | Animation                         |
| `react-native-safe-area-context` | Safe-area insets                  |
| `react-native-gesture-handler`   | Cử chỉ / navigation gestures      |
| `expo-notifications`             | Push notifications                |

> Cài thư viện Expo bằng `npx expo install <pkg>` (không phải `npm install`) để khớp
> đúng version với SDK 56.

---

## Tiến độ phát triển

Mỗi lần prompt code phải cập nhật tiến độ vào file `PROGRESS.md` (important!).

_Cập nhật file này khi có thay đổi cấu trúc dự án, quy ước mới, hoặc dependency quan trọng được thêm vào._
