-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "fee_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;
