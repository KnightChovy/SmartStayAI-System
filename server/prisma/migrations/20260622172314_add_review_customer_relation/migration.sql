-- CreateEnum
CREATE TYPE "HousekeepingTaskStatus" AS ENUM ('pending', 'in_progress', 'done');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "hold_expires_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "housekeeping_tasks" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "booking_id" UUID,
    "status" "HousekeepingTaskStatus" NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "housekeeping_tasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "housekeeping_tasks" ADD CONSTRAINT "housekeeping_tasks_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housekeeping_tasks" ADD CONSTRAINT "housekeeping_tasks_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housekeeping_tasks" ADD CONSTRAINT "housekeeping_tasks_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
