import httpStatus from 'http-status';
import type { Prisma, User, Room, RoomStatus } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { toUtcDate } from '../utils/dates';
import { hotelService } from './hotel.service';
import type { CreateRoomDto, UpdateRoomDto, RoomFilter, RoomQueryOptions } from '../dto/room.dto';

/** Phòng đang bảo trì không được tính vào tồn kho bán (xem SELLABLE_ROOM_WHERE ở availability.service). */
const isSellable = (status: RoomStatus) => status !== 'maintenance';

const roomTypeInclude = { roomType: { select: { id: true, name: true } } };

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
   * Cộng/trừ 1 phòng vào tồn kho các đêm TƯƠNG LAI đã có dòng room_availability. Đêm chưa có dòng
   * không cần đụng tới: lúc tạo dòng đó, tồn kho được đếm lại từ bảng rooms.
   */
  private shiftFutureInventory = async (tx: Prisma.TransactionClient, roomTypeId: string, delta: 1 | -1) => {
    const today = toUtcDate(new Date());
    await tx.roomAvailability.updateMany({
      where: { roomTypeId, date: { gte: today }, ...(delta === -1 && { totalRooms: { gt: 0 } }) },
      data: { totalRooms: delta === 1 ? { increment: 1 } : { decrement: 1 } },
    });
  };

  /**
   * Đồng bộ tồn kho khi trạng thái phòng đổi VÀO / RA khỏi 'maintenance'. Thiếu bước này thì bật
   * bảo trì chỉ đổi mỗi bảng rooms, còn khách vẫn tìm và đặt được phòng đang sửa — vỡ ra lúc lễ tân
   * bàn giao phòng (booking.service không tìm nổi phòng 'available' để gán).
   *
   * Đổi qua lại giữa available/occupied/cleaning thì không làm gì: cả ba đều thuộc tồn kho bán.
   */
  private syncInventoryOnStatusChange = async (
    tx: Prisma.TransactionClient,
    roomTypeId: string,
    oldStatus: RoomStatus,
    newStatus: RoomStatus
  ) => {
    if (isSellable(oldStatus) === isSellable(newStatus)) {
      return;
    }
    await this.shiftFutureInventory(tx, roomTypeId, isSellable(newStatus) ? 1 : -1);
  };

  /**
   * Thêm phòng vật lý. Các đêm tương lai đã có dòng tồn kho (room_availability) được tăng
   * totalRooms theo — nếu không, đêm đó vẫn bán theo số phòng cũ dù đã thêm phòng mới.
   * Phòng tạo ra đã ở trạng thái bảo trì thì chưa bán được nên không cộng tồn kho.
   */
  createRoom = async (hotelId: string, currentUser: User, payload: CreateRoomDto) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const roomType = await prisma.roomType.findFirst({ where: { id: payload.roomTypeId, hotelId } });
    if (!roomType) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy loại phòng trong khách sạn này');
    }
    await this.assertRoomNumberFree(hotelId, payload.roomNumber);

    const status = payload.status ?? 'available';
    return prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          hotelId,
          roomTypeId: payload.roomTypeId,
          roomNumber: payload.roomNumber,
          floor: payload.floor ?? null,
          status,
          notes: payload.notes ?? null,
        },
        include: roomTypeInclude,
      });
      if (isSellable(status)) {
        await this.shiftFutureInventory(tx, payload.roomTypeId, 1);
      }
      return room;
    });
  };

  /**
   * Đổi trạng thái phòng KÈM đồng bộ tồn kho, trong cùng một transaction. Dùng chung cho manager
   * (updateRoom) và staff (updateRoomStatus) để hai lối vào không thể xử lý lệch nhau.
   *
   * Ghi có điều kiện trên trạng thái cũ (giống lúc giành phòng ở booking.service): hai người cùng
   * bấm thì chỉ một người thắng, nhờ vậy tồn kho không bị cộng/trừ hai lần cho một lần chuyển.
   */
  private changeStatus = async (room: Room, newStatus: RoomStatus, otherFields: Prisma.RoomUpdateManyMutationInput) => {
    return prisma.$transaction(async (tx) => {
      const changed = await tx.room.updateMany({
        where: { id: room.id, status: room.status },
        data: { ...otherFields, status: newStatus },
      });
      if (changed.count === 0) {
        throw new ApiError(httpStatus.CONFLICT, 'Trạng thái phòng vừa được người khác thay đổi, vui lòng thử lại');
      }
      await this.syncInventoryOnStatusChange(tx, room.roomTypeId, room.status, newStatus);
      return tx.room.findUniqueOrThrow({ where: { id: room.id }, include: roomTypeInclude });
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

    const { status, ...otherFields } = payload;
    if (status !== undefined && status !== room.status) {
      return this.changeStatus(room, status, otherFields);
    }
    return prisma.room.update({ where: { id: roomId }, data: otherFields, include: roomTypeInclude });
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
    if (status === room.status) {
      return prisma.room.findUniqueOrThrow({ where: { id: roomId }, include: roomTypeInclude });
    }
    return this.changeStatus(room, status, {});
  };

  /**
   * Xoá phòng vật lý. CHỈ cho xoá khi phòng CHƯA từng được gán cho booking nào (không có booking_rooms)
   * — để không phá lịch sử lưu trú. Đã từng dùng thì nên đổi trạng thái sang maintenance thay vì xoá.
   * Khi xoá, trừ tồn kho các đêm tương lai tương ứng (ngược với lúc createRoom tăng totalRooms).
   */
  deleteRoom = async (hotelId: string, roomId: string, currentUser: User) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const room = await prisma.room.findFirst({ where: { id: roomId, hotelId } });
    if (!room) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy phòng trong khách sạn này');
    }
    const usedCount = await prisma.bookingRoom.count({ where: { roomId } });
    if (usedCount > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Phòng đã có lịch sử đặt, không thể xoá — hãy đổi trạng thái sang maintenance để ngừng dùng'
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.room.delete({ where: { id: roomId } });
      // Phòng đang bảo trì đã bị trừ khỏi tồn kho lúc bật maintenance ⇒ xoá đi không trừ nữa
      if (isSellable(room.status)) {
        await this.shiftFutureInventory(tx, room.roomTypeId, -1);
      }
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
