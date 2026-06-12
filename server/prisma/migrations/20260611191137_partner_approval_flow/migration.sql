/*
  Warnings:

  - A unique constraint covering the columns `[room_type_id,date]` on the table `room_availability` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'partner_approved';

-- CreateTable
CREATE TABLE "hotel_room_configs" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "total_rooms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_room_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_room_config_types" (
    "id" UUID NOT NULL,
    "room_config_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_room_config_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hotel_room_configs_hotel_id_key" ON "hotel_room_configs"("hotel_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_availability_room_type_id_date_key" ON "room_availability"("room_type_id", "date");

-- AddForeignKey
ALTER TABLE "hotel_room_configs" ADD CONSTRAINT "hotel_room_configs_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_room_config_types" ADD CONSTRAINT "hotel_room_config_types_room_config_id_fkey" FOREIGN KEY ("room_config_id") REFERENCES "hotel_room_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
