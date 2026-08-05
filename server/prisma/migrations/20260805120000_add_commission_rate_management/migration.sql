-- CreateEnum
CREATE TYPE "CommissionRateSource" AS ENUM ('platform_base', 'hotel_agreement');

-- CreateEnum
CREATE TYPE "CommissionRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "commission_rate_requests" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "requested_by" UUID NOT NULL,
    "requested_rate" DECIMAL(5,2) NOT NULL,
    "current_rate" DECIMAL(5,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "CommissionRequestStatus" NOT NULL,
    "is_renewal" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_rate_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rates" (
    "id" UUID NOT NULL,
    "hotel_id" UUID,
    "rate" DECIMAL(5,2) NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "source" "CommissionRateSource" NOT NULL,
    "request_id" UUID,
    "created_by" UUID NOT NULL,
    "last_reminder_days_before" SMALLINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commission_rate_requests_hotel_id_status_idx" ON "commission_rate_requests"("hotel_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "commission_rates_request_id_key" ON "commission_rates"("request_id");

-- CreateIndex
CREATE INDEX "commission_rates_hotel_id_effective_from_idx" ON "commission_rates"("hotel_id", "effective_from");

-- AddForeignKey
ALTER TABLE "commission_rate_requests" ADD CONSTRAINT "commission_rate_requests_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rate_requests" ADD CONSTRAINT "commission_rate_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rate_requests" ADD CONSTRAINT "commission_rate_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rates" ADD CONSTRAINT "commission_rates_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rates" ADD CONSTRAINT "commission_rates_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "commission_rate_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rates" ADD CONSTRAINT "commission_rates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
