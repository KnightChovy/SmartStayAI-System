# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> SmartStay AI — nền tảng đặt phòng khách sạn tích hợp AI. Đây là **monorepo** gồm 3 package độc lập (không có workspace chung): mỗi package có `package.json`, `node_modules`, và file `AGENTS.md` riêng. Trả lời và viết tài liệu bằng **tiếng Việt**.

## Cấu trúc monorepo

| Thư mục | Stack | Trạng thái | Tài liệu chi tiết |
|---------|-------|-----------|-------------------|
| `server/` | Node + Express + TypeScript + Prisma + PostgreSQL | Đang phát triển (auth/user xong) | **`server/AGENTS.md`** |
| `client/` | Vite + React 19 + TypeScript + TanStack Query + Zustand + Tailwind | Đang phát triển (guest portal) | **`client/AGENTS.md`** |
| `mobile/` | — | Chỉ là placeholder (`index.txt`), chưa có code | — |

> **Quan trọng:** Mỗi package có quy ước code, kiến trúc, template và checklist riêng trong `AGENTS.md` của nó. Trước khi sửa code trong `server/` hay `client/`, ĐỌC `AGENTS.md` tương ứng — đó là nguồn chuẩn (source of truth) về convention, file này chỉ là bản đồ tổng. Riêng `server/` còn có `server/PROMPT_PLAYBOOK.md` (khuôn dựng prompt cho từng feature).

## Lệnh thường dùng

Mỗi package chạy lệnh trong thư mục của nó (hoặc dùng `--prefix`).

### server/
```bash
npm install --prefix server
npm run dev --prefix server      # nodemon + tsx, hot-reload .ts/.json/.yml
npm run build --prefix server    # tsc → dist/
npm start --prefix server        # chạy dist/index.js (production)
npm run lint --prefix server     # eslint (xem lưu ý bên dưới)
npx prisma db push               # đồng bộ schema (chạy trong server/)
npx prisma db seed               # nạp dữ liệu mẫu (tsx prisma/seed.ts)
```
Chạy **một file test** (Jest): `npx jest tests/integration/auth.test.js` (trong `server/`).
Chạy test theo tên: `npx jest -t "tên test"`.

### client/
```bash
npm install --prefix client
npm run dev --prefix client      # Vite dev server → http://localhost:5173
npm run build --prefix client    # tsc -b && vite build → dist/
npm run preview --prefix client  # preview bản build
npm run lint --prefix client     # ESLint (flat config, phủ .ts/.tsx)
```

## Kiến trúc xuyên suốt (đọc nhiều file mới hiểu)

**Hợp đồng client ↔ server là REST API.** Đây là điểm ráp nối quan trọng nhất giữa hai package:
- `server/` expose REST API version-hoá dưới `/v1` (vd `/v1/auth/login`), tài liệu Swagger tại `/v1/docs`.
- `client/` gọi qua một axios instance trung tâm (`client/src/lib/api.ts`), base URL lấy từ env `VITE_API_BASE_URL`. Mọi lời gọi API đi qua tầng `client/src/services/*`, rồi tới custom hook (TanStack Query) — không gọi axios trực tiếp trong component.

**Auth dùng JWT, chia sẻ ngữ nghĩa giữa 2 đầu:**
- Server: `access` token (ngắn hạn, Bearer header) + `refresh` token (lưu dạng **đã hash** trong bảng `user_sessions`). Passport-JWT strategy (`server/src/config/passport.ts`) verify access token và nạp user vào `req.user`. Phân quyền theo role qua `server/src/config/roles.ts` + middleware `auth()`.
- Client: lưu JWT vào `authStore` (Zustand), axios interceptor tự gắn `Authorization`, `ProtectedRoute` điều hướng theo role tới đúng portal (5 portal: guest/staff/marketing/manager/admin).

**Server theo kiến trúc phân tầng nghiêm ngặt:** `Route (Joi validate) → Controller (chỉ điều phối) → Service (business logic + Prisma) → PrismaClient tập trung`. Lỗi ném qua `ApiError` + `catchAsync`, gom về central error handler. Chi tiết và template trong `server/AGENTS.md`.

**Nguồn dữ liệu thật là PostgreSQL qua Prisma.** Toàn bộ schema (User, Booking, Hotel, Room, Payment, Review, AI/Conversation, Loyalty, Social...) nằm trong `server/prisma/schema.prisma` — một schema lớn ~40 model phản ánh toàn bộ domain. Mọi truy vấn DB đi qua `prisma` import từ `server/src/config/prisma.ts`.

## Lưu ý / điểm "lệch" cần biết (đã xác minh)

- **`server/README.md` đã lỗi thời**: nó mô tả kiến trúc cũ MongoDB/Mongoose, `app.js`/`models/`, port 5000. Code thực tế đã chuyển sang **Prisma/PostgreSQL + TypeScript** (`app.ts`, không còn `models/`). Tin theo `server/AGENTS.md` và `schema.prisma`, KHÔNG theo README.
- **Test tích hợp `server/tests/*.js` có thể đã hỏng**: chúng là JavaScript viết cho code Mongoose cũ; `jest.config.js` còn trỏ `src/app.js` (giờ là `app.ts`). Đừng giả định `npm test` xanh — kiểm tra trước khi dựa vào.
- **ESLint của `server/` cấu hình cho `.js`** (airbnb-base + prettier `**/*.js`), chưa phủ `.ts` → `npm run lint` trong server ít ý nghĩa với code TS hiện tại. Việc kiểm tra chất lượng TS thực chất dựa vào `npm run build` (tsc strict). Client thì ngược lại — ESLint flat config phủ đầy đủ `.tsx`.
- **`server/tsconfig.json`** dùng `moduleResolution: node` (đã deprecated ở TS 6/7); đã thêm `"ignoreDeprecations": "6.0"` để build chạy. Hướng lâu dài nên đổi sang `"bundler"`/`"node16"`.
- **`mongoose` vẫn là dependency của server** nhưng chỉ còn dùng cho việc nhận diện kiểu lỗi trong `middlewares/error.ts`; biến env `MONGODB_URL` đã chuyển thành optional.

## Quy ước chung (cả 2 package)

- **TypeScript `strict`, không dùng `any`** — luật bắt buộc ở cả client và server.
- **Conventional Commits** với scope theo module/portal: `feat(auth): ...`, `fix(guest): ...`, `refactor(database): ...`.
- **`.env` không commit**; server đọc env qua Joi (`server/src/config/config.ts`), client yêu cầu prefix `VITE_`.
- Khi sửa client, cập nhật `client/PROGRESS.md` (theo yêu cầu trong `client/AGENTS.md`). Khi thêm/đổi endpoint server, cập nhật Swagger trong `server/src/docs/`.
