-- Tách bút toán ví: 'payout' giờ CHỈ dùng cho rút tiền THẬT về bank của partner; thêm 'settlement'
-- cho tất toán nội bộ (chuyển net pending → available, tiền không rời nền tảng).
-- Thêm giá trị enum là thao tác ADDITIVE: không xoá/đổi cột, không mất dữ liệu.
-- Đứng RIÊNG một migration vì Postgres không cho DÙNG enum value vừa thêm trong cùng transaction
-- (backfill nằm ở migration kế tiếp 20260806130001).
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'settlement' AFTER 'payout';
