-- Tách hotel_policies làm hai bảng theo đúng vai trò:
--   hotel_policies : điều khoản thuần văn bản cho khách ĐỌC (title/description/important)
--   hotel_charges  : khoản thu engine TÍNH TIỀN (thuế, phí dịch vụ)
-- Một bảng gánh cả hai việc khiến sửa câu chữ có thể đụng nhầm vào tiền.
--
-- QUAN TRỌNG: dữ liệu tax/fee được CHUYỂN sang bảng mới TRƯỚC khi xoá cột, nếu không sẽ mất
-- toàn bộ cấu hình thuế/phí mà khách sạn đã khai.

-- 1) Bảng khoản thu mới
CREATE TYPE "ChargeType" AS ENUM ('tax', 'fee');

CREATE TABLE "hotel_charges" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "charge_type" "ChargeType" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "is_percentage" BOOLEAN NOT NULL DEFAULT false,
    "charge_frequency" "ChargeFrequency",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_charges_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "hotel_charges"
    ADD CONSTRAINT "hotel_charges_hotel_id_fkey" FOREIGN KEY ("hotel_id")
    REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2) Chuyển dữ liệu thuế/phí sang bảng mới.
-- Chỉ lấy dòng có amount: dòng thiếu amount vốn đã bị engine bỏ qua nên không phải khoản thu thật.
-- Tên hiển thị lấy từ code cũ, không có thì đặt tên mặc định theo loại.
INSERT INTO "hotel_charges" (
    "id", "hotel_id", "charge_type", "name", "amount", "is_percentage", "charge_frequency", "created_at", "updated_at"
)
SELECT
    gen_random_uuid(),
    "hotel_id",
    ("policy_type"::text)::"ChargeType",
    COALESCE(
        NULLIF(TRIM("code"), ''),
        CASE WHEN "policy_type" = 'tax' THEN 'Thuế' ELSE 'Phí dịch vụ' END
    ),
    "amount",
    "is_percentage",
    "charge_frequency",
    "created_at",
    "updated_at"
FROM "hotel_policies"
WHERE "policy_type" IN ('tax', 'fee') AND "amount" IS NOT NULL;

-- 3) Cột mới cho bảng điều khoản (title tạm cho phép NULL để còn điền dữ liệu cũ)
ALTER TABLE "hotel_policies" ADD COLUMN "title" TEXT;
ALTER TABLE "hotel_policies" ADD COLUMN "important" BOOLEAN NOT NULL DEFAULT false;

-- 4) Sinh tiêu đề từ policy_type cũ để dòng cũ không mất ý nghĩa
UPDATE "hotel_policies" SET "title" = CASE "policy_type"
    WHEN 'cancellation' THEN 'Chính sách huỷ phòng'
    WHEN 'parking'      THEN 'Đỗ xe'
    WHEN 'internet'     THEN 'Internet'
    WHEN 'deposit'      THEN 'Đặt cọc'
    ELSE 'Chính sách khách sạn'
END;

-- Chính sách huỷ là điều khoản khách hay tranh cãi nhất ⇒ đánh dấu quan trọng sẵn
UPDATE "hotel_policies" SET "important" = true WHERE "policy_type" = 'cancellation';

-- 5) Dòng thuế/phí đã sang hotel_charges ⇒ bỏ khỏi bảng điều khoản
DELETE FROM "hotel_policies" WHERE "policy_type" IN ('tax', 'fee');

-- 6) Mọi dòng còn lại đã có title ⇒ siết NOT NULL
ALTER TABLE "hotel_policies" ALTER COLUMN "title" SET NOT NULL;

-- 7) Xoá cột không còn dùng. min_age/max_age vốn chưa từng được code nào đọc.
ALTER TABLE "hotel_policies"
    DROP COLUMN "policy_type",
    DROP COLUMN "code",
    DROP COLUMN "amount",
    DROP COLUMN "is_percentage",
    DROP COLUMN "charge_frequency",
    DROP COLUMN "min_age",
    DROP COLUMN "max_age";

DROP TYPE "HotelPolicyType";
