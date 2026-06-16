import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { roleRights } from '../config/roles';
import { eachNightOfStay } from '../utils/dates';
import { availabilityService } from './availability.service';
import type { HotelSearchFilter, RoomTypeSearchFilter, HotelQueryOptions } from '../dto/hotel.dto';

export class HotelService {
  /**
   * Lấy khách sạn cho thao tác quản trị: chỉ chủ partner của khách sạn hoặc người có quyền
   * manageHotels (platform_manager/admin) được phép. Dùng chung cho mọi API quản lý
   * loại phòng / phòng / pricing rule.
   */
  getManagedHotel = async (hotelId: string, currentUser: User) => {
    const hotel = await prisma.hotel.findFirst({
      where: { id: hotelId, deletedAt: null },
      include: { partner: { select: { ownerId: true } } },
    });
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khách sạn');
    }
    const isOwner = hotel.partner.ownerId === currentUser.id;
    const canManage = (roleRights.get(currentUser.role) || []).includes('manageHotels');
    if (!isOwner && !canManage) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    return hotel;
  };

  /**
   * Tìm khách sạn theo thành phố. Nếu có khoảng ngày (checkIn/checkOut) thì chỉ trả về
   * khách sạn còn ít nhất một loại phòng trống đủ sức chứa trong suốt kỳ ở.
   */
  searchHotels = async (filter: HotelSearchFilter, options: HotelQueryOptions) => {
    const limit = options.limit || 10;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    // Chỉ tìm trong khách sạn đã được duyệt và đang mở bán
    const where: Prisma.HotelWhereInput = { isActive: true, isListed: true, deletedAt: null };
    if (filter.city) {
      where.city = { contains: filter.city, mode: 'insensitive' };
    }

    // Khách sạn phải có ít nhất một loại phòng đang bán đủ sức chứa
    const roomTypeWhere: Prisma.RoomTypeWhereInput = { isActive: true };
    if (filter.guests) {
      roomTypeWhere.maxOccupancy = { gte: filter.guests };
    }
    where.roomTypes = { some: roomTypeWhere };

    // Có khoảng ngày ⇒ tính tồn kho từng loại phòng ứng viên rồi chỉ giữ khách sạn còn phòng
    if (filter.checkIn && filter.checkOut) {
      const candidates = await prisma.roomType.findMany({
        where: { ...roomTypeWhere, hotel: where },
        select: { id: true, hotelId: true, basePrice: true },
      });
      const quotes = await availabilityService.getStayQuotes(candidates, filter.checkIn, filter.checkOut);
      const availableHotelIds = candidates
        .filter((candidate) => (quotes.get(candidate.id)?.availableRooms ?? 0) > 0)
        .map((candidate) => candidate.hotelId);
      where.id = { in: [...new Set(availableHotelIds)] };
    }

    let orderBy: Prisma.HotelOrderByWithRelationInput = { createdAt: 'desc' };
    if (options.sortBy) {
      const [field, direction] = options.sortBy.split(':');
      orderBy = { [field]: direction === 'desc' ? 'desc' : 'asc' };
    }

    const [hotels, totalResults] = await prisma.$transaction([
      prisma.hotel.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          roomTypes: { where: roomTypeWhere, select: { basePrice: true } },
        },
      }),
      prisma.hotel.count({ where }),
    ]);

    // Giá "từ" của khách sạn = basePrice thấp nhất trong các loại phòng phù hợp
    const results = hotels.map(({ roomTypes, ...hotel }) => ({
      ...hotel,
      minPrice: roomTypes.length > 0 ? Prisma.Decimal.min(...roomTypes.map((rt) => rt.basePrice)) : null,
    }));

    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  /**
   * Chi tiết một khách sạn cho trang profile của guest — public, chỉ trả khách sạn đang mở bán
   * (isActive + isListed, chưa xoá). Kèm toàn bộ ảnh, tiện nghi khách sạn và các loại phòng đang
   * bán (mỗi loại có ảnh + tiện nghi + giá gốc). Tồn kho/giá theo ngày lấy riêng qua getRoomTypes.
   */
  getHotelById = async (hotelId: string) => {
    const hotel = await prisma.hotel.findFirst({
      where: { id: hotelId, isActive: true, isListed: true, deletedAt: null },
      include: {
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        amenities: { include: { amenity: true } },
        roomTypes: {
          where: { isActive: true },
          orderBy: { basePrice: 'asc' },
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            amenities: { include: { amenity: true } },
          },
        },
      },
    });
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khách sạn');
    }
    return hotel;
  };

  /**
   * Tìm loại phòng trong một khách sạn theo bộ lọc (sức chứa, khoảng giá, loại giường, view).
   * Nếu có khoảng ngày thì kèm số phòng trống + tổng giá kỳ ở và loại bỏ loại phòng đã hết.
   */
  getRoomTypes = async (hotelId: string, filter: RoomTypeSearchFilter) => {
    const hotel = await prisma.hotel.findFirst({
      where: { id: hotelId, isActive: true, isListed: true, deletedAt: null },
    });
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khách sạn');
    }

    const where: Prisma.RoomTypeWhereInput = { hotelId, isActive: true };
    if (filter.guests) {
      where.maxOccupancy = { gte: filter.guests };
    }
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.basePrice = {
        ...(filter.minPrice !== undefined && { gte: filter.minPrice }),
        ...(filter.maxPrice !== undefined && { lte: filter.maxPrice }),
      };
    }
    if (filter.bedType) {
      where.bedType = { equals: filter.bedType, mode: 'insensitive' };
    }
    if (filter.viewType) {
      where.viewType = { equals: filter.viewType, mode: 'insensitive' };
    }

    const roomTypes = await prisma.roomType.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        amenities: { include: { amenity: true } },
      },
      orderBy: { basePrice: 'asc' },
    });

    // Không có khoảng ngày ⇒ trả về danh sách loại phòng, không kèm tồn kho
    if (!filter.checkIn || !filter.checkOut) {
      return roomTypes;
    }

    const quotes = await availabilityService.getStayQuotes(roomTypes, filter.checkIn, filter.checkOut);
    const numNights = eachNightOfStay(filter.checkIn, filter.checkOut).length;
    return roomTypes.flatMap((roomType) => {
      const quote = quotes.get(roomType.id);
      if (!quote || quote.availableRooms <= 0) {
        return [];
      }
      return [{ ...roomType, numNights, availableRooms: quote.availableRooms, totalPrice: quote.totalPrice }];
    });
  };
}

export const hotelService = new HotelService();
