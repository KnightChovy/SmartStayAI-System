import httpStatus from 'http-status';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { roleRights } from '../config/roles';
import { toUtcDate, eachNightOfStay } from '../utils/dates';
import { availabilityService } from './availability.service';
import type { CreateBookingDto, BookingFilter, BookingQueryOptions } from '../dto/booking.dto';

// Đặt tối đa bao nhiêu đêm cho một booking (chặn khoảng ngày vô lý)
const MAX_NIGHTS = 30;

// Booking pending phải thanh toán trong khoảng này, quá hạn thì tự nhả tồn kho
export const HOLD_MINUTES = 15;

// Quan hệ kèm theo khi trả booking về client
const bookingInclude = {
  hotel: { select: { id: true, name: true, address: true, city: true, checkInTime: true, checkOutTime: true } },
  roomType: { select: { id: true, name: true, bedType: true, viewType: true, maxOccupancy: true } },
} satisfies Prisma.BookingInclude;

// Mã booking dễ đọc cho khách; cột booking_code có unique constraint chặn trùng
const generateBookingCode = (): string =>
  `BK${Date.now().toString(36)}${randomBytes(3).toString('hex')}`.toUpperCase();

export class BookingService {
  /**
   * Tạo booking. Toàn bộ chạy trong một transaction:
   * mỗi đêm upsert dòng tồn kho rồi tăng bookedRooms CÓ ĐIỀU KIỆN (bookedRooms < totalRooms)
   * — hai khách đặt phòng cuối cùng cùng lúc thì chỉ một người thành công, không bị overbooking.
   */
  /**
   * Nhả tồn kho cho các booking pending đã quá hạn giữ chỗ (chưa thanh toán).
   * Gọi lười trước mỗi lần đặt mới + nên được cron gọi định kỳ. Mỗi booking xử lý
   * có điều kiện (status pending) để không trả tồn kho hai lần nếu chạy song song.
   * @returns số booking đã nhả
   */
  releaseExpiredHolds = async (): Promise<number> => {
    const now = new Date();
    const expired = await prisma.booking.findMany({
      where: { status: 'pending', holdExpiresAt: { lt: now } },
      select: { id: true, roomTypeId: true, checkInDate: true, checkOutDate: true },
    });

    let released = 0;
    for (const booking of expired) {
      const nights = eachNightOfStay(booking.checkInDate, booking.checkOutDate);
      // eslint-disable-next-line no-await-in-loop
      const done = await prisma.$transaction(async (tx) => {
        const cancelled = await tx.booking.updateMany({
          where: { id: booking.id, status: 'pending', holdExpiresAt: { lt: now } },
          data: { status: 'cancelled', cancelledAt: now, cancellationReason: 'Quá hạn thanh toán' },
        });
        if (cancelled.count === 0) {
          return false;
        }
        await tx.roomAvailability.updateMany({
          where: { roomTypeId: booking.roomTypeId, date: { in: nights }, bookedRooms: { gt: 0 } },
          data: { bookedRooms: { decrement: 1 } },
        });
        return true;
      });
      if (done) {
        released += 1;
      }
    }
    return released;
  };

