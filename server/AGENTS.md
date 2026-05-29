# AGENTS.md — SmartStay AI · Backend

> **SmartStay AI** — AI-Powered Hotel Booking and Customer Engagement Platform  
> Stack: **Node.js + Express + TypeScript + PostgreSQL + Prisma**

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

SmartStay AI backend là RESTful API service viết bằng Node.js, Express, và TypeScript. Dự án sử dụng PostgreSQL làm cơ sở dữ liệu chính được quản lý và thao tác thông qua **Prisma ORM**.

**Các tính năng cốt lõi của Backend:**
- Xác thực phân quyền (Auth & RBAC) thông qua JWT, Passport.js và bcryptjs.
- Validation dữ liệu đầu vào mạnh mẽ sử dụng Joi tại tầng định tuyến (Routing).
- Tích hợp tài liệu hóa API tự động và tập trung bằng Swagger (thông qua `routes.yml` và `components.yml`).
- Quản lý Database & Migrations thông qua Prisma.
- Xử lý lỗi tập trung thông qua lớp middleware chuyên dụng, đảm bảo API luôn trả về định dạng đồng nhất.

---

## 2. Cấu trúc thư mục

```
src/
├── index.ts                    # Entry point (khởi chạy Server HTTP, kết nối DB & xử lý tín hiệu hệ thống)
├── app.ts                      # Cấu hình Express App (middlewares, routes, central error handler)
│
├── config/                     # Cấu hình hệ thống & Khởi tạo biến môi trường
│   ├── config.ts               # Phân tích cú pháp env bằng Joi
│   ├── logger.ts               # Cấu hình logging Winston
│   ├── morgan.ts               # Logger HTTP request
│   ├── passport.ts             # Chiến lược bảo mật Passport-JWT
│   ├── prisma.ts               # Khởi tạo Prisma Client sử dụng pg pool
│   ├── roles.ts                # Định nghĩa hệ thống quyền và Roles
│   └── tokens.ts               # Định nghĩa các loại token (ACCESS, REFRESH, RESET_PASSWORD, VERIFY_EMAIL)
│
├── routes/                     # Định nghĩa Routes của ứng dụng (chia theo version)
│   └── v1/
│       ├── index.ts            # Gom nhóm và đăng ký routes v1
│       ├── auth.route.ts
│       ├── user.route.ts
│       └── docs.route.ts       # Swagger UI router
│
├── controllers/                # Xử lý Request/Response (không chứa logic nghiệp vụ)
│   ├── index.ts
│   ├── auth.controller.ts
│   └── user.controller.ts
│
├── services/                   # Tầng chứa logic nghiệp vụ và giao tiếp với Database thông qua Prisma
│   ├── index.ts
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── token.service.ts
│   └── email.service.ts
│
├── validations/                # Joi schemas để kiểm tra tính hợp lệ của dữ liệu đầu vào
│   ├── index.ts
│   ├── auth.validation.ts
│   ├── user.validation.ts
│   └── custom.validation.ts    # Validation tùy biến (ví dụ: kiểm tra password mạnh, objectId)
│
├── middlewares/                # Express Middlewares
│   ├── auth.ts                 # Xác thực & Phân quyền dựa trên Roles
│   ├── validate.ts             # Middleware chạy kiểm tra dữ liệu bằng Joi
│   ├── error.ts                # Định dạng và xử lý lỗi tập trung
│   └── rateLimiter.ts          # Giới hạn số lượng request phòng tránh DDoS
│
├── docs/                       # Thư mục chứa tài liệu API Swagger tập trung
│   ├── swaggerDef.ts           # Cấu hình chung Swagger (servers, info, license)
│   ├── components.yml          # Định nghĩa cấu trúc Schema thực thể dùng chung (User, Token, Error, v.v.)
│   └── routes.yml              # Định nghĩa endpoints, request body, parameters, responses
│
├── utils/                      # Lớp tiện ích dùng chung
│   ├── ApiError.ts             # Lớp chuẩn hóa lỗi Custom Error kế thừa từ Error
│   ├── catchAsync.ts           # Wrapper loại bỏ block try-catch lặp lại trong controllers
│   └── pick.ts                 # Helper lọc lấy các trường cụ thể từ Object (dành cho bộ lọc & phân trang)
│
└── types/                      # Định nghĩa types của TypeScript
    └── declarations.d.ts
```

