import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { roleRights } from '../config/roles';
import { eachNightOfStay } from '../utils/dates';
import { availabilityService } from './availability.service';
import type {
  HotelSearchFilter,
  RoomTypeSearchFilter,
  HotelQueryOptions,
  UpdateHotelDto,
  HotelImageInput,
  HotelContactInput,
  HotelPolicyInput,
  HotelNearbyPlaceInput,
} from '../dto/hotel.dto';
import type { AmenityAssignmentInput } from '../dto/amenity.dto';

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
   * Lấy khách sạn cho thao tác VẬN HÀNH (xem booking, check-in/out): rộng hơn getManagedHotel.
   * Cho phép CHỦ partner, người có quyền manageBookings (platform_manager/admin), HOẶC nhân viên
   * đang được phân công vào đúng khách sạn này (hotel_staff_assignments còn hiệu lực). Vì staff cũng
   * phải làm được check-in/out nhưng không phải chủ và không có quyền toàn cục.
   */
  getOperableHotel = async (hotelId: string, currentUser: User) => {
    const hotel = await prisma.hotel.findFirst({
      where: { id: hotelId, deletedAt: null },
      include: { partner: { select: { ownerId: true } } },
    });
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khách sạn');
    }
    const isOwner = hotel.partner.ownerId === currentUser.id;
    const canManage = (roleRights.get(currentUser.role) || []).includes('manageBookings');
    if (isOwner || canManage) {
      return hotel;
    }
    const assignment = await prisma.hotelStaffAssignment.findFirst({
      where: { hotelId, userId: currentUser.id, unassignedAt: null },
    });
    if (!assignment) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    return hotel;
  };

  /**
   * Chi tiết một khách sạn cho CHỦ SỞ HỮU / manager — trả về BẤT KỂ trạng thái (kể cả chưa listed /
   * đang chờ duyệt), khác getHotelById (public chỉ trả KS đang bán). Quyền kiểm qua getManagedHotel.
   * Kèm toàn bộ ảnh, tiện nghi, và TẤT CẢ loại phòng (cả đã tắt) với ảnh + tiện nghi + số phòng.
   */
  getManagedHotelDetail = async (hotelId: string, currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.hotel.findUniqueOrThrow({
      where: { id: hotelId },
      include: {
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        amenities: { include: { amenity: true } },
        contacts: true,
        policies: true,
        nearbyPlaces: true,
        roomTypes: {
          orderBy: { basePrice: 'asc' },
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            amenities: { include: { amenity: true } },
            beds: true,
            _count: { select: { rooms: true } },
          },
        },
      },
    });
  };

  /**
   * Danh sách khách sạn của partner đang đăng nhập (theo ownerId = userId lấy từ token).
   * Quyền đã chặn ở route bằng auth() — controller truyền req.user.id, nên ở đây không kiểm lại.
   * Trả về CẢ khách sạn chưa mở bán / đang chờ duyệt (khác searchHotels public), chỉ bỏ khách sạn
   * đã xoá mềm. Kèm ảnh cover + số loại phòng / số phòng để hiển thị danh sách.
   */
  getHotelsByOwner = async (userId: string) => {
    return prisma.hotel.findMany({
      where: { partner: { ownerId: userId }, deletedAt: null },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { roomTypes: true, rooms: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  };

  /**
   * Partner tự BẬT/TẮT mở bán (publish) khách sạn của mình. Quyền kiểm qua getManagedHotel
   * (chỉ chủ KS hoặc manageHotels). Khi BẬT (isListed=true): khách sạn phải đã được duyệt (isActive)
   * và có ít nhất một loại phòng đang bật — tránh lên sàn khi chưa có phòng để bán. Khi TẮT: không ràng buộc.
   */
  setHotelListing = async (hotelId: string, isListed: boolean, currentUser: User) => {
    const hotel = await this.getManagedHotel(hotelId, currentUser);
    if (isListed) {
      if (!hotel.isActive) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Khách sạn chưa được duyệt nên chưa thể mở bán');
      }
      const activeRoomTypes = await prisma.roomType.count({ where: { hotelId, isActive: true } });
      if (activeRoomTypes === 0) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Cần có ít nhất một loại phòng đang bật (đã điền giá) trước khi mở bán'
        );
      }
    }
    return prisma.hotel.update({ where: { id: hotelId }, data: { isListed } });
  };

  /**
   * Partner cập nhật hồ sơ khách sạn của mình (name, mô tả, địa chỉ, toạ độ, sao, giờ nhận/trả...).
   * Quyền qua getManagedHotel. Joi ở routing đã chặn các trường khoá (isActive/isListed/pháp lý).
   */
  updateHotel = async (hotelId: string, payload: UpdateHotelDto, currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.hotel.update({ where: { id: hotelId }, data: payload });
  };

  /**
   * Thêm ảnh khách sạn (URL đã upload qua POST /v1/uploads). Nếu batch có ảnh isPrimary thì bỏ cờ
   * primary của các ảnh cũ để luôn chỉ có 1 ảnh chính.
   */
  addHotelImages = async (hotelId: string, images: HotelImageInput[], currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    const hasNewPrimary = images.some((image) => image.isPrimary);
    return prisma.$transaction(async (tx) => {
      if (hasNewPrimary) {
        await tx.hotelImage.updateMany({ where: { hotelId }, data: { isPrimary: false } });
      }
      await tx.hotelImage.createMany({
        data: images.map((image, index) => ({
          hotelId,
          url: image.url,
          imageCategory: image.imageCategory,
          caption: image.caption ?? null,
          isPrimary: image.isPrimary ?? false,
          sortOrder: image.sortOrder ?? index,
        })),
      });
      return tx.hotelImage.findMany({ where: { hotelId }, orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] });
    });
  };

  /** Xoá một ảnh khách sạn (kiểm ảnh thuộc đúng khách sạn của partner). */
  deleteHotelImage = async (hotelId: string, imageId: string, currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    const image = await prisma.hotelImage.findFirst({ where: { id: imageId, hotelId } });
    if (!image) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy ảnh trong khách sạn này');
    }
    await prisma.hotelImage.delete({ where: { id: imageId } });
  };

  /** Đặt một ảnh làm ảnh chính (bật isPrimary ảnh này, tắt isPrimary các ảnh còn lại). */
  setPrimaryHotelImage = async (hotelId: string, imageId: string, currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    const image = await prisma.hotelImage.findFirst({ where: { id: imageId, hotelId } });
    if (!image) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy ảnh trong khách sạn này');
    }
    return prisma.$transaction(async (tx) => {
      await tx.hotelImage.updateMany({ where: { hotelId }, data: { isPrimary: false } });
      return tx.hotelImage.update({ where: { id: imageId }, data: { isPrimary: true } });
    });
  };

  /** Danh sách tiện nghi đã gán cho khách sạn (kèm thông tin catalog). Quyền qua getManagedHotel. */
  getHotelAmenities = async (hotelId: string, currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.hotelAmenity.findMany({
      where: { hotelId },
      include: { amenity: true },
      orderBy: { amenity: { name: 'asc' } },
    });
  };

  /**
   * Gán lại TOÀN BỘ tiện nghi của khách sạn (thay thế, không cộng thêm) — client gửi danh sách cuối cùng,
   * mảng rỗng = bỏ hết. Mỗi dòng có thể kèm isFree/quantity. Kiểm mọi amenityId tồn tại trong catalog.
   */
  setHotelAmenities = async (hotelId: string, currentUser: User, amenities: AmenityAssignmentInput[]) => {
    await this.getManagedHotel(hotelId, currentUser);

    const amenityIds = amenities.map((item) => item.amenityId);
    if (amenityIds.length > 0) {
      const existingCount = await prisma.amenity.count({ where: { id: { in: amenityIds } } });
      if (existingCount !== amenityIds.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Có tiện nghi không tồn tại trong danh sách gửi lên');
      }
    }

    return prisma.$transaction(async (tx) => {
      await tx.hotelAmenity.deleteMany({ where: { hotelId } });
      if (amenities.length > 0) {
        await tx.hotelAmenity.createMany({
          data: amenities.map((item) => ({
            hotelId,
            amenityId: item.amenityId,
            isFree: item.isFree ?? true,
            quantity: item.quantity ?? null,
          })),
        });
      }
      return tx.hotelAmenity.findMany({
        where: { hotelId },
        include: { amenity: true },
        orderBy: { amenity: { name: 'asc' } },
      });
    });
  };

  /** Danh sách liên hệ của khách sạn (chủ KS / manageHotels). */
  getHotelContacts = async (hotelId: string, currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.hotelContact.findMany({ where: { hotelId }, orderBy: { createdAt: 'asc' } });
  };

  /** Gán lại TOÀN BỘ liên hệ của khách sạn (thay thế; mảng rỗng = xoá hết). */
  setHotelContacts = async (hotelId: string, currentUser: User, contacts: HotelContactInput[]) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.$transaction(async (tx) => {
      await tx.hotelContact.deleteMany({ where: { hotelId } });
      if (contacts.length > 0) {
        await tx.hotelContact.createMany({ data: contacts.map((c) => ({ hotelId, ...c })) });
      }
      return tx.hotelContact.findMany({ where: { hotelId }, orderBy: { createdAt: 'asc' } });
    });
  };

  /** Danh sách chính sách / phụ phí của khách sạn (chủ KS / manageHotels). */
  getHotelPolicies = async (hotelId: string, currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.hotelPolicy.findMany({ where: { hotelId }, orderBy: { createdAt: 'asc' } });
  };

  /** Gán lại TOÀN BỘ chính sách / phụ phí của khách sạn (thay thế; mảng rỗng = xoá hết). */
  setHotelPolicies = async (hotelId: string, currentUser: User, policies: HotelPolicyInput[]) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.$transaction(async (tx) => {
      await tx.hotelPolicy.deleteMany({ where: { hotelId } });
      if (policies.length > 0) {
        await tx.hotelPolicy.createMany({ data: policies.map((p) => ({ hotelId, ...p })) });
      }
      return tx.hotelPolicy.findMany({ where: { hotelId }, orderBy: { createdAt: 'asc' } });
    });
  };

  /** Danh sách địa điểm lân cận của khách sạn (chủ KS / manageHotels). */
  getHotelNearbyPlaces = async (hotelId: string, currentUser: User) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.hotelNearbyPlace.findMany({ where: { hotelId }, orderBy: { createdAt: 'asc' } });
  };

  /** Gán lại TOÀN BỘ địa điểm lân cận của khách sạn (thay thế; mảng rỗng = xoá hết). */
  setHotelNearbyPlaces = async (hotelId: string, currentUser: User, nearbyPlaces: HotelNearbyPlaceInput[]) => {
    await this.getManagedHotel(hotelId, currentUser);
    return prisma.$transaction(async (tx) => {
      await tx.hotelNearbyPlace.deleteMany({ where: { hotelId } });
      if (nearbyPlaces.length > 0) {
        await tx.hotelNearbyPlace.createMany({ data: nearbyPlaces.map((n) => ({ hotelId, ...n })) });
      }
      return tx.hotelNearbyPlace.findMany({ where: { hotelId }, orderBy: { createdAt: 'asc' } });
    });
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
        contacts: true,
        policies: true,
        nearbyPlaces: true,
        roomTypes: {
          where: { isActive: true },
          orderBy: { basePrice: 'asc' },
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            amenities: { include: { amenity: true } },
            beds: true,
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
        beds: true,
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
