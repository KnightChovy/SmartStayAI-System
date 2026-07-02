import httpStatus from 'http-status';
import type { Prisma, User } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { hotelService } from './hotel.service';
import type { CreateRoomTypeDto, UpdateRoomTypeDto, RoomTypeImageInput, RoomBedInput } from '../dto/room-type.dto';
import type { AmenityAssignmentInput } from '../dto/amenity.dto';

// Quan hệ kèm theo khi trả loại phòng cho màn quản trị
const roomTypeInclude = {
  images: { orderBy: { sortOrder: 'asc' } },
  amenities: { include: { amenity: true } },
  beds: true,
  _count: { select: { rooms: true } },
} satisfies Prisma.RoomTypeInclude;

export class RoomTypeService {
  /** Tìm loại phòng thuộc đúng khách sạn, 404 nếu không có (chống truy cập chéo khách sạn). */
  private getOwnedRoomType = async (hotelId: string, roomTypeId: string) => {
    const roomType = await prisma.roomType.findFirst({ where: { id: roomTypeId, hotelId } });
    if (!roomType) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy loại phòng trong khách sạn này');
    }
    return roomType;
  };

  createRoomType = async (hotelId: string, currentUser: User, payload: CreateRoomTypeDto) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    return prisma.roomType.create({
      data: { hotelId, ...payload },
      include: roomTypeInclude,
    });
  };

  updateRoomType = async (hotelId: string, roomTypeId: string, currentUser: User, payload: UpdateRoomTypeDto) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    await this.getOwnedRoomType(hotelId, roomTypeId);
    return prisma.roomType.update({
      where: { id: roomTypeId },
      data: payload,
      include: roomTypeInclude,
    });
  };

  /**
   * Xoá loại phòng. CHỈ cho xoá khi loại phòng CHƯA có phòng vật lý nào VÀ chưa từng có booking
   * — để bảo toàn dữ liệu. Đã có phòng/booking thì nên TẮT bằng updateRoomType { isActive: false }
   * (ngừng bán) thay vì xoá.
   */
  deleteRoomType = async (hotelId: string, roomTypeId: string, currentUser: User) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    await this.getOwnedRoomType(hotelId, roomTypeId);

    const [roomCount, bookingCount] = await Promise.all([
      prisma.room.count({ where: { roomTypeId } }),
      prisma.booking.count({ where: { roomTypeId } }),
    ]);
    if (roomCount > 0 || bookingCount > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Loại phòng đã có phòng hoặc lịch sử đặt, không thể xoá — hãy tắt bằng isActive=false để ngừng bán'
      );
    }
    await prisma.roomType.delete({ where: { id: roomTypeId } });
  };

  /** Danh sách loại phòng cho partner quản lý — gồm cả loại đã tắt (isActive=false). */
  listRoomTypes = async (hotelId: string, currentUser: User) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    return prisma.roomType.findMany({
      where: { hotelId },
      include: roomTypeInclude,
      orderBy: { createdAt: 'asc' },
    });
  };

  /**
   * Thêm ảnh cho loại phòng (URL đã upload qua POST /v1/uploads).
   * Nếu batch có ảnh isPrimary thì bỏ cờ primary của các ảnh cũ để luôn chỉ có 1 ảnh chính.
   */
  addImages = async (hotelId: string, roomTypeId: string, currentUser: User, images: RoomTypeImageInput[]) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    await this.getOwnedRoomType(hotelId, roomTypeId);

    const hasNewPrimary = images.some((image) => image.isPrimary);
    return prisma.$transaction(async (tx) => {
      if (hasNewPrimary) {
        await tx.roomTypeImage.updateMany({ where: { roomTypeId }, data: { isPrimary: false } });
      }
      await tx.roomTypeImage.createMany({
        data: images.map((image, index) => ({
          roomTypeId,
          url: image.url,
          isPrimary: image.isPrimary ?? false,
          sortOrder: image.sortOrder ?? index,
        })),
      });
      return tx.roomTypeImage.findMany({ where: { roomTypeId }, orderBy: { sortOrder: 'asc' } });
    });
  };

  /**
   * Gán lại TOÀN BỘ tiện nghi của loại phòng (thay thế, không cộng thêm) — client gửi danh sách
   * cuối cùng, mảng rỗng = bỏ hết. Cách này tránh phải làm API thêm/xoá từng tiện nghi.
   */
  setAmenities = async (
    hotelId: string,
    roomTypeId: string,
    currentUser: User,
    amenities: AmenityAssignmentInput[]
  ) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    await this.getOwnedRoomType(hotelId, roomTypeId);

    const amenityIds = amenities.map((item) => item.amenityId);
    if (amenityIds.length > 0) {
      const existingCount = await prisma.amenity.count({ where: { id: { in: amenityIds } } });
      if (existingCount !== amenityIds.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Có tiện nghi không tồn tại trong danh sách gửi lên');
      }
    }

    return prisma.$transaction(async (tx) => {
      await tx.roomTypeAmenity.deleteMany({ where: { roomTypeId } });
      if (amenities.length > 0) {
        await tx.roomTypeAmenity.createMany({
          data: amenities.map((item) => ({
            roomTypeId,
            amenityId: item.amenityId,
            isFree: item.isFree ?? true,
            quantity: item.quantity ?? null,
          })),
        });
      }
      return tx.roomType.findUniqueOrThrow({ where: { id: roomTypeId }, include: roomTypeInclude });
    });
  };

  /** Danh sách cấu hình giường của loại phòng (chủ KS / manageHotels). */
  getBeds = async (hotelId: string, roomTypeId: string, currentUser: User) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    await this.getOwnedRoomType(hotelId, roomTypeId);
    return prisma.roomBed.findMany({ where: { roomTypeId }, orderBy: { createdAt: 'asc' } });
  };

  /** Gán lại TOÀN BỘ cấu hình giường của loại phòng (thay thế; mảng rỗng = xoá hết). */
  setBeds = async (hotelId: string, roomTypeId: string, currentUser: User, beds: RoomBedInput[]) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    await this.getOwnedRoomType(hotelId, roomTypeId);
    return prisma.$transaction(async (tx) => {
      await tx.roomBed.deleteMany({ where: { roomTypeId } });
      if (beds.length > 0) {
        await tx.roomBed.createMany({
          data: beds.map((bed) => ({ roomTypeId, bedType: bed.bedType, quantity: bed.quantity ?? 1 })),
        });
      }
      return tx.roomBed.findMany({ where: { roomTypeId }, orderBy: { createdAt: 'asc' } });
    });
  };
}

export const roomTypeService = new RoomTypeService();
