-- Hội thoại TOÀN SÀN (trợ lý tìm khách sạn ở khung chat nổi) không gắn khách sạn nào ⇒ hotel_id NULL.
--
-- `schema.prisma` đã khai `hotelId String?` từ trước và `conversation.service.ts` đã tạo hội thoại
-- với `hotelId: null`, NHƯNG cột trong DB vẫn là NOT NULL (từ migration init) và chưa migration nào
-- gỡ ra ⇒ mọi tin gửi ở chế độ toàn sàn đều chết ở `prisma.conversation.create()` với lỗi
-- "Null constraint violation" (HTTP 500). Migration này làm DB khớp lại với schema đã commit.
ALTER TABLE "conversations" ALTER COLUMN "hotel_id" DROP NOT NULL;
