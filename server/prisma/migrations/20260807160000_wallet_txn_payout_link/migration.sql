-- Nối bút toán ví với yêu cầu rút tiền sinh ra nó.
--
-- Vì sao cần: ví bị trừ NGAY khi partner tạo yêu cầu rút (giữ tiền, xem walletService.holdForPayout),
-- nhưng tiền chỉ thực sự chuyển đi khi Platform Manager duyệt. Trước bản này, sổ ví không có đường
-- nào tra ngược về Payout nên giao diện chỉ đọc được `wallet_transactions.status` — cột luôn bằng
-- 'completed' — và hiển thị thành "đã hoàn tất" cho cả yêu cầu còn đang chờ duyệt.

-- AlterTable
ALTER TABLE "wallet_transactions" ADD COLUMN "payout_id" UUID;

-- AddForeignKey: xoá yêu cầu rút thì bút toán vẫn phải còn (sổ cái không được mất dòng) ⇒ SET NULL
ALTER TABLE "wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_payout_id_fkey"
    FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "wallet_transactions_payout_id_idx" ON "wallet_transactions"("payout_id");
CREATE INDEX IF NOT EXISTS "payouts_hotel_id_status_idx" ON "payouts"("hotel_id", "status");

-- ---------------------------------------------------------------------------
-- Backfill payout_id cho các bút toán đã có
-- ---------------------------------------------------------------------------
-- Bút toán cũ không lưu payout_id, nên ghép lại theo ví + số tiền + thời điểm. Một yêu cầu rút sinh
-- ra bút toán ví trong CÙNG transaction nên hai mốc thời gian chỉ lệch vài mili giây; lấy ứng viên
-- gần nhất trong khoảng 5 giây để không ghép nhầm sang yêu cầu khác cùng số tiền.
-- Không ghép được thì để NULL — API tự hiểu là "không rõ trạng thái" thay vì đoán bừa.

-- Bút toán GIỮ tiền: amount âm, đúng bằng −payouts.amount
UPDATE "wallet_transactions" wt
SET "payout_id" = p."id"
FROM "payouts" p
JOIN "wallets" w ON w."hotel_id" = p."hotel_id"
WHERE wt."payout_id" IS NULL
  AND wt."type" = 'payout'
  AND wt."wallet_id" = w."id"
  AND wt."amount" = -p."amount"
  AND wt."created_at" BETWEEN p."created_at" - INTERVAL '5 seconds' AND p."created_at" + INTERVAL '5 seconds';

-- Bút toán TRẢ LẠI khi yêu cầu bị từ chối: amount dương, ghi lúc processed/updated
UPDATE "wallet_transactions" wt
SET "payout_id" = p."id"
FROM "payouts" p
JOIN "wallets" w ON w."hotel_id" = p."hotel_id"
WHERE wt."payout_id" IS NULL
  AND wt."type" = 'adjustment'
  AND p."status" = 'failed'
  AND wt."wallet_id" = w."id"
  AND wt."amount" = p."amount"
  AND wt."created_at" BETWEEN p."updated_at" - INTERVAL '5 seconds' AND p."updated_at" + INTERVAL '5 seconds';

-- ---------------------------------------------------------------------------
-- Chuyển description sang tiếng Anh
-- ---------------------------------------------------------------------------
-- description được lưu thẳng vào DB rồi hiển thị nguyên văn, nên tiếng Việt cứng ở đây chặn giao diện
-- đa ngữ. Đổi sang tiếng Anh để client tự dịch theo i18n, đồng bộ với `type`/`status` vốn đã tiếng Anh.

UPDATE "wallet_transactions" SET "description" = 'Booking net revenue (pending settlement)'
    WHERE "description" = 'Net doanh thu booking (chờ tất toán)';
UPDATE "wallet_transactions" SET "description" = 'Settled — moved from pending to available'
    WHERE "description" = 'Chuyển pending → available (đã tất toán)';
UPDATE "wallet_transactions" SET "description" = 'Adjustment for booking cancellation/refund'
    WHERE "description" = 'Điều chỉnh do huỷ/hoàn tiền';
UPDATE "wallet_transactions" SET "description" = 'Payout request — funds on hold'
    WHERE "description" = 'Yêu cầu rút tiền';
UPDATE "wallet_transactions" SET "description" = 'Payout request rejected — hold released'
    WHERE "description" = 'Hoàn tiền do yêu cầu rút bị từ chối';
UPDATE "wallet_transactions" SET "description" = 'Wallet balance used for booking payment'
    WHERE "description" = 'Dùng số dư ví thanh toán booking';

-- Hai mẫu có kèm mã booking (ví khách)
UPDATE "wallet_transactions"
SET "description" = 'Refund for booking ' || substring("description" from 'Hoàn tiền booking (.+)$')
WHERE "description" LIKE 'Hoàn tiền booking %';

UPDATE "wallet_transactions"
SET "description" = 'Refund — payment arrived after booking '
                    || substring("description" from 'Hoàn tiền vào sau khi booking (.+) hết hạn giữ chỗ$')
                    || ' expired'
WHERE "description" LIKE 'Hoàn tiền vào sau khi booking %';
