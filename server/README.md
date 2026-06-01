# SmartStayAI - Hotel Booking Backend

Hệ thống backend API cho nền tảng đặt phòng khách sạn (SmartStayAI). Phiên bản này giữ nguyên cấu trúc phân tầng chuyên nghiệp nhiều lớp (Controller - Service - Validation), nhưng định hướng **code logic bên trong từng file sẽ được tinh giản và dễ hiểu nhất** để phù hợp tích hợp làm **đồ án môn học**. Dự án tích hợp sẵn **Swagger Docs** để xem API và **Unit Tests** để kiểm thử tự động.

## 1. Cấu trúc thư mục hệ thống

```text
server/
├── src/
│   ├── config/        # Cấu hình hệ thống (kết nối DB, quy định roles, passport JWT, biến môi trường)
│   ├── controllers/   # Tiếp nhận Request (req, res), gọi qua tầng Service và trả về Response HTTP
│   ├── docs/          # Tài liệu API (Swagger UI, định nghĩa YAML)
│   ├── middlewares/   # Các hàm trung gian: auth (xác thực), validate dữ liệu, bắt lỗi, rate limit
│   ├── models/        # Định nghĩa Cấu trúc dữ liệu DB (Mongoose Schema, Model, Pagination Plugins)
│   ├── routes/        # Định tuyến các API endpoint (phiên bản v1)
│   ├── services/      # Chứa Business logic (Xử lý tính toán đặt phòng, tạo user, sinh token...)
│   ├── utils/         # Các hàm tiện ích dùng chung nhiều nơi (Bắt lỗi catchAsync, format obj...)
│   ├── validations/   # Chứa schema (Joi) tự động validate và lọc dữ liệu đầu vào từ người dùng
│   ├── app.js         # Khởi tạo Express app, nạp middleware bảo mật, nạp routes
│   └── index.js       # Entry point chạy server: Mở kết nối Database và lắng nghe Port
├── tests/             # Kịch bản kiểm thử (Unit Test & Integration Test) & Fixtures
├── .env               # Chứa biến môi trường (PORT, MongoDB URL, JWT Secret...)
└── package.json       # Khai báo cấu hình lệnh (npm run dev, npm test) và import thư viện
```

## 2. Kiến trúc & Thư viện sử dụng
- **Framework chính**: Node.js & Express.js
- **Database**: MongoDB (qua thư viện chuẩn Mongoose), PostgreSQL
- **Xác thực (Auth)**: JsonWebToken (JWT) + Passport.js (Chiến lược bảo mật JWT) + bcryptjs (Băm mật khẩu)
- **Validation**: Joi (Bảo vệ dữ liệu đầu vào chặt chẽ ở cấp độ Routing)
- **Tài liệu API**: Swagger (`swagger-ui-express` / `swagger-jsdoc`)
- **Kiểm thử (Test)**: `jest` kết hợp `supertest` (có file setup riêng kết nối mock DB)

## 3. Quản lý Modules (Chức năng dành cho Khách sạn)
1. **Auth & Users** (Đã có sẵn): Đăng ký, đăng nhập, quên mật khẩu, quản lý và phân quyền tài khoản (Admin, User).
2. **Rooms** (Dự kiến): Quản lý chi tiết danh sách phòng khách sạn (Tạo phòng, Sửa giá, Cập nhật ảnh).
3. **Bookings** (Dự kiến): Khách hàng đặt chỗ, kiểm tra tình trạng trống, thanh toán.

## 4. Hướng dẫn cài đặt và chạy dự án

### 1. Cài đặt thư viện
Tại thư mục `server/`, mở Terminal và gõ:
```bash
npm install
```

### 2. Thiết lập Biến môi trường (`.env`)
Đảm bảo đã có file `.env` được sao chép thông số cấu hình từ `.env.example`:
```bash
cp .env.example .env
```
(Chú ý cập nhật `MONGODB_URL` hoặc `PORT` nếu bạn đang chạy local với port khác).

### 3. Lệnh khởi chạy
- **Môi trường Phát triển (Tự động hot-reload với nodemon)**:
  ```bash
  npm run dev
  ```
- **Chạy Kiểm thử tự động (Test)**:
  ```bash
  npm test
  ```

### Xem Tài liệu API OpenAPI
Mặc định route `docs` được khai báo trong `v1`. Khi chạy server ở port `5000`, hãy truy cập trình duyệt vào:
👉 **[http://localhost:5000/v1/docs](http://localhost:5000/v1/docs)**