---

## 3. Hướng dẫn cài đặt & chạy Dev

Dự án yêu cầu cài đặt Node.js từ phiên bản 12 trở lên.

1. **Cài đặt các gói phụ thuộc:**
   ```bash
   npm install
   ```
2. **Thiết lập cơ sở dữ liệu:**
   Đảm bảo biến `DATABASE_URL` trong `.env` trỏ đúng vào cơ sở dữ liệu PostgreSQL của bạn.
   Chạy đồng bộ cơ sở dữ liệu:
   ```bash
   npx prisma db push
   ```
3. **Khởi chạy ứng dụng trong chế độ Development:**
   ```bash
   npm run dev
   ```
   *Lưu ý: Chế độ dev đã được cấu hình chạy qua **nodemon** và **tsx**, tự động tải lại server khi bạn thay đổi các tệp mã nguồn `.ts`, `.json` hoặc tài liệu Swagger `.yml`.*

4. **Tải dữ liệu mẫu (Seed) nếu cần:**
   ```bash
   npx prisma db seed
   ```

---

## 4. Hướng dẫn Build

Biên dịch mã nguồn TypeScript thành JavaScript thuần phục vụ môi trường Production:
```bash
npm run build
```
Mã nguồn đã biên dịch sẽ nằm trong thư mục `/dist`. Bạn có thể chạy production server bằng lệnh:
```bash
npm start
```

---

## 5. Quy ước code

- **Tên tệp tin:** Sử dụng chữ thường phân cách bằng dấu chấm (kebab-case + extension) tương ứng với vai trò của tệp:
  - Ví dụ: `auth.controller.ts`, `user.service.ts`, `auth.validation.ts`, `user.route.ts`.
- **TypeScript strict:** Không bao giờ sử dụng `any`. Khai báo kiểu dữ liệu rõ ràng cho tất cả tham số đầu vào và kiểu trả về của hàm.
- **Async/Await:** Sử dụng cú pháp `async/await` thay vì Promise chaining truyền thống.
- **Database:** Mọi hành vi giao tiếp với CSDL phải đi qua **Prisma Client** thông qua `prisma` import từ `@/config/prisma`.

---

## 6. Quy ước Git & Commit

Định dạng commit message theo chuẩn **Conventional Commits**:
```
<type>(<scope>): <mô tả ngắn>
```

**Types:** `feat` | `fix` | `refactor` | `docs` | `test` | `chore` | `style`

**Scope** = tên chức năng hoặc thư mục: `auth`, `user`, `booking`, `database`, `swagger`, `middleware`

*Ví dụ:*
- `feat(auth): add register with email OTP verification`
- `fix(user): resolve query filters for inactive accounts`
- `refactor(database): migrate user sessions table structure via Prisma`
- `docs(swagger): extract routes definitions into centralized routes.yml`

---

## 7. Kiến trúc & luồng dữ liệu

Mô hình kiến trúc đi qua các lớp phân tách rõ rệt:

```
Request → Route (Mount validate middleware)
            └── Controller (Lấy dữ liệu & chuyển tiếp gọi Service thông qua catchAsync)
                  └── Service (Xử lý logic nghiệp vụ & Giao tiếp Database qua Prisma)
                        └── Trả về dữ liệu cho Controller → Phản hồi HTTP Response
```

### Xử lý lỗi (Error Handling Flow):
Mọi lỗi phát sinh trong luồng nghiệp vụ sẽ được ném ra qua `throw new ApiError(status, message)`.
Nhờ việc bọc các Controller bằng `catchAsync`, các lỗi này sẽ tự động chuyển tiếp đến lớp Middleware xử lý lỗi cuối cùng (`src/middlewares/error.ts`) để định dạng thành JSON đồng nhất trước khi trả về Client.

