-- CreateEnum
CREATE TYPE "PetsPolicy" AS ENUM ('not_allowed', 'allowed', 'on_request');

-- CreateEnum
CREATE TYPE "RoomSizeUnit" AS ENUM ('sqm', 'sqft');

-- CreateEnum
CREATE TYPE "HotelContactType" AS ENUM ('physical_location', 'general', 'availability', 'invoices');

-- CreateEnum
CREATE TYPE "ContactPhoneType" AS ENUM ('voice', 'fax', 'mobile');

-- CreateEnum
CREATE TYPE "HotelPolicyType" AS ENUM ('cancellation', 'tax', 'fee', 'parking', 'internet', 'deposit');

-- CreateEnum
CREATE TYPE "ChargeFrequency" AS ENUM ('per_stay', 'per_night', 'per_person', 'per_person_per_night');

-- CreateEnum
CREATE TYPE "NearbyPlaceCategory" AS ENUM ('attraction', 'beach', 'airport', 'restaurant', 'public_transport', 'landmark', 'nature');

-- CreateEnum
CREATE TYPE "DistanceUnit" AS ENUM ('km', 'miles');

-- CreateEnum
CREATE TYPE "NearbyTransportType" AS ENUM ('walk', 'car', 'public_transport', 'taxi', 'shuttle');

-- CreateEnum
CREATE TYPE "BedType" AS ENUM ('single', 'double', 'queen', 'king', 'sofa_bed', 'bunk');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'processing', 'paid', 'failed');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AmenityCategory" ADD VALUE 'parking';
ALTER TYPE "AmenityCategory" ADD VALUE 'wellness';
ALTER TYPE "AmenityCategory" ADD VALUE 'food_drink';
ALTER TYPE "AmenityCategory" ADD VALUE 'connectivity';
ALTER TYPE "AmenityCategory" ADD VALUE 'restaurant';

-- AlterTable
ALTER TABLE "hotel_amenities" ADD COLUMN     "is_free" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "quantity" SMALLINT;

-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "built_year" SMALLINT,
ADD COLUMN     "cancellation_policy" TEXT,
ADD COLUMN     "children_policy" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "is_smoking_allowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "languages_spoken" JSONB,
ADD COLUMN     "max_length_of_stay" SMALLINT,
ADD COLUMN     "min_guest_age" SMALLINT,
ADD COLUMN     "pets_policy" "PetsPolicy",
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "renovation_year" SMALLINT,
ADD COLUMN     "security_deposit_amount" DECIMAL(12,2),
ADD COLUMN     "total_floors" SMALLINT;

-- AlterTable
ALTER TABLE "platform_commissions" ADD COLUMN     "payout_id" UUID;

-- AlterTable
ALTER TABLE "room_type_amenities" ADD COLUMN     "is_free" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "quantity" SMALLINT;

-- AlterTable
ALTER TABLE "room_types" ADD COLUMN     "has_balcony" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_private_bathroom" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_non_smoking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "max_adults" SMALLINT,
ADD COLUMN     "max_children" SMALLINT,
ADD COLUMN     "size_unit" "RoomSizeUnit";

-- CreateTable
CREATE TABLE "hotel_contacts" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "contact_type" "HotelContactType" NOT NULL,
    "name" TEXT,
    "job_title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "phone_type" "ContactPhoneType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_policies" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "policy_type" "HotelPolicyType" NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "amount" DECIMAL(12,2),
    "is_percentage" BOOLEAN NOT NULL DEFAULT false,
    "charge_frequency" "ChargeFrequency",
    "min_age" SMALLINT,
    "max_age" SMALLINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_nearby_places" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "NearbyPlaceCategory" NOT NULL,
    "distance" DECIMAL(8,2) NOT NULL,
    "distance_unit" "DistanceUnit" NOT NULL,
    "transport_type" "NearbyTransportType",
    "journey_minutes" SMALLINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_nearby_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_beds" (
    "id" UUID NOT NULL,
    "room_type_id" UUID NOT NULL,
    "bed_type" "BedType" NOT NULL,
    "quantity" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "payout_account_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
    "period_start" DATE,
    "period_end" DATE,
    "status" "PayoutStatus" NOT NULL,
    "payout_transaction_id" TEXT,
    "processed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "platform_commissions" ADD CONSTRAINT "platform_commissions_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_contacts" ADD CONSTRAINT "hotel_contacts_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_policies" ADD CONSTRAINT "hotel_policies_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_nearby_places" ADD CONSTRAINT "hotel_nearby_places_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_beds" ADD CONSTRAINT "room_beds_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "hotel_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_payout_account_id_fkey" FOREIGN KEY ("payout_account_id") REFERENCES "hotel_payout_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
