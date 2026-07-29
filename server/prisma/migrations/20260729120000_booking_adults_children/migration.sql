-- Tách số khách của booking thành người lớn / trẻ em (P0-5).
-- Booking cũ chỉ có num_guests: coi toàn bộ là người lớn để không đổi ngữ nghĩa của số cũ.
ALTER TABLE "bookings" ADD COLUMN "num_adults" SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE "bookings" ADD COLUMN "num_children" SMALLINT NOT NULL DEFAULT 0;

-- Backfill: người lớn = tổng khách cũ, trẻ em = 0
UPDATE "bookings" SET "num_adults" = "num_guests";
