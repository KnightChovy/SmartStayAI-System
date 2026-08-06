-- Tách trạng thái phòng thành 3 chiều độc lập (lễ tân / buồng phòng / block theo khoảng ngày).
-- GIAI ĐOẠN A + B: thêm cột mới và backfill, CỐ Ý GIỮ NGUYÊN cột rooms.status để mọi code cũ
-- (check-in, tìm phòng, bộ lọc room map) chạy y như trước. Việc DROP cột status là giai đoạn C,
-- chỉ chạy sau khi bản này đã sống ổn định vài ngày — drop cùng lúc thì rollback sẽ mất dữ liệu.

-- CreateEnum
CREATE TYPE "FoStatus" AS ENUM ('vacant', 'occupied');

-- CreateEnum
CREATE TYPE "HkStatus" AS ENUM ('dirty', 'cleaning', 'clean', 'inspected');

-- CreateEnum
CREATE TYPE "RoomBlockType" AS ENUM ('ooo', 'oos');

-- CreateEnum
CREATE TYPE "RoomStatusDimension" AS ENUM ('fo', 'hk', 'block');

-- CreateEnum
CREATE TYPE "CancelledByRole" AS ENUM ('customer', 'hotel_staff', 'hotel_partner', 'platform_manager', 'admin', 'system');

-- CreateEnum
CREATE TYPE "CancellationReasonCode" AS ENUM ('guest_request', 'guest_no_show', 'room_out_of_order', 'overbooking', 'hotel_force_majeure', 'payment_failed', 'hold_expired', 'partner_suspended', 'fraud_detected', 'policy_violation');

-- AlterTable
ALTER TABLE "rooms"
    ADD COLUMN "fo_status" "FoStatus" NOT NULL DEFAULT 'vacant',
    ADD COLUMN "hk_status" "HkStatus" NOT NULL DEFAULT 'inspected',
    ADD COLUMN "hk_status_since" TIMESTAMP(3),
    ADD COLUMN "hk_expected_until" TIMESTAMP(3),
    ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "room_types"
    ADD COLUMN "cleaning_duration_minutes" SMALLINT NOT NULL DEFAULT 30,
    ADD COLUMN "requires_inspection" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "bookings"
    ADD COLUMN "cancelled_by_role" "CancelledByRole",
    ADD COLUMN "cancelled_by_user_id" UUID,
    ADD COLUMN "cancellation_reason_code" "CancellationReasonCode";

-- CreateTable
CREATE TABLE "room_blocks" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "block_type" "RoomBlockType" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "estimated_cost" DECIMAL(12,2),
    "created_by" UUID NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_status_history" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "dimension" "RoomStatusDimension" NOT NULL,
    "from_value" TEXT,
    "to_value" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_end_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "changed_by" UUID,
    "reason" TEXT,
    "note" TEXT,

    CONSTRAINT "room_status_history_pkey" PRIMARY KEY ("id")
);

-- Ngày kết thúc không được trước ngày bắt đầu (Prisma schema không diễn đạt được CHECK)
ALTER TABLE "room_blocks" ADD CONSTRAINT "room_blocks_date_range_check" CHECK ("end_date" >= "start_date");

-- CreateIndex
CREATE INDEX "room_blocks_room_id_start_date_end_date_idx" ON "room_blocks"("room_id", "start_date", "end_date");

-- CreateIndex
-- (hotel_id, resolved_at) phục vụ truy vấn nóng nhất: danh sách đợt chặn CHƯA xử lý của khách sạn.
-- Cố ý KHÔNG dùng partial index `WHERE resolved_at IS NULL` dù nó gọn hơn: Prisma schema không
-- diễn đạt được partial index, nên lần `migrate dev` sau sẽ coi đó là drift và sinh lệnh xoá nó.
CREATE INDEX "room_blocks_hotel_id_resolved_at_idx" ON "room_blocks"("hotel_id", "resolved_at");

