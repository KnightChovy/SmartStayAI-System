import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import type { RoomBlock, User } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { toUtcDate, eachDayInclusive } from '../utils/dates';
import { deriveRoomStatus } from '../utils/room-status';
import { hotelService } from './hotel.service';
import type { CreateRoomBlockDto, RoomBlockPreview, ShortageNight, AffectedBooking } from '../dto/room-block.dto';

/** Booking đang giữ chỗ thật sự — chỉ hai trạng thái này mới cần lo xếp lại phòng. */
const LIVE_BOOKING_STATUS: Prisma.BookingWhereInput['status'] = { in: ['confirmed', 'checked_in'] };

/**
 * Quản lý đợt chặn phòng (room_blocks) — "phòng đang sửa" theo KHOẢNG NGÀY thay vì một trạng thái
 * tức thời. Đây cũng là nơi DUY NHẤT trừ/cộng tồn kho vì lý do bảo trì: cột rooms.status không còn
 * tự đụng vào tồn kho nữa, nếu không sẽ trừ hai lần cho cùng một sự việc.
 */
export class RoomBlockService {
  /** Điều kiện "block còn hiệu lực trong ngày X": chưa xử lý xong VÀ ngày X nằm trong khoảng chặn. */
  private activeOnDate = (date: Date): Prisma.RoomBlockWhereInput => ({
    resolvedAt: null,
    startDate: { lte: date },
    endDate: { gte: date },
  });

  /** Điều kiện "block còn hiệu lực và trùng khoảng [start, end]". */
  private activeInRange = (start: Date, end: Date): Prisma.RoomBlockWhereInput => ({
    resolvedAt: null,
    startDate: { lte: end },
    endDate: { gte: start },
  });

  /**
   * Block đang có hiệu lực HÔM NAY của từng phòng — dùng để vẽ room map và suy ra rooms.status.
   * Một phòng có thể có nhiều block chồng nhau (hiếm); lấy cái tạo sau cùng để hiển thị.
   */
  getActiveBlocksToday = async (roomIds: string[]): Promise<Map<string, RoomBlock>> => {
    if (roomIds.length === 0) {
      return new Map();
    }
    const blocks = await prisma.roomBlock.findMany({
      where: { roomId: { in: roomIds }, ...this.activeOnDate(toUtcDate(new Date())) },
      orderBy: { createdAt: 'asc' },
    });
    // Ghi đè dần theo thứ tự tăng dần ⇒ block tạo sau cùng thắng
    return new Map(blocks.map((block) => [block.roomId, block]));
  };

  /**
   * Tính lại rooms.status từ 3 chiều rồi ghi đè. Gọi sau MỌI thay đổi fo/hk/block để cột status
   * (thứ mà check-in, tìm phòng và bộ lọc room map vẫn đang đọc) không bao giờ lệch với sự thật.
   */
  syncDisplayStatus = async (tx: Prisma.TransactionClient, roomId: string): Promise<void> => {
    const room = await tx.room.findUniqueOrThrow({
      where: { id: roomId },
      select: { foStatus: true, hkStatus: true },
    });
    const blockCount = await tx.roomBlock.count({
      where: { roomId, ...this.activeOnDate(toUtcDate(new Date())) },
    });
    await tx.room.update({ where: { id: roomId }, data: { status: deriveRoomStatus(room, blockCount > 0) } });
  };

