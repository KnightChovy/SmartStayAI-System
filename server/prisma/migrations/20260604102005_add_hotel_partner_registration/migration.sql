/*
  Warnings:

  - Added the required column `image_category` to the `hotel_images` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('hotel', 'resort', 'villa', 'apartment');

-- CreateEnum
CREATE TYPE "HotelImageCategory" AS ENUM ('cover', 'exterior', 'room');

-- CreateEnum
CREATE TYPE "VerificationRequestStatus" AS ENUM ('pending', 'in_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "VerificationDocumentType" AS ENUM ('business_license', 'tax_certificate', 'owner_id', 'property_proof');

-- CreateEnum
CREATE TYPE "VerificationDocumentStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('business_license', 'operating_license', 'fire_safety', 'security_order', 'classification');

-- CreateEnum
CREATE TYPE "LicenseValidityStatus" AS ENUM ('active', 'pending', 'expired');

-- CreateEnum
CREATE TYPE "LicenseStarRating" AS ENUM ('1', '2', '3', '4', '5', 'unrated');

-- CreateEnum
CREATE TYPE "RepresentativeRole" AS ENUM ('owner', 'general_manager', 'legal_representative', 'director');

-- AlterTable
ALTER TABLE "hotel_images" ADD COLUMN     "image_category" "HotelImageCategory" NOT NULL;

-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "business_registration_number" TEXT,
ADD COLUMN     "business_type" "BusinessType",
ADD COLUMN     "district" TEXT,
ADD COLUMN     "tax_code" TEXT,
ADD COLUMN     "ward" TEXT;

-- CreateTable
CREATE TABLE "hotel_verification_requests" (
    "id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "status" "VerificationRequestStatus" NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_verification_documents" (
    "id" UUID NOT NULL,
    "verification_request_id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "document_type" "VerificationDocumentType" NOT NULL,
    "file_url" TEXT NOT NULL,
    "status" "VerificationDocumentStatus" NOT NULL,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "replaced_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_licenses" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "verification_request_id" UUID,
    "license_type" "LicenseType" NOT NULL,
    "license_number" TEXT,
    "certificate_number" TEXT,
    "issue_date" DATE,
    "expiry_date" DATE,
    "authority" TEXT,
    "validity_status" "LicenseValidityStatus",
    "star_rating" "LicenseStarRating",
    "file_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_representatives" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "RepresentativeRole" NOT NULL,
    "date_of_birth" DATE,
    "id_number" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "id_front_image_url" TEXT,
    "id_back_image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_representatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_payout_accounts" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "account_holder" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "bank_branch" TEXT,
    "swift_code" TEXT,
    "tax_id_vat_number" TEXT,
    "registered_business_address" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_payout_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hotel_licenses_hotel_id_license_type_idx" ON "hotel_licenses"("hotel_id", "license_type");

-- AddForeignKey
ALTER TABLE "hotel_verification_requests" ADD CONSTRAINT "hotel_verification_requests_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "hotel_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_verification_requests" ADD CONSTRAINT "hotel_verification_requests_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_verification_requests" ADD CONSTRAINT "hotel_verification_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_verification_documents" ADD CONSTRAINT "hotel_verification_documents_verification_request_id_fkey" FOREIGN KEY ("verification_request_id") REFERENCES "hotel_verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_verification_documents" ADD CONSTRAINT "hotel_verification_documents_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "hotel_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_verification_documents" ADD CONSTRAINT "hotel_verification_documents_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_verification_documents" ADD CONSTRAINT "hotel_verification_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_verification_documents" ADD CONSTRAINT "hotel_verification_documents_replaced_by_fkey" FOREIGN KEY ("replaced_by") REFERENCES "hotel_verification_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_licenses" ADD CONSTRAINT "hotel_licenses_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_licenses" ADD CONSTRAINT "hotel_licenses_verification_request_id_fkey" FOREIGN KEY ("verification_request_id") REFERENCES "hotel_verification_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_representatives" ADD CONSTRAINT "hotel_representatives_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_representatives" ADD CONSTRAINT "hotel_representatives_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "hotel_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_payout_accounts" ADD CONSTRAINT "hotel_payout_accounts_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_payout_accounts" ADD CONSTRAINT "hotel_payout_accounts_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "hotel_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