---

## 8. Hướng dẫn cho AI Agent

> Đọc và tuân thủ tuyệt đối quy trình và các mẫu code sau trước khi sinh/sửa đổi code backend.

### Nguyên tắc bắt buộc

1. **Tách biệt Logic nghiệp vụ:** Controller **không** được chứa logic nghiệp vụ hay truy vấn SQL/Prisma trực tiếp. Controller chỉ chịu trách nhiệm phân tích request đầu vào (params, query, body), gọi tới Service tương ứng và định dạng kết quả trả về.
2. **Validate chặt chẽ:** Mọi API endpoint nhận dữ liệu đầu vào đều phải được đăng ký schema validation tương ứng dùng **Joi** ở tầng routing bằng cách gắn middleware `validate(schema)`.
3. **Sử dụng Prisma an toàn:** Không gọi trực tiếp `PrismaClient` mới trong các file, luôn import và sử dụng Prisma instance được quản lý và cấu hình tập trung từ `@/config/prisma`.
4. **Không viết chèn try-catch lặp lại:** Luôn sử dụng wrapper `catchAsync()` bọc quanh các method của controller.
5. **Cập nhật Swagger đồng thời:** Khi tạo/thay đổi bất kỳ endpoint nào, bạn phải cập nhật các định nghĩa routes tương ứng trong **`src/docs/routes.yml`** để tài liệu API luôn luôn chuẩn xác.

### Template: Service mới

```typescript
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import type { User, Prisma } from '@prisma/client';

/**
 * Tạo một bản ghi người dùng mới
 * @param {Prisma.UserCreateInput} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody: Prisma.UserCreateInput): Promise<User> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: userBody.email },
  });
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return prisma.user.create({
    data: userBody,
  });
};

export default {
  createUser,
};
```

### Template: Controller mới

```typescript
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import userService from '../services/user.service';

const createUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send({ user });
});

export default {
  createUser,
};
```

### Template: Validation Schema (Joi) mới

```typescript
import Joi from 'joi';
import { password } from './custom.validation';

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid('user', 'admin'),
  }),
};

export default {
  createUser,
};
```

### Template: Route mới

```typescript
import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import userValidation from '../../validations/user.validation';
import userController from '../../controllers/user.controller';

const router = express.Router();

router
  .route('/')
  .post(auth('manageUsers'), validate(userValidation.createUser), userController.createUser);

export default router;
```

### Checklist trước khi commit

- [ ] Dự án build thành công (`npm run build`) không có lỗi TypeScript compilation.
- [ ] Chạy linting (`npm run lint`) sạch lỗi.
- [ ] Logic nghiệp vụ đặt trong `services/`, không đặt trong `controllers/`.
- [ ] Endpoint mới đã được gắn validation bằng Joi tương ứng.
- [ ] Tài liệu Swagger của API mới đã được khai báo đầy đủ trong `src/docs/routes.yml`.
- [ ] Không sử dụng kiểu dữ liệu `any`.

---

## 9. Biến môi trường

Toàn bộ các biến môi trường cấu hình cho Backend được khai báo tại tệp `.env` (không commit).

### `.env.example`

```bash
# Cổng chạy ứng dụng
PORT=3000

# Môi trường chạy dự án (development / production / test)
NODE_ENV=development

# Địa chỉ kết nối PostgreSQL dành cho Prisma
DATABASE_URL="postgresql://username:password@localhost:5432/smartstay_db?schema=public"

# Cấu hình bảo mật JWT
JWT_SECRET=thisisasupersecretkeyforjwttokengeneration
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30
JWT_RESET_PASSWORD_EXPIRATION_MINUTES=10
JWT_VERIFY_EMAIL_EXPIRATION_MINUTES=10

# Cấu hình SMTP Email Service
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
EMAIL_FROM=support@smartstayai.com
```
