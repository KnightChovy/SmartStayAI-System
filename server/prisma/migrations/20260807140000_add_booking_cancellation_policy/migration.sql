-- Snapshot chính sách huỷ (bậc thang) đóng băng vào booking lúc đặt, để KS đổi chính sách sau này
-- KHÔNG làm đổi điều khoản của đơn cũ. Additive, nullable — đơn cũ để NULL và fallback policy sống.
ALTER TABLE "bookings" ADD COLUMN "cancellation_policy" JSONB;
