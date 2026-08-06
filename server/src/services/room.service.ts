import httpStatus from 'http-status';
import type { Prisma, User, HkStatus, RoomStatus } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { toUtcDate } from '../utils/dates';
import { cleaningSlaLevel } from '../utils/room-status';
import { hotelService } from './hotel.service';
import { roomBlockService } from './room-block.service';
import type { CreateRoomDto, UpdateRoomDto, RoomFilter, RoomQueryOptions } from '../dto/room.dto';

const roomTypeInclude = { roomType: { select: { id: true, name: true } } };

/**
 * Cột status cũ chỉ có 'maintenance' chứ không có ngày dự kiến xong. Khi ai đó vẫn bấm Maintenance
 * qua endpoint cũ, ta tạo một đợt chặn có hạn thay vì chặn vô thời hạn — quản lý vào sửa lại ngày
 * hoặc bấm "đã sửa xong" là hết. Bằng đúng số ngày mà migration dùng để backfill dữ liệu cũ.
 */
const LEGACY_BLOCK_DAYS = 7;
const LEGACY_BLOCK_REASON = 'Chặn nhanh từ Room map — chưa nhập ngày dự kiến xong';

export class RoomService {
  /**
   * Số phòng phải duy nhất trong một khách sạn. DB đã có unique constraint (đó mới là bảo đảm
   * thật), nhưng vẫn check trước để trả về lỗi 400 tiếng Việt — errorConverter chưa dịch mã lỗi
   * P2002 của Prisma nên để nó nổ lên sẽ thành 500 với thông báo khó hiểu.
   */
  private assertRoomNumberFree = async (hotelId: string, roomNumber: string, excludeRoomId?: string) => {
    const duplicate = await prisma.room.findFirst({
      where: { hotelId, roomNumber, ...(excludeRoomId && { id: { not: excludeRoomId } }) },
    });
    if (duplicate) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Số phòng ${roomNumber} đã tồn tại trong khách sạn`);
    }
  };

  /**
   * Cộng/trừ 1 phòng VẬT LÝ vào tồn kho các đêm tương lai đã có dòng room_availability. Đêm chưa có
   * dòng không cần đụng tới: lúc tạo dòng đó, tồn kho được đếm lại từ bảng rooms.
   *
   * Chỉ dùng cho việc thêm/xoá/ngừng dùng phòng. Bảo trì KHÔNG đi qua đây nữa — đợt chặn chỉ trừ
   * đúng khoảng ngày của nó (xem roomBlockService.shiftInventoryForBlock), trừ ở cả hai nơi là
   * trừ hai lần cho cùng một sự việc.
   */
  private shiftFutureInventory = async (tx: Prisma.TransactionClient, roomTypeId: string, delta: 1 | -1) => {
    const today = toUtcDate(new Date());
    await tx.roomAvailability.updateMany({
      where: { roomTypeId, date: { gte: today }, ...(delta === -1 && { totalRooms: { gt: 0 } }) },
      data: { totalRooms: delta === 1 ? { increment: 1 } : { decrement: 1 } },
    });
  };

  /**
   * Thêm phòng vật lý. Các đêm tương lai đã có dòng tồn kho được tăng totalRooms theo — nếu không,
   * đêm đó vẫn bán theo số phòng cũ dù đã thêm phòng mới.
   */
  createRoom = async (hotelId: string, currentUser: User, payload: CreateRoomDto) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const roomType = await prisma.roomType.findFirst({ where: { id: payload.roomTypeId, hotelId } });
    if (!roomType) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy loại phòng trong khách sạn này');
    }
    if (payload.status === 'occupied') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Không tạo phòng ở trạng thái "có khách" — trạng thái đó do check-in sinh ra'
      );
    }
    await this.assertRoomNumberFree(hotelId, payload.roomNumber);

    const room = await prisma.$transaction(async (tx) => {
      const created = await tx.room.create({
        data: {
          hotelId,
          roomTypeId: payload.roomTypeId,
          roomNumber: payload.roomNumber,
          floor: payload.floor ?? null,
          // Phòng mới coi như đã sạch; bảo trì thì xử lý bằng đợt chặn ngay bên dưới
          status: payload.status === 'cleaning' ? 'cleaning' : 'available',
          hkStatus: payload.status === 'cleaning' ? 'cleaning' : 'inspected',
          notes: payload.notes ?? null,
        },
        include: roomTypeInclude,
      });
      await this.shiftFutureInventory(tx, payload.roomTypeId, 1);
      return created;
    });

    if (payload.status === 'maintenance') {
      await this.blockForLegacyMaintenance(hotelId, room.id, currentUser);
      return prisma.room.findUniqueOrThrow({ where: { id: room.id }, include: roomTypeInclude });
    }
    return room;
  };

  /** Phòng thuộc đúng khách sạn của người thao tác, kèm SLA dọn của loại phòng. */
  private loadRoom = async (hotelId: string, roomId: string) => {
    const room = await prisma.room.findFirst({
      where: { id: roomId, hotelId },
      include: { roomType: { select: { id: true, name: true, cleaningDurationMinutes: true } } },
    });
    if (!room) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy phòng trong khách sạn này');
    }
    return room;
  };

  /**
   * Đổi trạng thái BUỒNG PHÒNG — chiều duy nhất staff được bấm trực tiếp.
   *
   * `hkExpectedUntil` tính Ở ĐÂY, từ cleaningDurationMinutes của loại phòng, không nhận từ client:
   * để client tự khai hạn thì cái deadline đó chẳng còn nghĩa lý gì. Hết hạn cũng KHÔNG tự trả phòng
   * về available — hết 30 phút không có nghĩa là phòng đã sạch, bán phòng bẩn là lỗi không chữa được.
   */
  updateHousekeeping = async (hotelId: string, roomId: string, currentUser: User, hkStatus: HkStatus) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const room = await this.loadRoom(hotelId, roomId);
    if (room.hkStatus === hkStatus) {
      return prisma.room.findUniqueOrThrow({ where: { id: roomId }, include: roomTypeInclude });
    }

    const now = new Date();
    const expectedUntil =
      hkStatus === 'cleaning' ? new Date(now.getTime() + room.roomType.cleaningDurationMinutes * 60_000) : null;

    return prisma.$transaction(async (tx) => {
      // Ghi có điều kiện trên giá trị cũ: hai người cùng bấm thì chỉ một người thắng, nhật ký
      // không sinh ra hai dòng mâu thuẫn cho cùng một lần chuyển.
      const changed = await tx.room.updateMany({
        where: { id: roomId, hkStatus: room.hkStatus },
        data: { hkStatus, hkStatusSince: now, hkExpectedUntil: expectedUntil },
      });
      if (changed.count === 0) {
        throw new ApiError(httpStatus.CONFLICT, 'Trạng thái phòng vừa được người khác thay đổi, vui lòng thử lại');
      }

      await tx.roomStatusHistory.updateMany({
        where: { roomId, dimension: 'hk', endedAt: null },
        data: { endedAt: now },
      });
      await tx.roomStatusHistory.create({
        data: {
          roomId,
          dimension: 'hk',
          fromValue: room.hkStatus,
          toValue: hkStatus,
          startedAt: now,
          expectedEndAt: expectedUntil,
          changedBy: currentUser.id,
        },
      });
      await roomBlockService.syncDisplayStatus(tx, roomId);
      return tx.room.findUniqueOrThrow({ where: { id: roomId }, include: roomTypeInclude });
    });
  };

  /** Bắc cầu cho lối vào cũ: bấm Maintenance mà không nhập ngày ⇒ chặn OOO có hạn LEGACY_BLOCK_DAYS. */
  private blockForLegacyMaintenance = async (hotelId: string, roomId: string, currentUser: User) => {
    const startDate = toUtcDate(new Date());
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + LEGACY_BLOCK_DAYS);
    return roomBlockService.createBlock(hotelId, roomId, currentUser, {
      blockType: 'ooo',
      startDate,
      endDate,
      reason: LEGACY_BLOCK_REASON,
    });
  };

  /**
   * Lối vào CŨ của room map (`PATCH /rooms/:id/status`) — giữ nguyên để FE hiện tại không gãy,
   * nhưng mỗi giá trị nay được dịch về đúng chiều của nó:
   *
   *  - available   → buồng phòng báo phòng đã sạch, đồng thời gỡ mọi đợt chặn còn hiệu lực
   *  - cleaning    → buồng phòng nhận việc dọn (bắt đầu chạy SLA)
   *  - maintenance → tạo đợt chặn có hạn (FE nên chuyển sang POST /blocks để nhập ngày + lý do thật)
   *  - occupied    → TỪ CHỐI: trạng thái này phải đi kèm một booking, chỉ check-in mới tạo ra được.
   *                  Bấm tay ở đây sẽ làm lễ tân không bàn giao được phòng vì không còn phòng
   *                  'available' nào để gán, dù thực tế phòng vẫn trống.
   */
  updateRoomStatus = async (hotelId: string, roomId: string, currentUser: User, status: RoomStatus) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const room = await this.loadRoom(hotelId, roomId);

    if (status === 'occupied') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Trạng thái "có khách" chỉ sinh ra từ check-in — đổi ở mục Front desk, không đổi ở bản đồ phòng'
      );
    }
    if (room.foStatus === 'occupied') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Phòng đang có khách lưu trú — trả phòng ở mục Front desk trước khi đổi trạng thái'
      );
    }

    if (status === 'maintenance') {
      await this.blockForLegacyMaintenance(hotelId, roomId, currentUser);
      return prisma.room.findUniqueOrThrow({ where: { id: roomId }, include: roomTypeInclude });
    }

    // 'available' nghĩa là phòng dùng được lại ⇒ gỡ luôn các đợt chặn còn hiệu lực, nếu không thì
    // block vẫn đè lên và staff bấm mãi vẫn thấy Maintenance.
    if (status === 'available') {
      const activeBlocks = await prisma.roomBlock.findMany({
        where: { roomId, resolvedAt: null },
        select: { id: true },
      });
      for (const block of activeBlocks) {
        // eslint-disable-next-line no-await-in-loop
        await roomBlockService.resolveBlock(hotelId, roomId, block.id, currentUser);
      }
    }

    return this.updateHousekeeping(hotelId, roomId, currentUser, status === 'cleaning' ? 'cleaning' : 'inspected');
  };

  /** Cập nhật thông tin phòng (số phòng, tầng, ghi chú, ngừng dùng) + trạng thái vận hành. */
  updateRoom = async (hotelId: string, roomId: string, currentUser: User, payload: UpdateRoomDto) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const room = await this.loadRoom(hotelId, roomId);
    if (payload.roomNumber && payload.roomNumber !== room.roomNumber) {
      await this.assertRoomNumberFree(hotelId, payload.roomNumber, roomId);
    }

    const { status, isActive, ...otherFields } = payload;

    if (isActive !== undefined && isActive !== room.isActive) {
      await prisma.$transaction(async (tx) => {
        await tx.room.update({ where: { id: roomId }, data: { isActive } });
        await this.shiftFutureInventory(tx, room.roomTypeId, isActive ? 1 : -1);
      });
    }
    if (Object.keys(otherFields).length > 0) {
      await prisma.room.update({ where: { id: roomId }, data: otherFields });
    }
    if (status !== undefined && status !== room.status) {
      return this.updateRoomStatus(hotelId, roomId, currentUser, status);
    }
    return prisma.room.findUniqueOrThrow({ where: { id: roomId }, include: roomTypeInclude });
  };

  /**
   * Xoá phòng vật lý. CHỈ khi phòng CHƯA từng được gán cho booking nào — đã dùng rồi thì xoá đi là
   * phá lịch sử lưu trú và báo cáo doanh thu, hãy đặt isActive = false.
   */
  deleteRoom = async (hotelId: string, roomId: string, currentUser: User) => {
    await hotelService.getManagedHotel(hotelId, currentUser);
    const room = await this.loadRoom(hotelId, roomId);

    const usedCount = await prisma.bookingRoom.count({ where: { roomId } });
    if (usedCount > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Phòng đã có lịch sử đặt, không thể xoá — hãy đặt isActive = false để ngừng dùng'
      );
    }
    // Đợt chặn đã trừ tồn kho theo khoảng ngày của nó; xoá phòng luôn thì phần trừ đó không còn
    // ai cộng lại. Bắt gỡ block trước để tồn kho không bị hụt vĩnh viễn.
    const openBlocks = await prisma.roomBlock.count({ where: { roomId, resolvedAt: null } });
    if (openBlocks > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Phòng đang có đợt chặn chưa xử lý — gỡ đợt chặn trước khi xoá');
    }

    await prisma.$transaction(async (tx) => {
      await tx.room.delete({ where: { id: roomId } });
      if (room.isActive) {
        await this.shiftFutureInventory(tx, room.roomTypeId, -1);
      }
    });
  };

  /**
   * Liệt kê phòng cho bản đồ phòng. Mỗi phòng kèm 3 chiều thật + đợt chặn đang hiệu lực + mức độ
   * trễ SLA dọn, để FE hiển thị "dự kiến xong ngày nào" và tô badge mà không phải tự suy luật.
   */
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
    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    let orderBy: Prisma.RoomOrderByWithRelationInput = { roomNumber: 'asc' };
    if (options.sortBy) {
      const [field, direction] = options.sortBy.split(':');
      orderBy = { [field]: direction === 'desc' ? 'desc' : 'asc' };
    }

    const [rooms, totalResults] = await prisma.$transaction([
      prisma.room.findMany({ where, skip, take: limit, orderBy, include: roomTypeInclude }),
      prisma.room.count({ where }),
    ]);

    // Một truy vấn chung cho cả trang thay vì mỗi phòng một lần (N+1)
    const activeBlocks = await roomBlockService.getActiveBlocksToday(rooms.map((room) => room.id));
    const now = new Date();
    const results = rooms.map((room) => ({
      ...room,
      activeBlock: activeBlocks.get(room.id) ?? null,
      cleaningSla: cleaningSlaLevel(room.hkStatus, room.hkStatusSince, room.hkExpectedUntil, now),
    }));

    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };
}

export const roomService = new RoomService();
