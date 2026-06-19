import httpStatus from 'http-status';
import type { Prisma, User, RoomStatus } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { toUtcDate } from '../utils/dates';
import { hotelService } from './hotel.service';
import type { CreateRoomDto, UpdateRoomDto, RoomFilter, RoomQueryOptions } from '../dto/room.dto';

export class RoomService {
  /** Số phòng (room_number) phải duy nhất trong một khách sạn — schema chưa có unique nên check tay. */
  private assertRoomNumberFree = async (hotelId: string, roomNumber: string, excludeRoomId?: string) => {
    const duplicate = await prisma.room.findFirst({
      where: { hotelId, roomNumber, ...(excludeRoomId && { id: { not: excludeRoomId } }) },
    });
    if (duplicate) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Số phòng ${roomNumber} đã tồn tại trong khách sạn`);
    }
  };

  /**
   * Thêm phòng vật lý. Các đêm tương lai đã có dòng tồn kho (room_availability) được tăng
   * totalRooms theo — nếu không, đêm đó vẫn bán theo số phòng cũ dù đã thêm phòng mới.
   */
  createRoom = async (hotelId: string, currentUser: User, payload: CreateRoomDto) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const roomType = await prisma.roomType.findFirst({ where: { id: payload.roomTypeId, hotelId } });
    if (!roomType) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy loại phòng trong khách sạn này');
    }
    await this.assertRoomNumberFree(hotelId, payload.roomNumber);

    const today = toUtcDate(new Date());
    return prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          hotelId,
          roomTypeId: payload.roomTypeId,
          roomNumber: payload.roomNumber,
          floor: payload.floor ?? null,
          status: payload.status ?? 'available',
          notes: payload.notes ?? null,
        },
        include: { roomType: { select: { id: true, name: true } } },
      });
      await tx.roomAvailability.updateMany({
        where: { roomTypeId: payload.roomTypeId, date: { gte: today } },
        data: { totalRooms: { increment: 1 } },
      });
      return room;
    });
  };

  /** Cập nhật trạng thái vận hành (available/occupied/maintenance/cleaning), số phòng, tầng, ghi chú. */
  updateRoom = async (hotelId: string, roomId: string, currentUser: User, payload: UpdateRoomDto) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const room = await prisma.room.findFirst({ where: { id: roomId, hotelId } });
    if (!room) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy phòng trong khách sạn này');
    }
    if (payload.roomNumber && payload.roomNumber !== room.roomNumber) {
      await this.assertRoomNumberFree(hotelId, payload.roomNumber, roomId);
    }
    return prisma.room.update({
      where: { id: roomId },
      data: payload,
      include: { roomType: { select: { id: true, name: true } } },
    });
  };

  /**
   * Đổi trạng thái phòng (available/occupied/maintenance/cleaning) — cho STAFF (bản đồ phòng S20,
   * housekeeping 1-tap). Hẹp hơn updateRoom (không đổi được số phòng/tầng), nên dùng getOperableHotel.
   */
  updateRoomStatus = async (hotelId: string, roomId: string, currentUser: User, status: RoomStatus) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const room = await prisma.room.findFirst({ where: { id: roomId, hotelId } });
    if (!room) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy phòng trong khách sạn này');
    }
    return prisma.room.update({
      where: { id: roomId },
      data: { status },
      include: { roomType: { select: { id: true, name: true } } },
    });
  };

  /** Liệt kê phòng của khách sạn (cho bản đồ phòng), lọc theo trạng thái / loại phòng + phân trang. */
  listRooms = async (hotelId: string, currentUser: User, filter: RoomFilter, options: RoomQueryOptions) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const limit = options.limit || 50;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.RoomWhereInput = { hotelId };
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.roomTypeId) {
      where.roomTypeId = filter.roomTypeId;
    }

    let orderBy: Prisma.RoomOrderByWithRelationInput = { roomNumber: 'asc' };
    if (options.sortBy) {
      const [field, direction] = options.sortBy.split(':');
      orderBy = { [field]: direction === 'desc' ? 'desc' : 'asc' };
    }

    const [results, totalResults] = await prisma.$transaction([
      prisma.room.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { roomType: { select: { id: true, name: true } } },
      }),
      prisma.room.count({ where }),
    ]);

    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };
}

export const roomService = new RoomService();
