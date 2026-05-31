# HƯỚNG DẪN THIẾT LẬP DATABASE VỚI PRISMA & POSTGRESQL (LOCAL DEVELOPMENT)

Tài liệu này hướng dẫn chi tiết cách thiết lập, đồng bộ hóa (Migrate), nạp dữ liệu mẫu (Seed) và quản trị cơ sở dữ liệu **PostgreSQL** cục bộ sử dụng **Prisma ORM** cho dự án **SmartStayAI-System**.

---

## 📌 Các bước chuẩn bị (Prerequisites)

Trước khi thực hiện, hãy đảm bảo bạn đã cài đặt các phần mềm sau trên máy cá nhân:
1. **Node.js** (Khuyên dùng phiên bản `>= 18.x.x` hoặc mới nhất `v20.x.x`).
2. **PostgreSQL** (Khuyên dùng phiên bản `v15` hoặc `v16`).
   * *Link tải chính thức cho Windows*: [PostgreSQL EnterpriseDB Downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
3. **pgAdmin 4** (Công cụ quản lý PostgreSQL dạng đồ họa trực quan - được cài đi kèm khi bạn cài đặt PostgreSQL ở bước trên).

---

## 🛠️ Quy trình thiết lập từng bước (Step-by-Step Setup)

### Bước 1: Tạo Database trống trên pgAdmin 4
1. Mở ứng dụng **pgAdmin 4** trên máy tính của bạn.
2. Kết nối vào Server PostgreSQL của bạn bằng mật khẩu quản trị đã thiết lập lúc cài đặt.
3. Ở cột danh sách bên trái (Browser), nhấp chuột phải vào chữ **Databases** $\rightarrow$ chọn **Create** $\rightarrow$ **Database...**
4. Điền tên cơ sở dữ liệu là: **`smartstay_db`** (hoặc tên tùy thích).
5. Nhấn **Save** để hoàn tất tạo database trống.

### Bước 2: Cấu hình biến môi trường
1. Nhân bản tệp cấu hình `.env.example` thành tệp `.env` nếu bạn chưa có:
   ```bash
   cp .env.example .env
   ```
2. Mở tệp `.env` ra, tìm đến dòng biến kết nối và cấu hình chính xác tài khoản PostgreSQL của bạn:
   ```env
   # PostgreSQL Connection (Cấu hình local của bạn)
   DATABASE_URL="postgresql://postgres:<mật_khẩu_pgadmin>@localhost:5432/smartstay_db?schema=public"
   ```
   *Lưu ý thay thế `<mật_khẩu_pgadmin>` thành mật khẩu đăng nhập cơ sở dữ liệu của bạn.*

### Bước 3: Đồng bộ cấu hình và sinh Prisma Client (Generate)
Chạy lệnh sau tại thư mục `server` để phát sinh bộ thư viện Prisma Client tự động ánh xạ 43 bảng dữ liệu vào dự án:
```bash
npx prisma generate
```

### Bước 4: Chạy Migration dựng 43 bảng dữ liệu
Đồng bộ hóa schema thiết kế vào cơ sở dữ liệu PostgreSQL thực tế bằng lệnh:
```bash
npx prisma migrate dev --name init_smartstay_schema
```
> 💡 **Mẹo nhỏ**: Nếu cơ sở dữ liệu đã từng được migrate bằng phiên bản schema cũ hơn và báo lỗi lệch pha cấu trúc (drift detected), hãy chạy lệnh:
> ```bash
> npx prisma migrate reset
> ```
> Sau đó nhập `y` (Yes) để xóa sạch và tiến hành khởi chạy lại lệnh migrate ở trên để có một database hoàn toàn sạch sẽ.

### Bước 5: Nạp dữ liệu tài khoản mẫu (Seed)
Nạp các tài khoản thử nghiệm đầu tiên (Admin và Customer) vào hệ thống:
```bash
npx prisma db seed
```
Sau khi hoàn tất, bạn có thể sử dụng các tài khoản sau để thử nghiệm chức năng Đăng nhập / Đăng ký:
* 🔑 **Tài khoản Admin mẫu**:
  * **Email**: `admin@smartstay.ai`
  * **Password**: `adminPassword123`
* 🔑 **Tài khoản Khách hàng (Customer) mẫu**:
  * **Email**: `customer@smartstay.ai`
  * **Password**: `customerPassword123`

---

## 🖥️ Công cụ quản trị trực quan: Prisma Studio

Prisma cung cấp một công cụ giao diện Web GUI quản lý dữ liệu cực kỳ trực quan và hiện đại thay thế cho pgAdmin khi cần xem/sửa nhanh dữ liệu mẫu. Để kích hoạt, bạn chỉ cần gõ:

```bash
npx prisma studio
```

Trình duyệt sẽ tự động mở trang web tại địa chỉ: 👉 **[http://localhost:5555](http://localhost:5555)**. 
Tại đây, bạn có thể xem danh sách 43 bảng dữ liệu, thêm, sửa, hoặc xóa các bản ghi `User`, `Token`, `Booking`, v.v. chỉ bằng các cú click chuột.

---

## 🧠 Lưu ý đặc biệt về `pgvector` (Hệ thống AI Embedding)

Hệ thống của chúng ta sử dụng công nghệ tìm kiếm thông minh bằng **AI Embeddings** thông qua extension **`pgvector`** trên PostgreSQL (lưu tại các trường `embedding` của bảng `room_types`, `reviews`, `faq_knowledge_base`).

* **Trạng thái hiện tại**: Để mọi thành viên trong team chạy được local ngay lập tức mà không gặp lỗi thiếu extension `pgvector` trên Windows, **các trường `embedding` này hiện đã được tạm ẩn (comment out) trong tệp [`schema.prisma`](file:///c:/Users/BinhKhiem/OneDrive/Desktop/SmartStayAI-System-Platfrom/server/prisma/schema.prisma)**.
* **Cách kích hoạt lại**: Khi bạn deploy lên các máy chủ Cloud có sẵn pgvector (như Neon, Supabase, AWS RDS) hoặc đã tự build thành công dll pgvector cục bộ:
  1. Mở tệp [`schema.prisma`](file:///c:/Users/BinhKhiem/OneDrive/Desktop/SmartStayAI-System-Platfrom/server/prisma/schema.prisma).
  2. Bỏ các dấu gạch chéo comment (`//`) ở các trường `embedding` tương ứng.
  3. Lưu lại và chạy lại lệnh `npx prisma migrate dev` để kích hoạt tính năng AI Vector Search.

---

## 🏗️ Kiến trúc dưới hạ tầng (Dành cho thành viên Core Dev)

Hệ thống sử dụng phiên bản **Prisma v7.x** mới nhất với hai nâng cấp kiến trúc lớn:
1. **Quản lý cấu hình tập trung (`prisma.config.js`)**: Thay vì cấu hình đường dẫn database trực tiếp ở `schema.prisma`, Prisma v7 gom toàn bộ cài đặt vào tệp cấu hình JS để có thể nạp động các biến môi trường một cách an toàn.
2. **Driver Adapters**: Prisma v7 đã gỡ bỏ hoàn toàn bộ máy Rust engine bên trong client. Hệ thống sử dụng bộ chuyển đổi `@prisma/adapter-pg` kết hợp với kết nối Pool của `pg` để tối ưu hiệu năng kết nối cơ sở dữ liệu trên môi trường Node.js.
