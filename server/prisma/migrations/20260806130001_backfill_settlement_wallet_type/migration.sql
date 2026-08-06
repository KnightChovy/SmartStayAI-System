-- Backfill: mọi bút toán TẤT TOÁN cũ đang mang type 'payout' (do settle() ghi trước khi tách type)
-- chuyển sang 'settlement' để ledger nhất quán cả về sau.
-- An toàn: tại thời điểm này chưa có khoản rút tiền THẬT nào (bảng payouts rỗng) nên mọi 'payout'
-- đều là tất toán; vẫn lọc thêm theo description để tuyệt đối không đụng bút toán rút tiền thật.
UPDATE "wallet_transactions"
SET "type" = 'settlement'
WHERE "type" = 'payout'
  AND "description" LIKE 'Chuyển pending%';
