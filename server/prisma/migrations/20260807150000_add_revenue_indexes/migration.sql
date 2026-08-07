-- Index cho các truy vấn báo cáo doanh thu. Trước bản này 4 bảng dưới đây CHỈ có khoá chính và
-- vài unique constraint, nên mọi báo cáo (lọc theo khoảng ngày, gộp theo đối tác/khách sạn) đều
-- phải quét toàn bảng.
--
-- Dùng CREATE INDEX thường, KHÔNG dùng CONCURRENTLY: Prisma chạy mỗi migration trong một
-- transaction, mà CONCURRENTLY không được phép nằm trong transaction. Các bảng này còn nhỏ nên
-- thời gian khoá không đáng kể.
--
-- Tên index đặt theo đúng quy ước Prisma (<bảng>_<cột>_idx) để lần `migrate dev` sau không coi
-- chúng là drift rồi sinh lệnh xoá đi tạo lại. IF NOT EXISTS để chạy lại được trên database đã
-- có sẵn các index này.

-- platform_commissions: created_at là MỐC GHI NHẬN doanh thu ⇒ mọi báo cáo đều lọc theo nó.
CREATE INDEX IF NOT EXISTS "platform_commissions_created_at_idx" ON "platform_commissions"("created_at");
CREATE INDEX IF NOT EXISTS "platform_commissions_partner_id_created_at_idx" ON "platform_commissions"("partner_id", "created_at");
CREATE INDEX IF NOT EXISTS "platform_commissions_status_created_at_idx" ON "platform_commissions"("status", "created_at");
CREATE INDEX IF NOT EXISTS "platform_commissions_payout_id_idx" ON "platform_commissions"("payout_id");

-- refunds: báo cáo chỉ cộng khoản đã 'processed' trong một khoảng ngày tạo; cron tự duyệt quá hạn
-- cũng quét theo (status, created_at) nên dùng chung index này.
CREATE INDEX IF NOT EXISTS "refunds_status_created_at_idx" ON "refunds"("status", "created_at");
CREATE INDEX IF NOT EXISTS "refunds_payment_id_idx" ON "refunds"("payment_id");

-- bookings / payments: đường đi của mọi truy vấn tiền là booking → payment → refund.
CREATE INDEX IF NOT EXISTS "bookings_hotel_id_created_at_idx" ON "bookings"("hotel_id", "created_at");
CREATE INDEX IF NOT EXISTS "bookings_status_created_at_idx" ON "bookings"("status", "created_at");
CREATE INDEX IF NOT EXISTS "payments_booking_id_idx" ON "payments"("booking_id");
CREATE INDEX IF NOT EXISTS "payments_status_paid_at_idx" ON "payments"("status", "paid_at");