  createBooking = async (customerId: string, payload: CreateBookingDto) => {
    // Dọn các giữ chỗ hết hạn trước để chúng không chiếm mất tồn kho của lượt đặt này
    await this.releaseExpiredHolds();

    const checkIn = toUtcDate(payload.checkInDate);
    const checkOut = toUtcDate(payload.checkOutDate);
    const today = toUtcDate(new Date());
    if (checkIn < today) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Ngày nhận phòng không được ở quá khứ');
    }
    const nights = eachNightOfStay(checkIn, checkOut);
    if (nights.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Ngày trả phòng phải sau ngày nhận phòng');
    }
    if (nights.length > MAX_NIGHTS) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Chỉ đặt được tối đa ${MAX_NIGHTS} đêm`);
    }

    const roomType = await prisma.roomType.findFirst({
      where: {
        id: payload.roomTypeId,
        hotelId: payload.hotelId,
        isActive: true,
        hotel: { isActive: true, isListed: true, deletedAt: null },
      },
    });
    if (!roomType) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy loại phòng trong khách sạn này');
    }
    if (payload.numGuests > roomType.maxOccupancy) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Loại phòng này chỉ chứa tối đa ${roomType.maxOccupancy} khách`);
    }

    // Giá từng đêm áp pricing rule giống hệt lúc search (xem availability.service.priceForNight)
    const pricingRules = await availabilityService.getActivePricingRules([roomType.hotelId]);
    const priceInput = { id: roomType.id, hotelId: roomType.hotelId, basePrice: roomType.basePrice };

    return prisma.$transaction(async (tx) => {
      const physicalRooms = await tx.room.count({ where: { roomTypeId: roomType.id } });
      if (physicalRooms === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Loại phòng này chưa mở bán');
      }

      let subtotal = new Prisma.Decimal(0);
      for (const night of nights) {
        // Đêm chưa có dòng tồn kho ⇒ tạo với totalRooms = số phòng vật lý (upsert là atomic nhờ unique constraint)
        const row = await tx.roomAvailability.upsert({
          where: { roomTypeId_date: { roomTypeId: roomType.id, date: night } },
          create: { roomTypeId: roomType.id, hotelId: roomType.hotelId, date: night, totalRooms: physicalRooms },
          update: {},
        });

        // Giữ phòng có điều kiện: WHERE bookedRooms < totalRooms được Postgres kiểm tra lại
        // sau khi lock dòng, nên booking song song không thể vượt quá tồn kho
        const reserved = await tx.roomAvailability.updateMany({
          where: { id: row.id, bookedRooms: { lt: row.totalRooms } },
          data: { bookedRooms: { increment: 1 } },
        });
        if (reserved.count === 0) {
          throw new ApiError(httpStatus.BAD_REQUEST, `Đã hết phòng đêm ${night.toISOString().slice(0, 10)}`);
        }

        subtotal = subtotal.add(availabilityService.priceForNight(priceInput, night, row, pricingRules, today));
      }

      return tx.booking.create({
        data: {
          bookingCode: generateBookingCode(),
          customerId,
          hotelId: roomType.hotelId,
          roomTypeId: roomType.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numNights: nights.length,
          numGuests: payload.numGuests,
          basePricePerNight: roomType.basePrice,
          subtotal,
          discountAmount: 0,
          totalAmount: subtotal,
          status: 'pending',
          source: 'website',
          specialRequests: payload.specialRequests || null,
          holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
        },
        include: bookingInclude,
      });
    });
  };

  /**
   * Huỷ booking (chủ booking hoặc người có quyền manageBookings).
   * Chỉ huỷ được khi đang pending/confirmed và trước ngày nhận phòng; tồn kho được trả lại.
   */
  cancelBooking = async (bookingId: string, currentUser: User, reason?: string) => {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy booking');
    }
    const isOwner = booking.customerId === currentUser.id;
    const canManage = (roleRights.get(currentUser.role) || []).includes('manageBookings');
    if (!isOwner && !canManage) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    const today = toUtcDate(new Date());
    if (toUtcDate(booking.checkInDate) <= today) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Chỉ được huỷ trước ngày nhận phòng');
    }

    const nights = eachNightOfStay(booking.checkInDate, booking.checkOutDate);
    return prisma.$transaction(async (tx) => {
      // Đổi trạng thái có điều kiện TRƯỚC: hai request huỷ song song thì chỉ một bên
      // đi tiếp, tồn kho không bị trả lại hai lần
      const cancelled = await tx.booking.updateMany({
        where: { id: bookingId, status: { in: ['pending', 'confirmed'] } },
        data: { status: 'cancelled', cancelledAt: new Date(), cancellationReason: reason || null },
      });
      if (cancelled.count === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Chỉ huỷ được booking đang chờ hoặc đã xác nhận');
      }

      await tx.roomAvailability.updateMany({
        where: { roomTypeId: booking.roomTypeId, date: { in: nights }, bookedRooms: { gt: 0 } },
        data: { bookedRooms: { decrement: 1 } },
      });

      return tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: bookingInclude });
    });
  };

  /** Liệt kê booking của user đang đăng nhập, lọc theo trạng thái + phân trang. */
  getMyBookings = async (customerId: string, filter: BookingFilter, options: BookingQueryOptions) => {
    const limit = options.limit || 10;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = { customerId };
    if (filter.status) {
      where.status = filter.status;
    }

    let orderBy: Prisma.BookingOrderByWithRelationInput = { createdAt: 'desc' };
    if (options.sortBy) {
      const [field, direction] = options.sortBy.split(':');
      orderBy = { [field]: direction === 'desc' ? 'desc' : 'asc' };
    }

    const [results, totalResults] = await prisma.$transaction([
      prisma.booking.findMany({ where, skip, take: limit, orderBy, include: bookingInclude }),
      prisma.booking.count({ where }),
    ]);

    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  /** Chi tiết một booking (chủ booking hoặc người có quyền manageBookings). */
  getBookingById = async (bookingId: string, currentUser: User) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: bookingInclude,
    });
    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy booking');
    }
    const isOwner = booking.customerId === currentUser.id;
    const canManage = (roleRights.get(currentUser.role) || []).includes('manageBookings');
    if (!isOwner && !canManage) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    return booking;
  };
}

export const bookingService = new BookingService();