  /**
   * Cộng/trừ tồn kho ĐÚNG những ngày bị chặn (khác cách cũ: bật maintenance là trừ mọi đêm tương lai
   * vô thời hạn). Chỉ OOO mới đụng tồn kho — OOS là ngưng phục vụ trong ngày, không rút phòng khỏi
   * kho bán.
   *
   * Đêm chưa có dòng room_availability thì không cần tạo: lúc đó tồn kho được đếm lại từ bảng rooms
   * và availability.service đã tự trừ block (xem countSellableRoomsPerDate).
   */
  private shiftInventoryForBlock = async (
    tx: Prisma.TransactionClient,
    block: Pick<RoomBlock, 'blockType' | 'startDate' | 'endDate'>,
    roomTypeId: string,
    delta: 1 | -1
  ): Promise<void> => {
    if (block.blockType !== 'ooo') {
      return;
    }
    const days = eachDayInclusive(block.startDate, block.endDate);
    if (days.length === 0) {
      return;
    }
    await tx.roomAvailability.updateMany({
      where: {
        roomTypeId,
        date: { in: days },
        // Không trừ xuống dưới 0. Total < booked thì VẪN cho phép (đó chính là tình trạng thiếu
        // phòng có thật, và preview đã cảnh báo trước rồi) — chỉ chặn số âm vô nghĩa.
        ...(delta === -1 && { totalRooms: { gt: 0 } }),
      },
      data: { totalRooms: delta === 1 ? { increment: 1 } : { decrement: 1 } },
    });
  };

