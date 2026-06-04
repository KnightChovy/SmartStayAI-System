-- AlterEnum: bổ sung 4 loại document để khớp đủ với license_type (tổng 8 loại)
ALTER TYPE "VerificationDocumentType" ADD VALUE IF NOT EXISTS 'operating_license';
ALTER TYPE "VerificationDocumentType" ADD VALUE IF NOT EXISTS 'fire_safety';
ALTER TYPE "VerificationDocumentType" ADD VALUE IF NOT EXISTS 'security_order';
ALTER TYPE "VerificationDocumentType" ADD VALUE IF NOT EXISTS 'classification';

-- AlterTable: hotel_licenses không còn giữ file_url; file sống ở hotel_verification_documents.
-- Thay bằng current_document_id trỏ tới bản document đã được duyệt mới nhất.
ALTER TABLE "hotel_licenses" DROP COLUMN "file_url";
ALTER TABLE "hotel_licenses" ADD COLUMN "current_document_id" UUID;

-- AddForeignKey: license -> document hiện hành (xoá document thì set null, giữ lại metadata license)
ALTER TABLE "hotel_licenses" ADD CONSTRAINT "hotel_licenses_current_document_id_fkey" FOREIGN KEY ("current_document_id") REFERENCES "hotel_verification_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
