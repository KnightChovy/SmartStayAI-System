import httpStatus from 'http-status';
import type { Prisma, User, HkStatus, RoomStatus } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { todayInVietnamDate, toUtcDate, eachDayInclusive } from '../utils/dates';
import { cleaningSlaLevel } from '../utils/room-status';
import { hotelService } from './hotel.service';
import { roomBlockService } from './room-block.service';
import { availabilityService } from './availability.service';
import type {
  CreateRoomDto,
  UpdateRoomDto,
  RoomFilter,
  RoomQueryOptions,
  InventoryCalendarRange,
} from '../dto/room.dto';

const roomTypeInclude = { roomType: { select: { id: true, name: true } } };

/**
 * Lời nhắc dùng chung cho mọi cửa còn nhận `status: 'maintenance'`.
 *
 * Trước đây các cửa này tự tạo một đợt chặn cứng 7 ngày với lý do bịa sẵn — người bấm không hề khai
 * ngày dự kiến xong, mà phòng thì biến mất khỏi kho bán suốt một tuần (dữ liệu deploy còn nguyên
 * vết). Bảo trì luôn phải có KHOẢNG NGÀY và LÝ DO THẬT, nên chỉ còn một đường vào duy nhất.
 */
const MAINTENANCE_NEEDS_BLOCK =
  'Phòng đang sửa phải khai khoảng ngày: dùng POST /hotels/{hotelId}/rooms/{roomId}/blocks ' +
  '(blockType, startDate, endDate, reason) thay vì đổi trạng thái phòng';

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
    const today = todayInVietnamDate();
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
    if (payload.status === 'maintenance') {
      throw new ApiError(httpStatus.BAD_REQUEST, MAINTENANCE_NEEDS_BLOCK);
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

  /**
   * @deprecated Lối vào CŨ của room map (`PATCH /rooms/:id/status`). Giữ lại để client cũ không gãy,
   * nhưng nay chỉ còn là bí danh của PATCH .../housekeeping — cột status không có chiều thời gian
   * nên mọi thứ liên quan tới NGÀY đều phải đi qua room_blocks.
   *
   *  - available   → buồng phòng báo phòng đã dọn xong ('clean')
   *  - cleaning    → buồng phòng nhận việc dọn (bắt đầu chạy SLA)
   *  - maintenance → TỪ CHỐI: phải khai khoảng ngày qua POST .../blocks
   *  - occupied    → TỪ CHỐI: phải đi kèm một booking, chỉ check-in mới tạo ra được. Bấm tay ở đây
   *                  sẽ làm lễ tân không bàn giao được phòng vì không còn phòng 'available' nào để
   *                  gán, dù thực tế phòng vẫn trống.
   *
   * KHÔNG còn tự gỡ đợt chặn khi bấm 'available': một cú bấm cho HÔM NAY từng xoá sạch cả những đợt
   * chặn của tuần sau do người khác đặt lịch. Muốn trả phòng về kho thì gỡ đúng đợt chặn đó
   * (DELETE .../blocks/{blockId}).
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
    if (status === 'maintenance') {
      throw new ApiError(httpStatus.BAD_REQUEST, MAINTENANCE_NEEDS_BLOCK);
    }
    if (room.foStatus === 'occupied') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Phòng đang có khách lưu trú — trả phòng ở mục Front desk trước khi đổi trạng thái'
      );
    }

    // 'clean' chứ không phải 'inspected': dọn xong không có nghĩa là đã được giám sát duyệt. Ghi
    // thẳng 'inspected' ở đây chính là lý do gần như mọi phòng trên deploy đang mang nhãn đã-duyệt
    // mà chưa ai kiểm tra bao giờ.
    return this.updateHousekeeping(hotelId, roomId, currentUser, status === 'cleaning' ? 'cleaning' : 'clean');
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
   * Lịch tồn kho THEO TỪNG ĐÊM: mỗi loại phòng × mỗi ngày còn bao nhiêu phòng bán được.
   *
   * Vì sao cần: `getStayQuotes` chỉ trả MIN của cả kỳ ở, nên màn lịch tồn kho của staff không có
   * nguồn nào để đọc — FE phải NHÂN BẢN công thức của BE từ 3 endpoint rời (rooms + room-blocks +
   * bookings). Mỗi lần BE đổi công thức là hai bên lệch nhau trong im lặng (đã xảy ra một lần).
   *
   * Dùng ĐÚNG công thức của availability.service để con số ở đây và số khách nhìn thấy lúc đặt phòng
   * không thể khác nhau:
   *  - đêm ĐÃ CÓ dòng room_availability → totalRooms − bookedRooms (dòng này đã trừ đợt chặn OOO rồi)
   *  - đêm CHƯA CÓ dòng                 → chưa ai đặt ⇒ đếm lại từ bảng rooms, trừ phòng đang bị chặn
   */
  getInventoryCalendar = async (hotelId: string, currentUser: User, range: InventoryCalendarRange) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    const days = eachDayInclusive(range.from, range.to);
    const roomTypes = await prisma.roomType.findMany({
      where: { hotelId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    if (roomTypes.length === 0 || days.length === 0) {
      return { from: toUtcDate(range.from), to: toUtcDate(range.to), results: [] };
    }

    const roomTypeIds = roomTypes.map((roomType) => roomType.id);
    const [sellableByNight, availabilityRows] = await Promise.all([
      availabilityService.countSellableRoomsPerDate(roomTypeIds, days),
      prisma.roomAvailability.findMany({
        where: { roomTypeId: { in: roomTypeIds }, date: { in: days } },
        select: { roomTypeId: true, date: true, totalRooms: true, bookedRooms: true },
      }),
    ]);
    const rowByKey = new Map(availabilityRows.map((row) => [`${row.roomTypeId}:${row.date.getTime()}`, row]));

    const results = roomTypes.flatMap((roomType) =>
      days.map((date) => {
        const key = `${roomType.id}:${date.getTime()}`;
        const row = rowByKey.get(key);
        const totalRooms = row ? row.totalRooms : sellableByNight.get(key) ?? 0;
        const bookedRooms = row ? row.bookedRooms : 0;
        return {
          roomTypeId: roomType.id,
          roomTypeName: roomType.name,
          date,
          totalRooms,
          bookedRooms,
          availableRooms: Math.max(0, totalRooms - bookedRooms),
          // Để FE phân biệt được số ĐÃ CHỐT trong bảng tồn kho với số suy ra từ bảng rooms — hai
          // nguồn này lệch nhau khi đối tác chỉnh tay totalRooms.
          source: row ? ('availability' as const) : ('derived' as const),
        };
      })
    );

    return { from: days[0], to: days[days.length - 1], results };
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