  /** Phòng + loại phòng, đã kiểm tra thuộc đúng khách sạn của người thao tác. */
  private loadRoomForBlock = async (hotelId: string, roomId: string, currentUser: User) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    // Lọc kèm hotelId: đây là chỗ rò rỉ multi-tenant hay gặp nhất — biết roomId của khách sạn khác
    // là chặn được phòng của họ.
    const room = await prisma.room.findFirst({
      where: { id: roomId, hotelId },
      include: { roomType: { select: { id: true, name: true } } },
    });
    if (!room) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy phòng trong khách sạn này');
    }
    return room;
  };

  /**
   * Những booking đã được gán ĐÚNG phòng này và trùng khoảng chặn. Đây là các đơn chắc chắn phải
   * xếp lại phòng khác (booking chưa được gán phòng thì chỉ là con số tồn kho, xem shortageNights).
   *
   * Booking trùng khoảng chặn khi: nhận phòng <= ngày cuối bị chặn VÀ trả phòng > ngày đầu bị chặn
   * (ngày trả phòng không phải một đêm ngủ nên dùng dấu > chứ không phải >=).
   */
  private findAffectedBookings = async (roomId: string, start: Date, end: Date): Promise<AffectedBooking[]> => {
    const rows = await prisma.bookingRoom.findMany({
      where: {
        roomId,
        booking: {
          status: LIVE_BOOKING_STATUS,
          checkInDate: { lte: end },
          checkOutDate: { gt: start },
        },
      },
      select: {
        booking: {
          select: {
            id: true,
            bookingCode: true,
            checkInDate: true,
            checkOutDate: true,
            status: true,
            customer: { select: { fullName: true } },
          },
        },
      },
      orderBy: { booking: { checkInDate: 'asc' } },
    });

    return rows.map(({ booking }) => ({
      id: booking.id,
      bookingCode: booking.bookingCode,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      status: booking.status,
      guestName: booking.customer.fullName,
    }));
  };

  /**
   * Những ngày mà sau khi chặn sẽ KHÔNG ĐỦ phòng cho số booking đã nhận (booked > sellable).
   * Thường chỉ 1–2 ngày cao điểm chứ không phải cả khoảng, nên trả riêng từng ngày thay vì một
   * cảnh báo chung chung.
   *
   * @param excludeBlockId bỏ qua một block khi tính (dùng lúc xem trước việc GỠ block)
   */
  private computeShortage = async (
    roomTypeId: string,
    roomId: string,
    dto: Pick<CreateRoomBlockDto, 'blockType' | 'startDate' | 'endDate'>,
    excludeBlockId?: string
  ): Promise<ShortageNight[]> => {
    const days = eachDayInclusive(dto.startDate, dto.endDate);
    if (days.length === 0) {
      return [];
    }
    const start = days[0];
    const end = days[days.length - 1];

    const [activeRooms, existingBlocks, availabilityRows] = await Promise.all([
      prisma.room.findMany({ where: { roomTypeId, isActive: true }, select: { id: true } }),
      prisma.roomBlock.findMany({
        where: {
          blockType: 'ooo',
          room: { roomTypeId },
          ...(excludeBlockId && { id: { not: excludeBlockId } }),
          ...this.activeInRange(start, end),
        },
        select: { roomId: true, startDate: true, endDate: true },
      }),
      prisma.roomAvailability.findMany({
        where: { roomTypeId, date: { in: days } },
        select: { date: true, bookedRooms: true },
      }),
    ]);

    const bookedByDate = new Map(availabilityRows.map((row) => [row.date.getTime(), row.bookedRooms]));
    const nights: ShortageNight[] = [];

    for (const day of days) {
      const time = day.getTime();
      // Đếm PHÒNG bị chặn trong ngày, không đếm block — một phòng dính hai block chồng nhau vẫn
      // chỉ mất đúng một phòng khỏi kho.
      const blockedRooms = new Set(
        existingBlocks
          .filter((block) => block.startDate.getTime() <= time && block.endDate.getTime() >= time)
          .map((block) => block.roomId)
      );
      // Đợt chặn đang xét: chỉ OOO mới rút phòng khỏi kho bán
      if (dto.blockType === 'ooo') {
        blockedRooms.add(roomId);
      }

      const sellable = activeRooms.filter((room) => !blockedRooms.has(room.id)).length;
      const booked = bookedByDate.get(time) ?? 0;
      if (booked > sellable) {
        nights.push({ date: day, sellable, booked, shortage: booked - sellable });
      }
    }
    return nights;
  };

  /**
   * Xem trước hậu quả của việc chặn phòng, KHÔNG ghi gì. FE gọi mỗi khi user đổi ngày trong modal
   * (có debounce) để staff thấy cảnh báo TRƯỚC khi bấm xác nhận — thay vì tới ngày khách đến mới vỡ.
   */
  previewBlock = async (
    hotelId: string,
    roomId: string,
    currentUser: User,
    dto: CreateRoomBlockDto
  ): Promise<RoomBlockPreview> => {
    const room = await this.loadRoomForBlock(hotelId, roomId, currentUser);
    this.assertValidRange(dto);

    const [affectedBookings, shortageNights] = await Promise.all([
      this.findAffectedBookings(roomId, toUtcDate(dto.startDate), toUtcDate(dto.endDate)),
      this.computeShortage(room.roomTypeId, roomId, dto),
    ]);

    return {
      roomNumber: room.roomNumber,
      roomTypeName: room.roomType.name,
      affectedBookings,
      shortageNights,
    };
  };

  private assertValidRange = (dto: Pick<CreateRoomBlockDto, 'startDate' | 'endDate'>): void => {
    if (toUtcDate(dto.endDate) < toUtcDate(dto.startDate)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Ngày dự kiến xong không được trước ngày bắt đầu');
    }
  };

  /**
   * Chặn phòng thật. Trả kèm preview để staff thấy đúng thứ mình vừa gây ra (số booking bị ảnh
   * hưởng, những ngày thiếu phòng) — và để FE hiện danh sách cần xếp lại ngay sau khi chặn.
   */
  createBlock = async (hotelId: string, roomId: string, currentUser: User, dto: CreateRoomBlockDto) => {
    const room = await this.loadRoomForBlock(hotelId, roomId, currentUser);
    this.assertValidRange(dto);

    const startDate = toUtcDate(dto.startDate);
    const endDate = toUtcDate(dto.endDate);

    // Hai đợt chặn OOO chồng nhau trên CÙNG một phòng là vô nghĩa về mặt vật lý (phòng đã ngừng
    // bán rồi), và sẽ trừ tồn kho hai lần cho đúng một phòng. Bắt gia hạn/sửa đợt đang có thay vì
    // chồng thêm đợt mới.
    if (dto.blockType === 'ooo') {
      const overlapping = await prisma.roomBlock.findFirst({
        where: { roomId, blockType: 'ooo', ...this.activeInRange(startDate, endDate) },
        select: { id: true, startDate: true, endDate: true },
      });
      if (overlapping) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Phòng đã có đợt chặn ${overlapping.startDate.toISOString().slice(0, 10)} → ` +
            `${overlapping.endDate.toISOString().slice(0, 10)} trùng khoảng này — gỡ hoặc sửa đợt đó trước`
        );
      }
    }

    const preview = await this.previewBlock(hotelId, roomId, currentUser, dto);

    const block = await prisma.$transaction(async (tx) => {
      const created = await tx.roomBlock.create({
        data: {
          roomId,
          hotelId,
          blockType: dto.blockType,
          startDate,
          endDate,
          reason: dto.reason,
          estimatedCost: dto.estimatedCost === undefined ? null : new Prisma.Decimal(dto.estimatedCost),
          createdBy: currentUser.id,
        },
      });
      await tx.roomStatusHistory.create({
        data: {
          roomId,
          dimension: 'block',
          toValue: dto.blockType,
          expectedEndAt: endDate,
          changedBy: currentUser.id,
          reason: dto.reason,
        },
      });
      await this.shiftInventoryForBlock(tx, created, room.roomTypeId, -1);
      await this.syncDisplayStatus(tx, roomId);
      return created;
    });

    return { block, ...preview };
  };

  /**
   * Gỡ block (đã sửa xong) — KHÔNG xoá dòng, chỉ đánh dấu resolved để còn thống kê chi phí sự cố.
   * Trả tồn kho đúng những ngày CÒN LẠI của đợt chặn: ngày đã trôi qua thì không bán lại được nữa,
   * cộng vào chỉ làm phồng số liệu quá khứ.
   */
  resolveBlock = async (hotelId: string, roomId: string, blockId: string, currentUser: User) => {
    const room = await this.loadRoomForBlock(hotelId, roomId, currentUser);
    const block = await prisma.roomBlock.findFirst({ where: { id: blockId, roomId, hotelId } });
    if (!block) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy đợt chặn của phòng này');
    }
    if (block.resolvedAt) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Đợt chặn này đã được xử lý xong trước đó');
    }

    const today = toUtcDate(new Date());
    const restoreFrom = block.startDate > today ? block.startDate : today;

    return prisma.$transaction(async (tx) => {
      // Ghi có điều kiện (resolvedAt vẫn null): hai người cùng bấm "đã sửa xong" thì chỉ một bên
      // thắng, tồn kho không bị cộng lại hai lần.
      const resolved = await tx.roomBlock.updateMany({
        where: { id: blockId, resolvedAt: null },
        data: { resolvedAt: new Date(), resolvedBy: currentUser.id },
      });
      if (resolved.count === 0) {
        throw new ApiError(httpStatus.CONFLICT, 'Đợt chặn vừa được người khác xử lý, vui lòng tải lại');
      }

      if (restoreFrom <= block.endDate) {
        await this.shiftInventoryForBlock(
          tx,
          { blockType: block.blockType, startDate: restoreFrom, endDate: block.endDate },
          room.roomTypeId,
          1
        );
      }
      await tx.roomStatusHistory.updateMany({
        where: { roomId, dimension: 'block', endedAt: null },
        data: { endedAt: new Date() },
      });
      await this.syncDisplayStatus(tx, roomId);

      return tx.roomBlock.findUniqueOrThrow({ where: { id: blockId } });
    });
  };

  /** Danh sách đợt chặn của một khách sạn — mặc định chỉ những đợt chưa xử lý xong. */
  listBlocks = async (hotelId: string, currentUser: User, includeResolved = false) => {
    await hotelService.getOperableHotel(hotelId, currentUser);
    return prisma.roomBlock.findMany({
      where: { hotelId, ...(includeResolved ? {} : { resolvedAt: null }) },
      include: { room: { select: { id: true, roomNumber: true, floor: true } } },
      orderBy: [{ resolvedAt: 'asc' }, { startDate: 'asc' }],
    });
  };
}

export const roomBlockService = new RoomBlockService();
