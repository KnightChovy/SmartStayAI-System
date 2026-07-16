-- Ví khách hàng + khách chọn cách nhận tiền hoàn.
--
-- Trước migration này ví chỉ dành cho khách sạn (hotel_id bắt buộc + unique), nên tiền hoàn không
-- có chỗ nào để về: Platform Manager phải gọi điện hỏi số tài khoản rồi chuyển tay, không ghi lại
-- được gì. Nay khách chọn: vào ví (tiền không rời nền tảng, duyệt xong cộng ngay) hoặc về ngân hàng.

-- 1) Enum mới
ALTER TYPE "PaymentMethod" ADD VALUE 'wallet';
ALTER TYPE "WalletTransactionType" ADD VALUE 'spend';

CREATE TYPE "RefundMethod" AS ENUM ('wallet', 'bank');

-- 2) Ví: cho phép thuộc về khách hàng
ALTER TABLE "wallets" ALTER COLUMN "hotel_id" DROP NOT NULL;
ALTER TABLE "wallets" ADD COLUMN "customer_id" UUID;

CREATE UNIQUE INDEX "wallets_customer_id_key" ON "wallets"("customer_id");

ALTER TABLE "wallets"
    ADD CONSTRAINT "wallets_customer_id_fkey" FOREIGN KEY ("customer_id")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ràng buộc cốt lõi: mỗi ví thuộc về ĐÚNG MỘT chủ sở hữu. Prisma không khai được CHECK nên đặt ở
-- đây; nhờ vậy DB tự chặn ví "hai chủ" hoặc ví "vô chủ" ngay cả khi code sau này viết sai.
ALTER TABLE "wallets"
    ADD CONSTRAINT "wallets_exactly_one_owner"
    CHECK (num_nonnulls("hotel_id", "customer_id") = 1);

-- 3) Refund: cách nhận tiền + tài khoản ngân hàng (chỉ dùng khi chọn 'bank')
-- Bản ghi CŨ nhận 'bank': chúng được tạo khi chưa có ví khách nên đúng bản chất là chờ chuyển
-- khoản tay. Sau khi điền xong thì đưa default về 'wallet' cho khớp @default(wallet) trong schema —
-- nếu để lệch, prisma sẽ báo schema drift ở lần migrate sau.
ALTER TABLE "refunds" ADD COLUMN "refund_method" "RefundMethod" NOT NULL DEFAULT 'bank';
ALTER TABLE "refunds" ALTER COLUMN "refund_method" SET DEFAULT 'wallet';
ALTER TABLE "refunds" ADD COLUMN "bank_account_number" TEXT;
ALTER TABLE "refunds" ADD COLUMN "bank_name" TEXT;
ALTER TABLE "refunds" ADD COLUMN "bank_account_holder" TEXT;