-- CreateIndex
CREATE INDEX "room_status_history_room_id_started_at_idx" ON "room_status_history"("room_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_hotel_id_room_number_key" ON "rooms"("hotel_id", "room_number");

-- AddForeignKey
ALTER TABLE "room_blocks" ADD CONSTRAINT "room_blocks_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_blocks" ADD CONSTRAINT "room_blocks_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_status_history" ADD CONSTRAINT "room_status_history_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancelled_by_user_id_fkey" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- GIAI ĐOẠN B — backfill từ cột status cũ
-- ---------------------------------------------------------------------------

-- 'occupied' là chiều lễ tân; 'cleaning' là chiều buồng phòng. Phòng đang bảo trì không nói lên
-- điều gì về hai chiều kia nên để mặc định (vacant + inspected) và chuyển thành block ở bước sau.
UPDATE "rooms" SET
    "fo_status" = CASE WHEN "status" = 'occupied' THEN 'occupied'::"FoStatus" ELSE 'vacant'::"FoStatus" END,
    "hk_status" = CASE WHEN "status" = 'cleaning' THEN 'cleaning'::"HkStatus" ELSE 'inspected'::"HkStatus" END;

-- Phòng đang 'maintenance' → một block OOO. Cột status cũ không có ngày dự kiến xong nên tạm lấy
-- 7 ngày; quản lý vào sửa lại hoặc bấm "đã sửa xong" là hết. Không đoán được thì thà đoán có hạn
-- còn hơn để chặn vô thời hạn như trước.
--
-- BƯỚC NÀY BẮT BUỘC PHẢI CHẠY ĐƯỢC: từ nay việc loại phòng khỏi kho bán do room_blocks quyết định
-- chứ không còn do rooms.status. Phòng đang bảo trì mà không có block đi kèm sẽ được mở bán lại.
-- Vì created_by NOT NULL, lấy admin đầu tiên; không có admin thì lấy user bất kỳ (DB không có user
-- nào thì cũng không có phòng nào để mà backfill).
INSERT INTO "room_blocks" ("id", "room_id", "hotel_id", "block_type", "start_date", "end_date", "reason", "created_by")
SELECT gen_random_uuid(), r."id", r."hotel_id", 'ooo', CURRENT_DATE, CURRENT_DATE + 7,
       'Chuyển từ trạng thái maintenance cũ — cần xác nhận lại ngày dự kiến xong',
       COALESCE(
           (SELECT u."id" FROM "users" u WHERE u."role" = 'admin' ORDER BY u."created_at" LIMIT 1),
           (SELECT u."id" FROM "users" u ORDER BY u."created_at" LIMIT 1)
       )
FROM "rooms" r
WHERE r."status" = 'maintenance'
  AND EXISTS (SELECT 1 FROM "users" u);

-- Ghi lại các block vừa tạo vào nhật ký để lịch sử không bị đứt đoạn ở mốc migration
INSERT INTO "room_status_history" ("id", "room_id", "dimension", "to_value", "expected_end_at", "reason")
SELECT gen_random_uuid(), b."room_id", 'block', 'ooo', b."end_date", b."reason"
FROM "room_blocks" b;

-- Đồng bộ lại tồn kho các đêm TƯƠNG LAI.
-- Trước đây bật maintenance trừ total_rooms của MỌI đêm tương lai (không giới hạn ngày), nên số
-- tồn kho đang lệch so với mô hình mới "chỉ trừ đúng khoảng ngày bị chặn". Tính lại một lần ở đây
-- để hai bên khớp nhau ngay từ đầu, sau đó room-block.service tự giữ cho khớp.
-- GREATEST(..., booked_rooms): không bao giờ để total < booked, nếu không thì số phòng trống hoá âm
-- và điều kiện tăng bookedRooms lúc đặt phòng sẽ hiểu sai.
UPDATE "room_availability" ra
SET "total_rooms" = GREATEST(
    (
        SELECT COUNT(*)
        FROM "rooms" r
        WHERE r."room_type_id" = ra."room_type_id"
          AND r."is_active"
          AND NOT EXISTS (
              SELECT 1 FROM "room_blocks" b
              WHERE b."room_id" = r."id"
                AND b."block_type" = 'ooo'
                AND b."resolved_at" IS NULL
                AND ra."date" BETWEEN b."start_date" AND b."end_date"
          )
    ),
    ra."booked_rooms"
)
WHERE ra."date" >= CURRENT_DATE;
